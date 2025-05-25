import SockJS from 'sockjs-client';
import webstomp from 'webstomp-client';

class NotificationWebSocketService {
  constructor() {
    this.stompClient = null;
    this.isConnected = false;
    this.subscriptions = new Map();
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.notificationCallbacks = [];
    this.debug = false;
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    this.connectionState = 'DISCONNECTED';
    this.heartbeatInterval = null;
    this.connecting = false;
  }

  connect(onConnected, onError) {
    if (this.connecting || this.isConnected) {
      console.warn('WebSocket já está conectando ou conectado');
      return;
    }

    this.connecting = true;
    this.connectionState = 'CONNECTING';

    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        this.connecting = false;
        this.connectionState = 'DISCONNECTED';
        if (onError) onError(new Error('Token não encontrado'));
        return;
      }
      
      const socketUrl = `${this.baseUrl}/ws`;
      
      const socket = new SockJS(socketUrl, null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
        timeout: 10000
      });
      
      this.stompClient = webstomp.over(socket, {
        debug: this.debug,
        heartbeat: { outgoing: 30000, incoming: 30000 }
      });
      
      if (!this.debug) {
        this.stompClient.debug = () => {};
      }
      
      const connectHeaders = { 
        'Authorization': `Bearer ${token}`,
        'accept-version': '1.1,1.0',
        'heart-beat': '30000,30000'
      };
      
      this.stompClient.connect(
        connectHeaders,
        (frame) => {
          this.isConnected = true;
          this.connecting = false;
          this.connectionState = 'CONNECTED';
          this.reconnectAttempts = 0;
          
          this._startHeartbeat();
          
          if (onConnected) onConnected(frame);
          
          this._resubscribeAll();
        },
        (error) => {
          this.isConnected = false;
          this.connecting = false;
          this.connectionState = 'DISCONNECTED';
          this._stopHeartbeat();
          
          if (onError) onError(error);
          
          this._scheduleReconnection(onConnected, onError);
        }
      );
      
      socket.onclose = (event) => {
        this.isConnected = false;
        this.connecting = false;
        this._stopHeartbeat();
        
        if (this.connectionState === 'CONNECTED' && event.code !== 1000) {
          this.connectionState = 'DISCONNECTED';
          this._scheduleReconnection(onConnected, onError);
        }
      };

      socket.onerror = (error) => {
        this.isConnected = false;
        this.connecting = false;
        this.connectionState = 'DISCONNECTED';
        this._stopHeartbeat();
      };
      
    } catch (error) {
      this.connecting = false;
      this.connectionState = 'DISCONNECTED';
      if (onError) onError(error);
    }
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.stompClient) {
        try {
          this.stompClient.send('/app/ping', '{}');
        } catch (error) {
          console.warn('Erro no heartbeat:', error);
        }
      }
    }, 25000);
  }

  _stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  _scheduleReconnection(onConnected, onError) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Máximo de tentativas de reconexão atingido');
      return;
    }
    
    if (this.reconnectTimeout) return;
    
    this.connectionState = 'RECONNECTING';
    
    const delay = Math.min(10000, 2000 * Math.pow(2, this.reconnectAttempts));
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.reconnectAttempts++;
      this.connect(onConnected, onError);
    }, delay);
  }
  
  _resubscribeAll() {
    const subscriptionsToRestore = [...this.subscriptions.entries()];
    this.subscriptions.clear();
    
    subscriptionsToRestore.forEach(([destination, metadata]) => {
      try {
        const { callback, headers } = metadata;
        this.subscribe(destination, callback, headers);
      } catch (error) {
        console.error(`Erro ao restaurar assinatura para ${destination}:`, error);
      }
    });
  }

  disconnect() {
    this._stopHeartbeat();
    this.connecting = false;
    
    if (this.stompClient && this.isConnected) {
      this.subscriptions.forEach((metadata, destination) => {
        this.unsubscribe(destination);
      });
      
      try {
        this.stompClient.disconnect(() => {
          console.log('Desconectado do WebSocket');
        });
      } catch (error) {
        console.error("Erro ao desconectar:", error);
      }
      
      this.isConnected = false;
      this.connectionState = 'DISCONNECTED';
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  subscribe(destination, callback, headers = {}) {
    if (!this.isConnected || !this.stompClient) {
      console.warn(`Não foi possível assinar ${destination}: WebSocket não conectado`);
      return false;
    }
    
    try {
      if (!this.subscriptions.has(destination)) {
        const subscription = this.stompClient.subscribe(destination, (message) => {
          try {
            const payload = JSON.parse(message.body);
            if (callback) {
              callback(payload);
            }
          } catch (error) {
            console.error(`Erro ao processar mensagem de ${destination}:`, error);
          }
        }, headers);
        
        this.subscriptions.set(destination, {
          subscription,
          callback,
          headers
        });
        
        return true;
      }
      
      return true;
    } catch (error) {
      console.error(`Erro ao assinar ${destination}:`, error);
      return false;
    }
  }
  
  unsubscribe(destination) {
    const metadata = this.subscriptions.get(destination);
    if (metadata && metadata.subscription) {
      try {
        metadata.subscription.unsubscribe();
      } catch (error) {
        console.error(`Erro ao cancelar assinatura para ${destination}:`, error);
      }
      
      this.subscriptions.delete(destination);
      return true;
    }
    return false;
  }
  
  addNotificationCallback(callback) {
    if (typeof callback === 'function' && !this.notificationCallbacks.includes(callback)) {
      this.notificationCallbacks.push(callback);
      return true;
    }
    return false;
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
  
  subscribeToUserNotifications(userId, username) {
    if (!this.isConnected || !this.stompClient || !userId || !username) {
      return false;
    }
    
    const userDestination = `/user/${username}/queue/notifications`;
    const userSubscribed = this.subscribe(userDestination, (notification) => {
      this._notifyCallbacks(notification);
    });
    
    const idDestination = `/user/${userId}/queue/notifications`;
    if (idDestination !== userDestination) {
      const idSubscribed = this.subscribe(idDestination, (notification) => {
        this._notifyCallbacks(notification);
      });
      
      return userSubscribed || idSubscribed;
    }
    
    return userSubscribed;
  }
  
  subscribeToGlobalNotifications() {
    const destination = '/topic/notifications';
    return this.subscribe(destination, (notification) => {
      this._notifyCallbacks(notification);
    });
  }
  
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      state: this.connectionState,
      subscriptions: this.subscriptions.size
    };
  }
}

const notificationWebSocketService = new NotificationWebSocketService();

export default notificationWebSocketService;