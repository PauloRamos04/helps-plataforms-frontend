// src/api.js
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  // Aumentar timeout para evitar erros em redes mais lentas
  timeout: 15000
});

// Helper function to parse JWT token payload
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
    console.error('Error parsing JWT token', e);
    return null;
  }
};

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log da requisição para debug
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log da resposta para debug
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // Log detalhado do erro para debug
      console.error('API Error:', {
        status: error.response.status,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data
      });
      
      // Tratamento de erros de autenticação
      if (error.response.status === 401) {
        console.warn('Unauthorized request - token may be invalid or expired');
        // Opcionalmente, poderia redirecionar para login ou atualizar o token
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth service functions
export const authService = {
  login: async (credentials) => {
    try {
      console.log('Tentando login com:', credentials.username);
      const response = await api.post('/login', credentials);
      const data = response.data;
      
      console.log('Login response:', data);
      
      // Store the access token (note the spelling "acessToken" from backend)
      if (data.acessToken || data.accessToken) {
        const token = data.acessToken || data.accessToken;
        
        // Store token in localStorage
        localStorage.setItem('token', token);
        
        // Parse token to get user info
        const tokenPayload = parseJwt(token);
        
        if (tokenPayload) {
          const user = {
            id: tokenPayload.sub,
            username: tokenPayload.username,
            roles: tokenPayload.roles || [],
            name: tokenPayload.name
          };
          
          // Store user data from token
          localStorage.setItem('user', JSON.stringify(user));
          
          console.log('Auth data stored:', { 
            token: token.substring(0, 20) + '...',
            user 
          });
          
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
      console.error('Login error:', error);
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
        console.error('Error parsing user from localStorage:', error);
        return null;
      }
    }
    return null;
  }
};

export default api;