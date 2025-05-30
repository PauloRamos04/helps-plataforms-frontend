import api from '../api';

export const ticketService = {
  // Obter todos os chamados
  getTickets: async () => {
    try {
      const response = await api.get('/tickets');
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao buscar chamados:', error);
      throw new Error('Não foi possível carregar os chamados');
    }
  },
  
  // Obter chamados com paginação
  getTicketsPaginated: async (page = 0, size = 20, sortBy = 'openingDate', sortDirection = 'desc', filters = {}) => {
    try {
      const params = {
        page,
        size,
        sortBy,
        sortDirection,
        ...filters
      };
      
      const response = await api.get('/tickets/paginated', { params });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao buscar chamados paginados:', error);
      throw new Error('Não foi possível carregar os chamados');
    }
  },
  
  // Para compatibilidade com código existente
  getChamados: async () => {
    return ticketService.getTickets();
  },
  
  // Obter chamado por ID
  getTicketById: async (id) => {
    try {
      const response = await api.get(`/tickets/${id}`);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao buscar detalhes do chamado:', error);
      throw new Error('Não foi possível carregar os detalhes do chamado');
    }
  },
  
  // Para compatibilidade
  getChamadoById: async (id) => {
    return ticketService.getTicketById(id);
  },
  
  // Criar um novo chamado (JSON)
  createTicket: async (ticketData) => {
    try {
      const response = await api.post('/tickets', ticketData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      throw new Error('Não foi possível criar o chamado');
    }
  },
  
  // Criar chamado com imagem (FormData) - endpoint antigo
  createTicketWithImage: async (formData) => {
    try {
      const response = await api.post('/tickets/with-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar chamado com imagem:', error);
      throw new Error('Não foi possível criar o chamado com imagem');
    }
  },
  
  // Novo endpoint para criar chamado com validação (FormData)
  createTicketNew: async (formData) => {
    try {
      const response = await api.post('/tickets/new', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      throw new Error('Não foi possível criar o chamado');
    }
  },
  
  // Criar chamado com validação JSON
  createTicketValidated: async (ticketData) => {
    try {
      const response = await api.post('/tickets/validate', ticketData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      throw new Error('Não foi possível criar o chamado');
    }
  },
  
  // Para compatibilidade
  criarChamado: async (ticketData) => {
    return ticketService.createTicket(ticketData);
  },
  
  // Assumir um chamado - endpoint novo
  assignTicket: async (id) => {
    try {
      const response = await api.post(`/tickets/${id}/assign`);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao assumir chamado:', error);
      throw new Error('Não foi possível assumir o chamado');
    }
  },
  
  // Assumir um chamado - endpoint legado
  assignTicketLegacy: async (id) => {
    try {
      const response = await api.post(`/tickets/${id}/aderir`);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao assumir chamado:', error);
      throw new Error('Não foi possível assumir o chamado');
    }
  },
  
  // Fechar um chamado - endpoint novo
  closeTicket: async (id) => {
    try {
      const response = await api.post(`/tickets/${id}/close`);
      return response.data;
    } catch (error) {
      console.error('Erro ao finalizar chamado:', error);
      throw new Error('Não foi possível finalizar o chamado');
    }
  },
  
  // Fechar um chamado - endpoint legado
  closeTicketLegacy: async (id) => {
    try {
      const response = await api.post(`/tickets/${id}/fechar`);
      return response.data;
    } catch (error) {
      console.error('Erro ao finalizar chamado:', error);
      throw new Error('Não foi possível finalizar o chamado');
    }
  },
  
  // Atualizar ticket
  updateTicket: async (id, ticketData) => {
    try {
      const response = await api.put(`/tickets/${id}`, ticketData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar chamado:', error);
      throw new Error('Não foi possível atualizar o chamado');
    }
  },
  
  // Atualizar status do chamado
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
      console.error('Erro ao atualizar status do chamado:', error);
      throw new Error('Não foi possível atualizar o status do chamado');
    }
  },
  
  // Obter mensagens de um chamado
  getTicketMessages: async (ticketId) => {
    try {
      const response = await api.get(`/tickets/${ticketId}/mensagens/chat-history`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar mensagens do chamado:', error);
      throw new Error('Não foi possível carregar as mensagens do chamado');
    }
  },
  
  // Para compatibilidade
  getMensagens: async (ticketId) => {
    return ticketService.getTicketMessages(ticketId);
  },
  
  // Enviar mensagem em um chamado
  sendMessage: async (ticketId, messageData) => {
    try {
      const payload = typeof messageData === 'string' 
        ? { content: messageData } 
        : messageData.content 
          ? messageData 
          : { content: messageData.message || messageData.texto || messageData.conteudo || messageData };
          
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
  
  // Obter URL da imagem
  getImageUrl: (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  }
};

export default ticketService;