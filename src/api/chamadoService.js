import api from './api';

const chamadoService = {
  // Obter todos os chamados
  getChamados: async () => {
    try {
      const response = await api.get('/chamados');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar chamados:', error);
      throw error;
    }
  },
  
  // Obter um chamado específico por ID
  getChamadoById: async (id) => {
    try {
      const response = await api.get(`/chamados/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar chamado ${id}:`, error);
      throw error;
    }
  },
  
  // Criar um novo chamado
  createChamado: async (chamadoData) => {
    try {
      const response = await api.post('/chamados', chamadoData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      throw error;
    }
  },
  
  // Atualizar um chamado existente
  updateChamado: async (id, chamadoData) => {
    try {
      const response = await api.put(`/chamados/${id}`, chamadoData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar chamado ${id}:`, error);
      throw error;
    }
  },
  
  // Helper adere a um chamado
  aderirChamado: async (id) => {
    try {
      const response = await api.post(`/chamados/${id}/aderir`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao aderir ao chamado ${id}:`, error);
      throw error;
    }
  },
  
  // Finalizar um chamado
  finalizarChamado: async (id) => {
    try {
      const response = await api.post(`/chamados/${id}/finalizar`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao finalizar chamado ${id}:`, error);
      throw error;
    }
  },
  
  // Enviar mensagem em um chamado
  enviarMensagem: async (id, mensagemData) => {
    try {
      const response = await api.post(`/chamados/${id}/mensagens`, mensagemData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao enviar mensagem no chamado ${id}:`, error);
      throw error;
    }
  },
  
  // Obter mensagens de um chamado
  getMensagens: async (id) => {
    try {
      const response = await api.get(`/chamados/${id}/mensagens`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar mensagens do chamado ${id}:`, error);
      throw error;
    }
  }
};

export default chamadoService;