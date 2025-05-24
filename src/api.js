import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 15000
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
        return 'Erro interno do servidor. Tente novamente mais tarde.';
      case 502:
        return 'Serviço temporariamente indisponível. Tente novamente.';
      case 503:
        return 'Serviço em manutenção. Tente novamente mais tarde.';
      default:
        return data?.message || `Erro inesperado (${status}). Tente novamente.`;
    }
  }

  return error.message || 'Erro inesperado. Tente novamente.';
};

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const friendlyMessage = translateError(error);
    
    const translatedError = new Error(friendlyMessage);
    translatedError.originalError = error;
    translatedError.response = error.response;
    translatedError.status = error.response?.status;

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(translatedError);
  }
);

export default api;