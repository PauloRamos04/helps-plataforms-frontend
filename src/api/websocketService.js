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
        
        const socket = new SockJS(socketUrl, null, {
          transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
          xhrFields: { withCredentials: false }
        });
        
        if (socket.xhr && socket.xhr.withCredentials !== undefined) {
          socket.xhr.withCredentials = false;
        }
        
        this.stompClient = webstomp.over(socket, {
          debug: false,
          heartbeat: { outgoing: 20000, incoming: 20000 }
        });
        
        this.stompClient.connect(
          { 'Authorization': `Bearer ${token}` },
          () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            if (onConnected) onConnected();
          },
          (error) => {
            this.isConnected = false;
            
            if (onError) onError(error);
            
            const self = this;
            self._scheduleReconnection(onConnected, onError);
          }
        );

        const self = this;
        socket.onclose = function(event) {
          self.isConnected = false;
          
          if (event.code !== 1000) {
            self._scheduleReconnection(onConnected, onError);
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
          // Silenciar erro de desconexão
        }
        
        this.isConnected = false;
      }
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
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
              const parsedMessage = JSON.parse(message.body);
              if (onMessageReceived) {
                onMessageReceived(parsedMessage);
              }
            } catch (error) {
              // Silenciar erros de parsing
            }
          });
          
          this.subscriptions.set(destination, subscription);
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
          // Silenciar erro de unsubscribe
        }
        
        this.subscriptions.delete(destination);
      }
    }
  
    unsubscribeFromChamado(chamadoId) {
      const destination = `/topic/chamado/${chamadoId}`;
      this.unsubscribe(destination);
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
              // Silenciar erros de parsing
            }
          });
          
          this.subscriptions.set(destination, subscription);
        }
        
        return true;
      } catch (error) {
        return false;
      }
    }
}

const websocketService = new WebSocketService();

export default websocketService;