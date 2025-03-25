import SockJS from 'sockjs-client';
import webstomp from 'webstomp-client';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.isConnected = false;
    this.subscriptions = new Map();
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(onConnected, onError) {
    try {
      // Cancela tentativas anteriores de reconexão
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      // Verifica se há token de autenticação
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Sem token de autenticação');
        if (onError) onError(new Error('Falha na autenticação para conexão WebSocket'));
        return;
      }
      
      // URL do WebSocket
      const socketUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/ws`;
      
      // Configurações mais robustas de socket
      const socket = new SockJS(socketUrl, null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
        timeout: 5000, // Timeout de 5 segundos
        xhrFields: { withCredentials: false }
      });
      
      // Desativa credenciais para evitar problemas de CORS
      if (socket.xhr && socket.xhr.withCredentials !== undefined) {
        socket.xhr.withCredentials = false;
      }
      
      // Configurações do STOMP
      this.stompClient = webstomp.over(socket, {
        debug: false,
        heartbeat: { 
          outgoing: 20000, 
          incoming: 20000 
        },
        reconnect: true // Tenta reconectar automaticamente
      });
      
      // Opções de conexão com token
      const connectHeaders = { 
        'Authorization': `Bearer ${token}`,
        'accept-version': '1.1,1.0',
        'heart-beat': '10000,10000'
      };
      
      // Tenta conectar
      this.stompClient.connect(
        connectHeaders,
        (frame) => {
          console.log('WebSocket conectado:', frame);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          if (onConnected) onConnected();
        },
        (error) => {
          console.error('Erro na conexão WebSocket:', error);
          this.isConnected = false;
          
          if (onError) onError(error);
          
          // Agenda reconexão
          this._scheduleReconnection(onConnected, onError);
        }
      );
      
      // Tratamento de fechamento da conexão
      socket.onclose = (event) => {
        console.warn('WebSocket fechado:', event);
        this.isConnected = false;
        
        if (event.code !== 1000) {
          this._scheduleReconnection(onConnected, onError);
        }
      };
    } catch (error) {
      console.error('Erro crítico na conexão WebSocket:', error);
      if (onError) onError(error);
    }
  }
  
  // Método de reconexão com backoff exponencial
  _scheduleReconnection(onConnected, onError) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Máximo de tentativas de reconexão atingido');
      return;
    }
    
    // Calcula tempo de espera com backoff exponencial
    const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
    
    console.log(`Tentando reconectar em ${delay}ms (Tentativa ${this.reconnectAttempts + 1})`);
    
    const self = this;
    this.reconnectTimeout = setTimeout(function() {
      self.reconnectAttempts++;
      self.connect(onConnected, onError);
    }, delay);
  }
  
    disconnect() {
      if (this.stompClient && this.isConnected) {
        this.subscriptions.forEach((_, destination) => {
          this.unsubscribe(destination);
        });
        
        try {
          this.stompClient.disconnect();
        } catch (error) {
          console.error("Error during disconnect:", error);
        }
        
        this.isConnected = false;
      }
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      this.connectionPromise = null;
    }
  
    subscribeToChamado(chamadoId, onMessageReceived) {
      if (!this.isConnected || !this.stompClient) {
        return false;
      }
      
      const destination = `/topic/chamado/${chamadoId}`;
      
      try {
        if (!this.subscriptions.has(destination)) {
          const subscription = this.stompClient.subscribe(destination, (message) => {
            try {
              const parsedMessage = JSON.parse(message.body);
              if (onMessageReceived) {
                onMessageReceived(parsedMessage);
              }
            } catch (error) {
              console.error("Error parsing message:", error);
            }
          });
          
          this.subscriptions.set(destination, subscription);
        }
        
        return true;
      } catch (error) {
        console.error("Error subscribing to chamado:", error);
        return false;
      }
    }
  
    unsubscribe(destination) {
      const subscription = this.subscriptions.get(destination);
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing:", error);
        }
        
        this.subscriptions.delete(destination);
      }
    }
  
    unsubscribeFromChamado(chamadoId) {
      const destination = `/topic/chamado/${chamadoId}`;
      this.unsubscribe(destination);
    }
  
    sendMessage(destination, message) {
      if (!this.isConnected || !this.stompClient) {
        return this.connect().then(() => this._sendMessageInternal(destination, message))
          .catch(() => false);
      }
      
      return this._sendMessageInternal(destination, message);
    }
    
    _sendMessageInternal(destination, message) {
      try {
        if (destination.startsWith('/')) {
          this.stompClient.send(destination, JSON.stringify(message));
        } else {
          this.stompClient.send(`/app/${destination}`, JSON.stringify(message));
        }
        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        return false;
      }
    }
  
    addUser(chamadoId, user) {
      return this.sendMessage(`chat.addUser/${chamadoId}`, user);
    }
    
    subscribeToNotifications(userId, username, onNotificationReceived) {
      if (!this.isConnected || !this.stompClient || !username) {
        return false;
      }
      
      const destination = `/user/${username}/queue/notifications`;
      
      try {
        if (!this.subscriptions.has(destination)) {
          const subscription = this.stompClient.subscribe(destination, (message) => {
            try {
              const parsedNotification = JSON.parse(message.body);
              if (onNotificationReceived) {
                onNotificationReceived(parsedNotification);
              }
            } catch (error) {
              console.error('Erro ao parsear notificação:', error);
            }
          });
          
          this.subscriptions.set(destination, subscription);
        }
        
        return true;
      } catch (error) {
        console.error('Erro ao inscrever em notificações:', error);
        return false;
      }
    }
    
    subscribeToGlobalNotifications(onNotificationReceived) {
      const destination = '/topic/notifications';
      
      try {
        if (!this.subscriptions.has(destination)) {
          const subscription = this.stompClient.subscribe(destination, (message) => {
            try {
              const parsedNotification = JSON.parse(message.body);
              if (onNotificationReceived) {
                onNotificationReceived(parsedNotification);
              }
            } catch (error) {
              console.error("Error parsing global notification:", error);
            }
          });
          
          this.subscriptions.set(destination, subscription);
        }
        
        return true;
      } catch (error) {
        console.error("Error subscribing to global notifications:", error);
        return false;
      }
    }
}

const websocketService = new WebSocketService();

export default websocketService;