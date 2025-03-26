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
      // Cancela tentativas anteriores de reconexão
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      // Verifica se há token de autenticação
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Sem token de autenticação para WebSocket de notificações');
        if (onError) onError(new Error('Falha na autenticação para conexão WebSocket de notificações'));
        return;
      }
      
      // URL do WebSocket
      const socketUrl = `${process.env.REACT_APP_API_URL || 'https://plataforma-chamados-helps-production.up.railway.app'}/ws`
      
      // Configurações robustas de socket
      const socket = new SockJS(socketUrl, null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
        timeout: 5000,
        xhrFields: { withCredentials: false }
      });
      
      // Desativa credenciais para evitar problemas de CORS
      if (socket.xhr && socket.xhr.withCredentials !== undefined) {
        socket.xhr.withCredentials = false;
      }
      
      // Configurações do STOMP
      this.stompClient = webstomp.over(socket, {
        debug: false,
        heartbeat: { outgoing: 20000, incoming: 20000 },
        reconnect: true
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
          console.log('WebSocket de notificações conectado:', frame);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          if (onConnected) onConnected();
        },
        (error) => {
          console.error('Erro na conexão WebSocket de notificações:', error);
          this.isConnected = false;
          
          if (onError) onError(error);
          
          // Agenda reconexão
          this._scheduleReconnection(onConnected, onError);
        }
      );
      
      // Tratamento de fechamento da conexão
      socket.onclose = (event) => {
        console.warn('WebSocket de notificações fechado:', event);
        this.isConnected = false;
        
        if (event.code !== 1000) {
          this._scheduleReconnection(onConnected, onError);
        }
      };
    } catch (error) {
      console.error('Erro crítico na conexão WebSocket de notificações:', error);
      if (onError) onError(error);
    }
  }
  
  // Método de reconexão com backoff exponencial
  _scheduleReconnection(onConnected, onError) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Máximo de tentativas de reconexão atingido para notificações');
      return;
    }
    
    // Calcula tempo de espera com backoff exponencial
    const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
    
    console.log(`Tentando reconectar WebSocket de notificações em ${delay}ms (Tentativa ${this.reconnectAttempts + 1})`);
    
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
        console.error("Erro ao desconectar WebSocket de notificações:", error);
      }
      
      this.isConnected = false;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  // Adicionar callback para receber notificações
  addNotificationCallback(callback) {
    if (typeof callback === 'function' && !this.notificationCallbacks.includes(callback)) {
      this.notificationCallbacks.push(callback);
    }
  }
  
  // Remover callback
  removeNotificationCallback(callback) {
    this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
  }
  
  // Enviar notificação para todos os callbacks registrados
  _notifyCallbacks(notification) {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Erro ao executar callback de notificação:', error);
      }
    });
  }
  
  // Assinar tópico de notificações pessoais
  subscribeToUserNotifications(username) {
    if (!this.isConnected || !this.stompClient || !username) {
      console.warn('Não foi possível assinar notificações: WebSocket não conectado ou nome de usuário ausente');
      return false;
    }
    
    const destination = `/user/${username}/queue/notifications`;
    
    try {
      if (!this.subscriptions.has(destination)) {
        console.log(`Assinando notificações pessoais para ${username} em ${destination}`);
        
        const subscription = this.stompClient.subscribe(destination, (message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log('Notificação pessoal recebida:', notification);
            this._notifyCallbacks(notification);
          } catch (error) {
            console.error('Erro ao processar notificação pessoal:', error);
          }
        });
        
        this.subscriptions.set(destination, subscription);
        return true;
      }
      return true;
    } catch (error) {
      console.error('Erro ao assinar notificações pessoais:', error);
      return false;
    }
  }
  
  // Assinar tópico de notificações globais
  subscribeToGlobalNotifications() {
    if (!this.isConnected || !this.stompClient) {
      console.warn('Não foi possível assinar notificações globais: WebSocket não conectado');
      return false;
    }
    
    const destination = '/topic/notifications';
    
    try {
      if (!this.subscriptions.has(destination)) {
        console.log(`Assinando notificações globais em ${destination}`);
        
        const subscription = this.stompClient.subscribe(destination, (message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log('Notificação global recebida:', notification);
            this._notifyCallbacks(notification);
          } catch (error) {
            console.error('Erro ao processar notificação global:', error);
          }
        });
        
        this.subscriptions.set(destination, subscription);
        return true;
      }
      return true;
    } catch (error) {
      console.error('Erro ao assinar notificações globais:', error);
      return false;
    }
  }
  
  // Cancelar assinatura
  unsubscribe(destination) {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      try {
        subscription.unsubscribe();
        console.log(`Assinatura cancelada para ${destination}`);
      } catch (error) {
        console.error(`Erro ao cancelar assinatura para ${destination}:`, error);
      }
      
      this.subscriptions.delete(destination);
    }
  }
}

// Singleton para compartilhar a mesma instância em toda a aplicação
const notificationWebSocketService = new NotificationWebSocketService();

export default notificationWebSocketService;