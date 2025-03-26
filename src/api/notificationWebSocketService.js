import SockJS from 'sockjs-client';
import webstomp from 'webstomp-client';
import notificationService from './notificationService';

class NotificationWebSocketService {
  constructor() {
    this.stompClient = null;
    this.isConnected = false;
    this.subscriptions = new Map();
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.notificationCallbacks = [];
  }

  connect(onConnected, onError) {
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        if (onError) onError(new Error('Falha na autenticação para conexão WebSocket'));
        return;
      }
      
      const socketUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/ws`;
      
      // Configurações para SockJS com tratamento adequado para CORS
      const socket = new SockJS(socketUrl, null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
        timeout: 5000
      });
      
      // Ativar modo de debug temporariamente para ver os detalhes das mensagens
      this.stompClient = webstomp.over(socket, {
        debug: true,
        heartbeat: { outgoing: 20000, incoming: 20000 },
        reconnect: true
      });
      
      // Cabeçalhos otimizados para conexão
      const connectHeaders = { 
        'Authorization': `Bearer ${token}`,
        'accept-version': '1.1,1.0',
        'heart-beat': '10000,10000'
      };
      
      console.log("Conectando WebSocket com cabeçalhos:", JSON.stringify(connectHeaders));
      
      this.stompClient.connect(
        connectHeaders,
        (frame) => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          if (onConnected) onConnected();
        },
        (error) => {
          this.isConnected = false;
          if (onError) onError(error);
          this._scheduleReconnection(onConnected, onError);
        }
      );
      
      socket.onclose = (event) => {
        this.isConnected = false;
        if (event.code !== 1000) {
          this._scheduleReconnection(onConnected, onError);
        }
      };
    } catch (error) {
      if (onError) onError(error);
    }
  }
  
  _scheduleReconnection(onConnected, onError) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }
    
    const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
    
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
  }
  
  addNotificationCallback(callback) {
    if (typeof callback === 'function' && !this.notificationCallbacks.includes(callback)) {
      this.notificationCallbacks.push(callback);
    }
  }
  
  removeNotificationCallback(callback) {
    this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
  }
  
  _notifyCallbacks(notification) {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Erro ao executar callback de notificação:', error);
      }
    });
  }
  
  subscribeToUserNotifications(username) {
    if (!this.isConnected || !this.stompClient || !username) {
      console.warn(`Não foi possível assinar notificações para ${username}: WebSocket não conectado ou nome de usuário inválido`);
      return false;
    }
    
    const destination = `/user/${username}/queue/notifications`;
    console.log(`Tentando assinar notificações para usuário: ${username} no destino: ${destination}`);
    
    try {
      if (!this.subscriptions.has(destination)) {
        console.log(`Criando nova subscrição para ${destination}`);
        
        const subscription = this.stompClient.subscribe(destination, (message) => {
          console.log(`Mensagem recebida em ${destination}:`, message);
          try {
            const notification = JSON.parse(message.body);
            console.log(`Notificação processada:`, notification);
            this._notifyCallbacks(notification);
          } catch (error) {
            console.error('Erro ao processar notificação pessoal:', error);
          }
        }, { id: `user-notif-${Date.now()}` });
        
        this.subscriptions.set(destination, subscription);
        console.log(`Subscrição criada com sucesso para ${destination}`);
      } else {
        console.log(`Já existe uma subscrição ativa para ${destination}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Erro ao assinar notificações pessoais para ${username}:`, error);
      return false;
    }
  }
  
  subscribeToGlobalNotifications() {
    if (!this.isConnected || !this.stompClient) {
      return false;
    }
    
    const destination = '/topic/notifications';
    
    try {
      if (!this.subscriptions.has(destination)) {
        const subscription = this.stompClient.subscribe(destination, (message) => {
          try {
            const notification = JSON.parse(message.body);
            this._notifyCallbacks(notification);
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
}

const notificationWebSocketService = new NotificationWebSocketService();

export default notificationWebSocketService;