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
    this.debug = false;
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    this.connectionState = 'DISCONNECTED'; // ['DISCONNECTED', 'CONNECTING', 'CONNECTED', 'RECONNECTING']
  }

  connect(onConnected, onError) {
    // Evitar conexões múltiplas
    if (this.connectionState === 'CONNECTING' || this.connectionState === 'RECONNECTING') {
      this.log('WebSocket já está tentando conectar, ignorando chamada');
      return;
    }

    if (this.isConnected) {
      this.log('WebSocket já está conectado');
      if (onConnected) onConnected();
      return;
    }

    this.connectionState = 'CONNECTING';

    try {
      // Cancelar qualquer reconexão agendada
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      // Verificar autenticação
      const token = localStorage.getItem('token');
      if (!token) {
        this.error('Sem token de autenticação para WebSocket');
        if (onError) onError(new Error('Falha na autenticação para WebSocket'));
        this.connectionState = 'DISCONNECTED';
        return;
      }
      
      // URL do WebSocket
      const socketUrl = `${this.baseUrl}/ws`;
      this.log(`Conectando ao WebSocket em: ${socketUrl}`);
      
      // Criar conexão SockJS
      const socket = new SockJS(socketUrl, null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
        timeout: 5000
      });
      
      // Configurar cliente STOMP
      this.stompClient = webstomp.over(socket, {
        debug: this.debug,
        heartbeat: { outgoing: 20000, incoming: 20000 },
        reconnect_delay: 5000
      });
      
      // Configurar cabeçalhos para conexão
      const connectHeaders = { 
        'Authorization': `Bearer ${token}`,
        'accept-version': '1.1,1.0',
        'heart-beat': '10000,10000'
      };
      
      // Conectar ao servidor WebSocket
      this.stompClient.connect(
        connectHeaders,
        (frame) => {
          this.log('WebSocket conectado:', frame);
          this.isConnected = true;
          this.connectionState = 'CONNECTED';
          this.reconnectAttempts = 0;
          
          if (onConnected) onConnected(frame);
          
          // Resubscrever em todos os canais anteriores
          this._resubscribeAll();
        },
        (error) => {
          this.error('Erro na conexão WebSocket:', error);
          this.isConnected = false;
          this.connectionState = 'DISCONNECTED';
          
          if (onError) onError(error);
          
          // Agendar reconexão
          this._scheduleReconnection(onConnected, onError);
        }
      );
      
      // Tratar fechamento do socket
      socket.onclose = (event) => {
        this.warn('WebSocket fechado:', event);
        this.isConnected = false;
        
        if (this.connectionState === 'CONNECTED') {
          this.connectionState = 'DISCONNECTED';
          
          // Não reconectar em caso de fechamento normal (código 1000)
          if (event.code !== 1000) {
            this._scheduleReconnection(onConnected, onError);
          }
        }
      };
    } catch (error) {
      this.error('Erro crítico na conexão WebSocket:', error);
      this.connectionState = 'DISCONNECTED';
      if (onError) onError(error);
    }
  }
  
  // Método de reconexão com backoff exponencial
  _scheduleReconnection(onConnected, onError) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.error('Máximo de tentativas de reconexão atingido');
      return;
    }
    
    this.connectionState = 'RECONNECTING';
    
    // Calcular tempo de espera com backoff exponencial
    const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
    
    this.log(`Tentando reconectar em ${delay}ms (Tentativa ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(onConnected, onError);
    }, delay);
  }
  
  // Resubscrever em todos os canais após reconexão
  _resubscribeAll() {
    const subscriptionsToRestore = [...this.subscriptions.entries()];
    
    // Limpar as assinaturas existentes, pois a conexão foi refeita
    this.subscriptions.clear();
    
    // Restaurar cada assinatura
    subscriptionsToRestore.forEach(([destination, metadata]) => {
      try {
        const { callback, headers } = metadata;
        this.subscribe(destination, callback, headers);
      } catch (error) {
        this.error(`Erro ao restaurar assinatura para ${destination}:`, error);
      }
    });
  }

  disconnect() {
    if (this.stompClient && this.isConnected) {
      // Cancelar todas as assinaturas
      this.subscriptions.forEach((metadata, destination) => {
        this.unsubscribe(destination);
      });
      
      try {
        this.stompClient.disconnect(() => {
          this.log('Desconectado com sucesso do WebSocket');
        });
      } catch (error) {
        this.error("Erro ao desconectar WebSocket:", error);
      }
      
      this.isConnected = false;
      this.connectionState = 'DISCONNECTED';
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  // Método genérico para se inscrever em um destino
  subscribe(destination, callback, headers = {}) {
    if (!this.isConnected || !this.stompClient) {
      this.warn(`Não foi possível assinar ${destination}: WebSocket não conectado`);
      return false;
    }
    
    try {
      if (!this.subscriptions.has(destination)) {
        this.log(`Assinando canal: ${destination}`);
        
        const subscription = this.stompClient.subscribe(destination, (message) => {
          try {
            const payload = JSON.parse(message.body);
            this.log(`Mensagem recebida em ${destination}:`, payload);
            
            if (callback) {
              callback(payload);
            }
          } catch (error) {
            this.error(`Erro ao processar mensagem de ${destination}:`, error);
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
      this.error(`Erro ao assinar ${destination}:`, error);
      return false;
    }
  }
  
  // Cancelar assinatura
  unsubscribe(destination) {
    const metadata = this.subscriptions.get(destination);
    if (metadata && metadata.subscription) {
      try {
        metadata.subscription.unsubscribe();
        this.log(`Assinatura cancelada para ${destination}`);
      } catch (error) {
        this.error(`Erro ao cancelar assinatura para ${destination}:`, error);
      }
      
      this.subscriptions.delete(destination);
      return true;
    }
    return false;
  }
  
  // Adicionar callback para receber notificações
  addNotificationCallback(callback) {
    if (typeof callback === 'function' && !this.notificationCallbacks.includes(callback)) {
      this.notificationCallbacks.push(callback);
      return true;
    }
    return false;
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
        this.error('Erro ao executar callback de notificação:', error);
      }
    });
  }
  
  // Assinar tópico de notificações pessoais
  subscribeToUserNotifications(userId, username) {
    if (!this.isConnected || !this.stompClient) {
      this.warn('Não foi possível assinar notificações: WebSocket não conectado');
      return false;
    }
    
    if (!userId || !username) {
      this.warn('Não foi possível assinar notificações: ID de usuário ou nome de usuário não fornecido');
      return false;
    }
    
    // Assinar pelo username
    const userDestination = `/user/${username}/queue/notifications`;
    const userSubscribed = this.subscribe(userDestination, (notification) => {
      this.log('Notificação pessoal recebida:', notification);
      this._notifyCallbacks(notification);
    });
    
    // Assinar pelo ID (como fallback)
    const idDestination = `/user/${userId}/queue/notifications`;
    if (idDestination !== userDestination) {
      const idSubscribed = this.subscribe(idDestination, (notification) => {
        this.log('Notificação pessoal recebida via ID:', notification);
        this._notifyCallbacks(notification);
      });
      
      return userSubscribed || idSubscribed;
    }
    
    return userSubscribed;
  }
  
  // Assinar tópico de notificações globais
  subscribeToGlobalNotifications() {
    const destination = '/topic/notifications';
    return this.subscribe(destination, (notification) => {
      this.log('Notificação global recebida:', notification);
      this._notifyCallbacks(notification);
    });
  }
  
  // Assinar canal de um chamado específico
  subscribeToChamado(chamadoId, onMessageReceived) {
    if (!chamadoId) {
      this.warn('ID do chamado não fornecido para assinatura');
      return false;
    }
    
    const destination = `/topic/chamado/${chamadoId}`;
    return this.subscribe(destination, onMessageReceived);
  }
  
  // Cancelar assinatura de um chamado
  unsubscribeFromChamado(chamadoId) {
    if (!chamadoId) return false;
    
    const destination = `/topic/chamado/${chamadoId}`;
    return this.unsubscribe(destination);
  }
  
  // Adicionar usuário a um chat de chamado
  addUser(chamadoId, userInfo) {
    if (!this.isConnected || !this.stompClient || !chamadoId) {
      return false;
    }
    
    try {
      this.stompClient.send(`/app/chat.addUser/${chamadoId}`, JSON.stringify(userInfo));
      return true;
    } catch (error) {
      this.error('Erro ao adicionar usuário ao chat:', error);
      return false;
    }
  }
  
  // Enviar mensagem para um chamado
  sendMessage(chamadoId, message) {
    if (!this.isConnected || !this.stompClient || !chamadoId) {
      return false;
    }
    
    try {
      this.stompClient.send(`/app/chat.sendMessage/${chamadoId}`, JSON.stringify(message));
      return true;
    } catch (error) {
      this.error('Erro ao enviar mensagem:', error);
      return false;
    }
  }
  
  // Funções de log
  log(...args) {
    if (this.debug) {
      console.log('[WebSocket]', ...args);
    }
  }
  
  warn(...args) {
    console.warn('[WebSocket]', ...args);
  }
  
  error(...args) {
    console.error('[WebSocket]', ...args);
  }
}

// Criar instância singleton
const notificationWebSocketService = new NotificationWebSocketService();

export default notificationWebSocketService;