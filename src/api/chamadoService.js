// src/api/chamadoService.js
import axios from 'axios';

// Configuração básica do axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Log de requisições para debug
api.interceptors.request.use(request => {
  console.log('Iniciando requisição:', request.method, request.url);
  return request;
});

// Log de respostas para debug
api.interceptors.response.use(
  response => {
    console.log('Resposta recebida:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('Erro na requisição:', error.response?.status, error.config?.url, error.message);
    return Promise.reject(error);
  }
);

export const chamadoService = {
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
      console.log(`Tentando aderir ao chamado ${id}`);
      // Verifica se o endpoint correto está sendo usado de acordo com o backend
      // Tenta primeiro com /aderir
      try {
        const response = await api.post(`/chamados/${id}/aderir`);
        console.log('Resposta aderir chamado:', response.data);
        return response.data;
      } catch (firstError) {
        console.warn(`Endpoint /aderir falhou, tentando alternativa:`, firstError);
        // Se falhar, tenta com outro possível endpoint
        const response = await api.patch(`/chamados/${id}/aderir`);
        return response.data;
      }
    } catch (error) {
      console.error(`Erro ao aderir ao chamado ${id}:`, error);
      throw error;
    }
  },
  
  // Finalizar um chamado
  finalizarChamado: async (id) => {
    try {
      console.log(`Tentando finalizar chamado ${id}`);
      // Tentativa com endpoint /finalizar
      try {
        const response = await api.post(`/chamados/${id}/finalizar`);
        console.log('Resposta finalizar chamado:', response.data);
        return response.data;
      } catch (firstError) {
        console.warn(`Endpoint /finalizar falhou, tentando alternativa:`, firstError);
        // Se falhar, tenta com /fechar que é outra possibilidade
        const response = await api.patch(`/chamados/${id}/fechar`);
        return response.data;
      }
    } catch (error) {
      console.error(`Erro ao finalizar chamado ${id}:`, error);
      throw error;
    }
  },
  
  // Enviar mensagem em um chamado
  enviarMensagem: async (id, mensagemData) => {
    try {
      console.log(`Enviando mensagem para chamado ${id}:`, mensagemData);
      const response = await api.post(`/chamados/${id}/mensagens`, mensagemData);
      console.log('Resposta enviar mensagem:', response.data);
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