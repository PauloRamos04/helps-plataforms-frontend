import api from '../api';

export const ticketService = {
  // Obter todos os tickets
  getTickets: async () => {
    try {
      const response = await api.get('/tickets');
      
      // Seu backend retorna um array direto, não um ApiResponse
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Fallback
      return [];
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
      throw new Error('Não foi possível carregar os tickets');
    }
  },
  
  // Para compatibilidade com código existente (alias)
  getChamados: async () => {
    return ticketService.getTickets();
  },
  
  // Obter ticket por ID
  getTicketById: async (id) => {
    try {
      const response = await api.get(`/tickets/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar detalhes do ticket:', error);
      throw new Error('Não foi possível carregar os detalhes do ticket');
    }
  },
  
  // Para compatibilidade com código existente (alias)
  getChamadoById: async (id) => {
    return ticketService.getTicketById(id);
  },
  
  // Criar ticket com imagem (seu endpoint with-image)
  createTicketWithImage: async (formData) => {
    try {
      const response = await api.post('/tickets/with-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar ticket com imagem:', error);
      throw new Error('Não foi possível criar o ticket com imagem');
    }
  },
  
  // Criar um novo ticket (JSON - seu endpoint original)
  createTicket: async (ticketData) => {
    try {
      const response = await api.post('/tickets', ticketData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      throw new Error('Não foi possível criar o ticket');
    }
  },
  
  // Para compatibilidade com código existente (alias)
  criarChamado: async (ticketData) => {
    return ticketService.createTicket(ticketData);
  },
  
  // Assumir um ticket (seus endpoints originais)
  assignTicket: async (id) => {
    try {
      const response = await api.post(`/tickets/${id}/aderir`);
      return response.data;
    } catch (error) {
      console.error('Erro ao assumir ticket:', error);
      throw new Error('Não foi possível assumir o ticket');
    }
  },
  
  // Fechar um ticket (seus endpoints originais)
  closeTicket: async (id) => {
    try {
      const response = await api.post(`/tickets/${id}/fechar`);
      return response.data;
    } catch (error) {
      console.error('Erro ao finalizar ticket:', error);
      throw new Error('Não foi possível finalizar o ticket');
    }
  },
  
  // Atualizar ticket
  updateTicket: async (id, ticketData) => {
    try {
      const response = await api.put(`/tickets/${id}`, ticketData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar ticket:', error);
      throw new Error('Não foi possível atualizar o ticket');
    }
  },
  
  // Atualizar status do ticket - para compatibilidade
  updateTicketStatus: async (id, status) => {
    try {
      if (status === 'EM_ATENDIMENTO') {
        return ticketService.assignTicket(id);
      } else if (status === 'FECHADO') {
        return ticketService.closeTicket(id);
      } else {
        const response = await api.put(`/tickets/${id}`, { status });
        return response.data;
      }
    } catch (error) {
      console.error('Erro ao atualizar status do ticket:', error);
      throw new Error('Não foi possível atualizar o status do ticket');
    }
  },
  
  // Obter mensagens de um ticket
  getTicketMessages: async (ticketId) => {
    try {
      const response = await api.get(`/tickets/${ticketId}/mensagens`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar mensagens do ticket:', error);
      throw new Error('Não foi possível carregar as mensagens do ticket');
    }
  },
  
  // Para compatibilidade
  getMensagens: async (ticketId) => {
    return ticketService.getTicketMessages(ticketId);
  },
  
  // Enviar mensagem em um ticket
  sendMessage: async (ticketId, messageData) => {
    try {
      // Normalizar dados da mensagem para seu backend
      let payload;
      
      if (typeof messageData === 'string') {
        payload = { content: messageData };
      } else if (messageData.content) {
        payload = messageData;
      } else {
        payload = { 
          content: messageData.message || 
                  messageData.texto || 
                  messageData.conteudo || 
                  messageData 
        };
      }
      
      const response = await api.post(`/tickets/${ticketId}/mensagens`, payload);
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw new Error('Não foi possível enviar a mensagem');
    }
  },
  
  // Para compatibilidade
  enviarMensagem: async (ticketId, messageData) => {
    return ticketService.sendMessage(ticketId, messageData);
  },
  
  // Enviar mensagem com imagem
  sendMessageWithImage: async (ticketId, formData) => {
    try {
      const response = await api.post(`/tickets/${ticketId}/mensagens/with-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem com imagem:', error);
      throw new Error('Não foi possível enviar a mensagem com imagem');
    }
  },
  
  // Para compatibilidade
  enviarMensagemComImagem: async (ticketId, formData) => {
    return ticketService.sendMessageWithImage(ticketId, formData);
  },
  
  // Obter histórico do chat
  getChatHistory: async (ticketId) => {
    try {
      const response = await api.get(`/tickets/${ticketId}/mensagens/chat-history`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar histórico do chat:', error);
      throw new Error('Não foi possível carregar o histórico do chat');
    }
  },
  
  // Obter URL da imagem
  getImageUrl: (imagePath) => {
    if (!imagePath) return null;
    
    // Se o caminho já for uma URL completa
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Construir URL baseada na configuração da API
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    
    // Se o caminho já começar com /, usar diretamente
    if (imagePath.startsWith('/')) {
      return `${baseUrl}${imagePath}`;
    }
    
    // Se não começar com /, adicionar /uploads/
    return `${baseUrl}/uploads/${imagePath}`;
  },
  
  // Fazer download de arquivo
  downloadFile: async (fileName) => {
    try {
      const response = await api.get(`/api/files/download/${fileName}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer download do arquivo:', error);
      throw new Error('Não foi possível fazer download do arquivo');
    }
  },
  
  // Upload de arquivo
  uploadFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.fileName) {
        return response.data.fileName;
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      throw new Error('Não foi possível fazer upload do arquivo');
    }
  }
};

export default ticketService;