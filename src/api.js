import axios from 'axios';
import tokenService from './services/tokenService';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 30000
});

const translateError = (error) => {
  if (error.code === 'NETWORK_ERR' || error.message === 'Network Error') {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }
  
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return 'Tempo limite excedido. Tente novamente.';
  }

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return data?.message || 'Dados inválidos. Verifique as informações e tente novamente.';
      case 401:
        return 'Sessão expirada. Faça login novamente.';
      case 403:
        return 'Você não tem permissão para executar esta ação.';
      case 404:
        return 'Recurso não encontrado.';
      case 409:
        return data?.message || 'Conflito de dados. Verifique as informações.';
      case 422:
        return data?.message || 'Dados inválidos. Verifique os campos obrigatórios.';
      case 429:
        return 'Muitas tentativas. Aguarde um momento antes de tentar novamente.';
      case 500:
        // Para erros 500, verificar se é relacionado ao envio de mensagens
        if (error.config?.url?.includes('/mensagens')) {
          return 'Erro no servidor ao enviar mensagem. A mensagem pode ter sido enviada. Verifique o chat.';
        }
        return 'Erro interno do servidor. Tente novamente mais tarde.';
      case 502:
        return 'Serviço temporariamente indisponível. Tente novamente.';
      case 503:
        return 'Serviço em manutenção. Tente novamente mais tarde.';
      default:
        return data?.message || `Erro inesperado (${status}). Tente novamente.`;
    }
  }

  // Se não há response, pode ser um erro de rede ou timeout
  if (error.message.includes('timeout')) {
    return 'Tempo limite excedido. Verifique sua conexão e tente novamente.';
  }

  return error.message || 'Erro inesperado. Tente novamente.';
};

api.interceptors.request.use(
  (config) => {
    const token = tokenService.getToken();
    if (token && !tokenService.isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token && tokenService.isTokenExpired(token)) {
      tokenService.clearAuth();
      window.location.href = '/login';
      return Promise.reject(new Error('Token expirado'));
    }
    
    if (tokenService.refreshTokenIfNeeded()) {
      console.warn('Token expirando em breve - considere implementar refresh');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const friendlyMessage = translateError(error);
    
    const translatedError = new Error(friendlyMessage);
    translatedError.originalError = error;
    translatedError.response = error.response;
    translatedError.status = error.response?.status;

    if (error.response && error.response.status === 401) {
      tokenService.clearAuth();
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(translatedError);
  }
);

export default api;