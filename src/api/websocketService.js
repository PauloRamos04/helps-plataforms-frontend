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
          console.error('No authentication token available for WebSocket connection');
          if (onError) onError(new Error('Falha na autenticação para conexão WebSocket'));
          return;
        }
        
        const socketUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/ws`;
        console.log('Conectando ao WebSocket em:', socketUrl);
        
        const socket = new SockJS(socketUrl, null, {
          transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
          xhrFields: {
            withCredentials: false
          }
        });
        
        if (socket.xhr && socket.xhr.withCredentials !== undefined) {
          socket.xhr.withCredentials = false;
        }
        
        this.stompClient = webstomp.over(socket, {
          debug: false,
          heartbeat: { outgoing: 20000, incoming: 20000 }
        });
        
        this.stompClient.connect(
          {
            'Authorization': `Bearer ${token}`
          },
          () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log('WebSocket conectado com sucesso');
            
            if (onConnected) onConnected();
          },

          (error) => {
            console.error('Erro de conexão WebSocket:', error);
            this.isConnected = false;
            
            if (onError) onError(error);
            
            const self = this;
            self._scheduleReconnection(onConnected, onError);
          }
        );

        const self = this;
        socket.onclose = function(event) {
          console.log(`Conexão WebSocket fechada. Código: ${event.code}, Razão: ${event.reason}`);
          self.isConnected = false;
          
          if (event.code !== 1000) {
            self._scheduleReconnection(onConnected, onError);
          }
        };
      } catch (error) {
        console.error('Erro ao inicializar WebSocket:', error);
        if (onError) onError(error);
      }
    }
    
    _scheduleReconnection(onConnected, onError) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log(`Máximo de ${this.maxReconnectAttempts} tentativas de reconexão atingido. Desistindo.`);
        return;
      }
      
      const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
      
      console.log(`Tentando reconectar WebSocket em ${delay/1000} segundos... (tentativa ${this.reconnectAttempts + 1})`);
      
      const self = this;
      this.reconnectTimeout = setTimeout(function() {
        self.reconnectAttempts++;
        self.connect(onConnected, onError);
      }, delay);
    }
  
    disconnect() {
      // ... implementação existente ...
    }
  
    subscribeToChamado(chamadoId, onMessageReceived) {
      // ... implementação existente ...
    }
  
    unsubscribeFromChamado(chamadoId) {
      // ... implementação existente ...
    }
  
    sendMessage(chamadoId, message) {
      // ... implementação existente ...
    }
  
    addUser(chamadoId, user) {
      // ... implementação existente ...
    }
}
const websocketService = new WebSocketService();

export default websocketService;