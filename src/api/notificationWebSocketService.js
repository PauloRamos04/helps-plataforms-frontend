import SockJS from 'sockjs-client';
import webstomp from 'webstomp-client';

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
        if (onError) onError(new Error('Falha na autenticação para conexão WebSocket de notificações'));
        return;
      }
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const socketUrl = `${apiUrl}/ws`;
      
      const socket = new SockJS(socketUrl, null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
        timeout: 5000
      });
      
      this.stompClient = webstomp.over(socket, {
        debug: false,
        heartbeat: { outgoing: 20000, incoming: 20000 }
      });
      
      const connectHeaders = { 
        'Authorization': `Bearer ${token}`,
        'accept-version': '1.1,1.0',
        'heart-beat': '10000,10000'
      };
      
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
        // Silent error
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
        // Silent error
      }
    });
  }
  
  subscribeToUserNotifications(username) {
    if (!this.isConnected || !this.stompClient || !username) {
      return false;
    }
    
    const destination = `/user/${username}/queue/notifications`;
    
    try {
      if (!this.subscriptions.has(destination)) {
        const subscription = this.stompClient.subscribe(destination, (message) => {
          try {
            const notification = JSON.parse(message.body);
            this._notifyCallbacks(notification);
          } catch (error) {
            // Silent error
          }
        });
        
        this.subscriptions.set(destination, subscription);
        return true;
      }
      return true;
    } catch (error) {
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
            // Silent error
          }
        });
        
        this.subscriptions.set(destination, subscription);
        return true;
      }
      return true;
    } catch (error) {
      return false;
    }
  }
  
  unsubscribe(destination) {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      try {
        subscription.unsubscribe();
      } catch (error) {
        // Silent error
      }
      
      this.subscriptions.delete(destination);
    }
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
            const chatMessage = JSON.parse(message.body);
            
            if (onMessageReceived) {
              onMessageReceived(chatMessage);
            }
          } catch (error) {
            // Silent error
          }
        });
        
        this.subscriptions.set(destination, subscription);
        return true;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  unsubscribeFromChamado(chamadoId) {
    const destination = `/topic/chamado/${chamadoId}`;
    this.unsubscribe(destination);
  }
  
  addUser(chamadoId, user) {
    if (!this.isConnected || !this.stompClient) {
      return false;
    }
    
    try {
      this.stompClient.send(`/app/chat.addUser/${chamadoId}`, JSON.stringify(user));
      return true;
    } catch (error) {
      return false;
    }
  }
  
  sendMessage(chamadoId, message) {
    if (!this.isConnected || !this.stompClient) {
      return false;
    }
    
    try {
      this.stompClient.send(`/app/chat.sendMessage/${chamadoId}`, JSON.stringify(message));
      return true;
    } catch (error) {
      return false;
    }
  }
}

const notificationWebSocketService = new NotificationWebSocketService();

export default notificationWebSocketService;