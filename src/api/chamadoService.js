import api from '../api';

export const chamadoService = {
  getChamados: async () => {
    try {
      const response = await api.get('/chamados');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getChamadoById: async (id) => {
    try {
      const response = await api.get(`/chamados/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  createChamado: async (chamadoData) => {
    try {
      const response = await api.post('/chamados', chamadoData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  createChamadoWithImage: async (formData) => {
    try {
      const response = await api.post('/chamados/with-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updateChamado: async (id, chamadoData) => {
    try {
      const response = await api.put(`/chamados/${id}`, chamadoData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  aderirChamado: async (id) => {
    try {
      const response = await api.post(`/chamados/${id}/aderir`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  finalizarChamado: async (id) => {
    try {
      const response = await api.post(`/chamados/${id}/fechar`);
      return response.data;
    } catch (error) {
      if (error.response && (error.response.status === 404 || error.response.status === 405)) {
        const response = await api.patch(`/chamados/${id}/fechar`);
        return response.data;
      }
      throw error;
    }
  },
  
  enviarMensagem: async (id, mensagemData) => {
    try {
      const payload = {
        conteudo: mensagemData.conteudo || mensagemData.content || ''
      };
      
      const response = await api.post(`/chamados/${id}/mensagens`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  enviarMensagemComImagem: async (id, formData) => {
    try {
      const response = await api.post(`/chamados/${id}/mensagens/with-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getMensagens: async (id) => {
    try {
      const response = await api.get(`/chamados/${id}/mensagens`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getChatHistory: async (id) => {
    try {
      const response = await api.get(`/chamados/${id}/mensagens/chat-history`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getImageUrl: (imagePath) => {
    if (!imagePath) return null;
    return `${api.defaults.baseURL}/api/files/download/${imagePath}`;
  }
};

export default chamadoService;