import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT, getDefaultConfig, ENDPOINTS, API_CODES } from '../config/apiConfig';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Function to parse JWT tokens
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

// Setup request interceptor to add token to requests
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

// Setup response interceptor to handle common error cases
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Get error details
    const { response, request, message } = error;
    
    // Create standardized error object
    const errorDetails = {
      message: 'An error occurred',
      statusCode: 500,
      data: null,
      originalError: error
    };
    
    // Handle response errors (server responded with error)
    if (response) {
      errorDetails.statusCode = response.status;
      errorDetails.data = response.data;
      
      // Extract message from response if available
      if (response.data && response.data.message) {
        errorDetails.message = response.data.message;
      } else {
        errorDetails.message = `Server error: ${response.status}`;
      }
      
      // Handle unauthorized errors (token expired or invalid)
      if (response.status === API_CODES.UNAUTHORIZED) {
        // Clear token and user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login page if not already there
        if (window.location.pathname !== '/login') {
          // Use timeout to avoid state updates during render
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
        
        errorDetails.message = 'Session expired. Please log in again.';
      }
    } 
    // Handle request errors (no response received)
    else if (request) {
      errorDetails.message = 'No response from server. Please check your connection.';
    } 
    // Handle client-side errors
    else {
      errorDetails.message = message;
    }
    
    // Log error for debugging
    console.error('API Error:', errorDetails);
    
    // Return rejected promise with enhanced error details
    return Promise.reject(errorDetails);
  }
);

// Auth service functions
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
          
          // Store auth data in localStorage
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