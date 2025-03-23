// src/api/websocketService.js
import SockJS from 'sockjs-client';
import webstomp from 'webstomp-client';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.isConnected = false;
    this.subscriptions = new Map();
    this.reconnectTimeout = null;
  }

  connect(onConnected, onError) {
    try {
      // Use SockJS para conexão WebSocket
      const socket = new SockJS(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/ws`);
      
      // Use webstomp-client para comunicação STOMP
      this.stompClient = webstomp.over(socket, {
        debug: process.env.NODE_ENV !== 'production'
      });
      
      // Conectar ao servidor
      this.stompClient.connect(
        {
          // Opcional: adicionar token de autenticação 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        // Callback de sucesso
        () => {
          this.isConnected = true;
          console.log('WebSocket conectado com sucesso');
          
          // Limpar qualquer timeout de reconexão pendente
          if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
          }
          
          if (onConnected) onConnected();
        },
        // Callback de erro
        (error) => {
          console.error('Erro de conexão WebSocket:', error);
          this.isConnected = false;
          
          if (onError) onError(error);
          
          // Tentar reconectar após 5 segundos
          this.reconnectTimeout = setTimeout(() => {
            console.log('Tentando reconectar WebSocket...');
            this.connect(onConnected, onError);
          }, 5000);
        }
      );

      // Handler para quando a conexão for fechada
      socket.onclose = () => {
        console.log('Conexão WebSocket fechada');
        this.isConnected = false;
        
        if (!this.reconnectTimeout) {
          this.reconnectTimeout = setTimeout(() => {
            console.log('Tentando reconectar após fechamento...');
            this.connect(onConnected, onError);
          }, 5000);
        }
      };
    } catch (error) {
      console.error('Erro ao inicializar WebSocket:', error);
      if (onError) onError(error);
    }
  }

  disconnect() {
    if (this.stompClient && this.isConnected) {
      // Limpar todas as inscrições
      this.subscriptions.forEach((subscription) => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
        }
      });
      this.subscriptions.clear();

      // Desconectar o cliente STOMP
      this.stompClient.disconnect(() => {
        console.log('Desconectado do WebSocket');
      });
      
      this.isConnected = false;
    }
    
    // Limpar qualquer timeout de reconexão
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // Inscrever-se em um tópico de chamado
  subscribeToChamado(chamadoId, onMessageReceived) {
    if (!this.isConnected || !this.stompClient) {
      console.error('WebSocket não está conectado');
      return false;
    }

    const topic = `/topic/chamado/${chamadoId}`;
    
    // Verificar se já existe uma inscrição para este tópico
    if (this.subscriptions.has(topic)) {
      return true;
    }
    
    // Criar nova inscrição
    try {
      const subscription = this.stompClient.subscribe(topic, (message) => {
        try {
          // Parse da mensagem recebida
          const payload = JSON.parse(message.body);
          if (onMessageReceived) onMessageReceived(payload);
        } catch (error) {
          console.error('Erro ao processar mensagem recebida:', error);
        }
      });
      
      // Armazenar a inscrição
      this.subscriptions.set(topic, subscription);
      console.log(`Inscrito no tópico: ${topic}`);
      
      return true;
    } catch (error) {
      console.error(`Erro ao se inscrever no tópico ${topic}:`, error);
      return false;
    }
  }

  // Cancelar inscrição em um tópico de chamado
  unsubscribeFromChamado(chamadoId) {
    const topic = `/topic/chamado/${chamadoId}`;
    const subscription = this.subscriptions.get(topic);
    
    if (subscription) {
      try {
        subscription.unsubscribe();
        this.subscriptions.delete(topic);
        console.log(`Cancelada inscrição no tópico: ${topic}`);
        return true;
      } catch (error) {
        console.error(`Erro ao cancelar inscrição no tópico ${topic}:`, error);
        return false;
      }
    }
    
    return false;
  }

  // Enviar mensagem para um chamado
  sendMessage(chamadoId, message) {
    if (!this.isConnected || !this.stompClient) {
      console.error('WebSocket não está conectado');
      return false;
    }

    try {
      this.stompClient.send(
        `/app/chat.sendMessage/${chamadoId}`, 
        JSON.stringify(message),
        {} // headers
      );
      return true;
    } catch (error) {
      console.error(`Erro ao enviar mensagem para o chamado ${chamadoId}:`, error);
      return false;
    }
  }

  // Notificar que um usuário entrou no chat de um chamado
  addUser(chamadoId, user) {
    if (!this.isConnected || !this.stompClient) {
      console.error('WebSocket não está conectado');
      return false;
    }

    try {
      this.stompClient.send(
        `/app/chat.addUser/${chamadoId}`,
        JSON.stringify(user),
        {} // headers
      );
      return true;
    } catch (error) {
      console.error(`Erro ao adicionar usuário ao chamado ${chamadoId}:`, error);
      return false;
    }
  }
}

export default new WebSocketService();