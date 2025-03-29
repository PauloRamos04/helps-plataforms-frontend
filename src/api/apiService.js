import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT, getDefaultConfig, ENDPOINTS, API_CODES } from '../config/apiConfig';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
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
    console.error('Error parsing JWT:', e);
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
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, request, message } = error;
    
    const errorDetails = {
      message: 'An error occurred',
      statusCode: 500,
      data: null,
      originalError: error
    };
    
    if (response) {
      errorDetails.statusCode = response.status;
      errorDetails.data = response.data;
      
      if (response.data && response.data.message) {
        errorDetails.message = response.data.message;
      } else {
        errorDetails.message = `Server error: ${response.status}`;
      }
      
      if (response.status === API_CODES.UNAUTHORIZED) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (window.location.pathname !== '/login') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
        
        errorDetails.message = 'Session expired. Please log in again.';
      }
    } 

    else if (request) {
      errorDetails.message = 'No response from server. Please check your connection.';
    } 
    else {
      errorDetails.message = message;
    }
    
    console.error('API Error:', errorDetails);
    
    return Promise.reject(errorDetails);
  }
);

export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post(ENDPOINTS.LOGIN, credentials);
      
      const data = response.data;
      
      if (data.acessToken || data.accessToken) {
        const token = data.acessToken || data.accessToken;
        const tokenPayload = parseJwt(token);
        
        if (tokenPayload) {
          const user = {
            id: tokenPayload.sub,
            username: tokenPayload.username,
            roles: tokenPayload.roles || [],
            name: tokenPayload.name
          };
          
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          return {
            success: true,
            user,
            token
          };
        }
      }
      
      return {
        success: false,
        message: 'Invalid authentication response'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Authentication failed',
        error
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