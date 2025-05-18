import api from '../api.js';

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

export const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      const data = response.data;
      
      if (data.accessToken || data.acessToken) {
        const token = data.accessToken || data.acessToken;
        const tokenPayload = parseJwt(token);
        
        if (tokenPayload) {
          const user = {
            id: tokenPayload.sub,
            username: tokenPayload.username || tokenPayload.preferred_username,
            roles: tokenPayload.roles || [],
            name: tokenPayload.name || tokenPayload.nome || tokenPayload.username
          };
          
          // Normalize roles
          if (!Array.isArray(user.roles)) {
            user.roles = [user.roles];
          }
          
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
        message: error.message || 'Authentication failed'
      };
    }
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    return { success: true };
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  // Get current user data
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