import api from '../api';

export const ticketService = {
  // Obter todos os chamados
  getTickets: async () => {
    try {
      const response = await api.get('/tickets');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar chamados:', error);
      throw new Error('Não foi possível carregar os chamados');
    }
  },
  
  // Para compatibilidade com código existente (alias)
  getChamados: async () => {
    return ticketService.getTickets();
  },
  
  // Obter chamado por ID
  getTicketById: async (id) => {
    try {
      const response = await api.get(`/tickets/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar detalhes do chamado:', error);
      throw new Error('Não foi possível carregar os detalhes do chamado');
    }
  },
  
  // Para compatibilidade com código existente (alias)
  getChamadoById: async (id) => {
    return ticketService.getTicketById(id);
  },
  
  // Criar um novo chamado
  createTicket: async (ticketData) => {
    try {
      const response = await api.post('/tickets', ticketData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      throw new Error('Não foi possível criar o chamado');
    }
  },
  
  // Criar chamado com imagem
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
  
  // Para compatibilidade com código existente (alias)
  criarChamado: async (ticketData) => {
    return ticketService.createTicket(ticketData);
  },
  
  // Assumir um chamado
  assignTicket: async (id) => {
    try {
      const response = await api.post(`/tickets/${id}/aderir`);
      return response.data;
    } catch (error) {
      console.error('Erro ao assumir chamado:', error);
      throw new Error('Não foi possível assumir o chamado');
    }
  },
  
  // Fechar um chamado
  closeTicket: async (id) => {
    try {
      const response = await api.post(`/tickets/${id}/fechar`);
      return response.data;
    } catch (error) {
      console.error('Erro ao finalizar chamado:', error);
      throw new Error('Não foi possível finalizar o chamado');
    }
  },
  
  // Atualizar status do chamado - para compatibilidade
  updateTicketStatus: async (id, status) => {
    try {
      // Tratamento especial baseado no status
      if (status === 'EM_ATENDIMENTO') {
        return ticketService.assignTicket(id);
      } else if (status === 'FECHADO') {
        return ticketService.closeTicket(id);
      } else {
        // Fallback para API genérica se necessário
        const response = await api.put(`/tickets/${id}`, { status });
        return response.data;
      }
    } catch (error) {
      console.error('Erro ao atualizar status do chamado:', error);
      throw new Error('Não foi possível atualizar o status do chamado');
    }
  },
  
  // Obter mensagens de um chamado - CORRIGIDO para usar o endpoint correto
  getTicketMessages: async (ticketId) => {
    try {
      const response = await api.get(`/tickets/${ticketId}/mensagens`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar mensagens do chamado:', error);
      throw new Error('Não foi possível carregar as mensagens do chamado');
    }
  },
  
  // Enviar mensagem em um chamado - CORRIGIDO para usar o endpoint correto
  sendMessage: async (ticketId, messageData) => {
    try {
      // Verifica se messageData.content existe, caso contrário tenta usar messageData diretamente
      const payload = typeof messageData === 'string' 
        ? { content: messageData } 
        : messageData.content 
          ? messageData 
          : { content: messageData.message || messageData.texto || messageData };
          
      const response = await api.post(`/tickets/${ticketId}/mensagens`, payload);
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw new Error('Não foi possível enviar a mensagem');
    }
  },
  
  // Obter URL da imagem
  getImageUrl: (imagePath) => {
    // Verificação para evitar erros se imagePath for undefined
    if (!imagePath) return null;
    
    // Se o caminho já for uma URL completa
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Caso contrário, construa a URL
    return `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  }
};

export default ticketService;