import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://plataforma-chamados-helps-production-4815.up.railway.app',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000
});

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
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
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      const data = response.data;
      
      if (data.acessToken || data.accessToken) {
        const token = data.acessToken || data.accessToken;
        
        localStorage.setItem('token', token);
        
        const tokenPayload = parseJwt(token);
        
        if (tokenPayload) {
          const user = {
            id: tokenPayload.sub,
            username: tokenPayload.username,
            roles: tokenPayload.roles || [],
            name: tokenPayload.name
          };
          
          localStorage.setItem('user', JSON.stringify(user));
          
          return {
            success: true,
            user: user,
            token: token
          };
        }
      }
      
      return {
        success: false,
        message: 'Erro de autenticação: token inválido ou ausente'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Credenciais inválidas'
      };
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        return null;
      }
    }
    return null;
  }
};

export default api;