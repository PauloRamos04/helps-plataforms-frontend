import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data
      });
      
      console.error('Error response details:', error.response.data);
      
      if (error.response.status === 401) {
        console.warn('Token expirado ou inválido. Redirecionando para login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export const chamadoService = {
  getChamados: async () => {
    try {
      const response = await api.get('/chamados');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar chamados:', error);
      throw error;
    }
  },
  
  getChamadoById: async (id) => {
    try {
      const response = await api.get(`/chamados/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar chamado ${id}:`, error);
      throw error;
    }
  },
  
  createChamado: async (chamadoData) => {
    try {
      const response = await api.post('/chamados', chamadoData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      throw error;
    }
  },
  
  updateChamado: async (id, chamadoData) => {
    try {
      const response = await api.put(`/chamados/${id}`, chamadoData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar chamado ${id}:`, error);
      throw error;
    }
  },
  
  aderirChamado: async (id) => {
    try {
      console.log(`Tentando aderir ao chamado ${id} - Início da tentativa`);
      console.log('Token de autenticação presente:', !!localStorage.getItem('token'));
      
      try {
        console.log(`Tentando POST para /chamados/${id}/aderir`);
        const response = await api.post(`/chamados/${id}/aderir`);
        console.log('Resposta aderir chamado:', response.data);
        return response.data;
      } catch (firstError) {
        console.log('Detalhes do primeiro erro:', firstError.response?.data);
        console.log('Status do primeiro erro:', firstError.response?.status);
        
        const alternativeEndpoints = [
          { method: 'patch', path: `/chamados/${id}/aderir` },
          { method: 'post', path: `/chamados/${id}/atender` },
          { method: 'patch', path: `/chamados/${id}/atender` },
          { method: 'post', path: `/chamados/${id}/assign` },
          { method: 'patch', path: `/chamados/${id}/assign` }
        ];
        
        for (const endpoint of alternativeEndpoints) {
          try {
            console.log(`Tentando ${endpoint.method.toUpperCase()} ${endpoint.path}`);
            const response = await api[endpoint.method](endpoint.path);
            console.log(`Resposta bem-sucedida de ${endpoint.method.toUpperCase()} ${endpoint.path}:`, response.data);
            return response.data;
          } catch (altError) {
            console.log(`Falha ao tentar ${endpoint.method.toUpperCase()} ${endpoint.path}:`, altError.response?.status);
            // Continue to next alternative
          }
        }
        
        throw firstError;
      }
    } catch (error) {
      console.error(`Erro ao aderir ao chamado ${id}:`, error);
      console.error('Resposta detalhada do erro:', error.response?.data);
      throw error;
    }
  },
  
  // Finalize a chamado with adaptive endpoint detection
  finalizarChamado: async (id) => {
    try {
      console.log(`Tentando finalizar chamado ${id}`);
      
      const endpoints = [
        { method: 'post', path: `/chamados/${id}/finalizar` },
        { method: 'patch', path: `/chamados/${id}/finalizar` },
        { method: 'post', path: `/chamados/${id}/fechar` },
        { method: 'patch', path: `/chamados/${id}/fechar` }
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Tentando ${endpoint.method.toUpperCase()} ${endpoint.path}`);
          const response = await api[endpoint.method](endpoint.path);
          console.log('Chamado finalizado com sucesso:', response.data);
          return response.data;
        } catch (endpointError) {
          // Only continue if it's a 404 (endpoint not found) or 405 (method not allowed)
          if (!(endpointError.response && (endpointError.response.status === 404 || endpointError.response.status === 405))) {
            throw endpointError;
          }
          console.warn(`Endpoint ${endpoint.method.toUpperCase()} ${endpoint.path} não disponível`);
        }
      }
      
      throw new Error('Não foi possível encontrar um endpoint válido para finalizar o chamado');
    } catch (error) {
      console.error(`Erro ao finalizar chamado ${id}:`, error);
      throw error;
    }
  },
  
  // Send a message in a chamado with proper formatting
  enviarMensagem: async (id, mensagemData) => {
    try {
      console.log(`Enviando mensagem para chamado ${id}:`, mensagemData);
      
      const payload = {
        conteudo: mensagemData.conteudo || mensagemData.content || ''
      };
      
      console.log('Payload formatado para envio:', payload);
      
      const response = await api.post(`/chamados/${id}/mensagens`, payload);
      console.log('Resposta enviar mensagem:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Erro ao enviar mensagem no chamado ${id}:`, error);
      console.error('Dados da resposta de erro:', error.response?.data);
      throw error;
    }
  },
  
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