import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 15000
});

// Helper function to parse JWT tokens
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

// Add a request interceptor to attach the token to every request
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

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors by logging out
    if (error.response && error.response.status === 401) {
      // Save the current URL to redirect back after login
      localStorage.setItem('redirect_after_login', window.location.pathname);
      
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// AuthService for handling login and authentication
export const authService = {
  login: async (credentials) => {
    try {
      console.log('Login attempt with credentials:', { ...credentials, password: '[REDACTED]' });
      
      const response = await api.post('/login', credentials, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
      const data = response.data;
      console.log('Login response data:', data);
      
      // Handle different token field names in responses (accessToken or acessToken)
      if (data.accessToken || data.acessToken || data.token) {
        const token = data.accessToken || data.acessToken || data.token;
        
        const tokenPayload = parseJwt(token);
        console.log('Token payload:', tokenPayload);
        
        if (tokenPayload) {
          // Extract user info from token, with fallbacks for different field names
          const user = {
            id: tokenPayload.sub || tokenPayload.id || tokenPayload.userId,
            username: tokenPayload.username || tokenPayload.login || tokenPayload.preferred_username,
            roles: tokenPayload.roles || tokenPayload.authorities || [],
            name: tokenPayload.name || tokenPayload.nome || tokenPayload.username
          };
          
          // Normalize roles if needed
          if (typeof user.roles === 'string') {
            user.roles = [user.roles];
          } else if (!Array.isArray(user.roles)) {
            user.roles = [];
          }
          
          console.log('Login successful:', {
            user,
            token,
            tokenPayload
          });
          
          return {
            success: true,
            user,
            token
          };
        }
      }
      
      console.error('Invalid token or missing token in response:', data);
      return {
        success: false,
        message: 'Authentication error: invalid or missing token'
      };
    } catch (error) {
      console.error('Login error details:', error.response ? error.response.data : error);
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid credentials'
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