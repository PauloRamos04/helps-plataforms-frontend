import api from '../api.js';

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
          
          const sessionId = tokenPayload.sessionId;
          
          if (!Array.isArray(user.roles)) {
            user.roles = [user.roles];
          }
          
          return {
            success: true,
            user,
            token,
            sessionId
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
  
  logout: async (sessionId) => {
    try {
      const response = await api.post('/logout', { sessionId });
      return response.data;
    } catch (error) {
      console.error('Erro no logout:', error);
      return { success: false, message: 'Erro ao fazer logout' };
    }
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