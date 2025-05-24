import api from '../api.js';
import tokenService from './tokenService';

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

const validateTokenStructure = (token) => {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3;
};

export const authService = {
  login: async (credentials) => {
    try {
      if (!credentials.username || !credentials.password) {
        return {
          success: false,
          message: 'Username e senha são obrigatórios'
        };
      }

      const response = await api.post('/login', credentials);
      const data = response.data;
      
      const token = data.accessToken || data.acessToken;
      
      if (!token || !validateTokenStructure(token)) {
        return {
          success: false,
          message: 'Resposta de autenticação inválida'
        };
      }

      const tokenPayload = parseJwt(token);
      
      if (!tokenPayload || !tokenPayload.sub) {
        return {
          success: false,
          message: 'Token inválido recebido do servidor'
        };
      }

      const user = {
        id: tokenPayload.sub,
        username: tokenPayload.username || tokenPayload.preferred_username,
        roles: Array.isArray(tokenPayload.roles) ? tokenPayload.roles : [tokenPayload.roles].filter(Boolean),
        name: tokenPayload.name || tokenPayload.nome || tokenPayload.username
      };
      
      const sessionId = tokenPayload.sessionId;
      
      const storedSuccessfully = 
        tokenService.setToken(token) &&
        tokenService.setUser(user) &&
        (sessionId ? tokenService.setSessionId(sessionId) : true);
      
      if (!storedSuccessfully) {
        return {
          success: false,
          message: 'Erro ao armazenar dados de autenticação'
        };
      }
      
      return {
        success: true,
        user,
        token,
        sessionId
      };
      
    } catch (error) {
      let errorMessage = 'Falha na autenticação';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = error.response.data?.error || 'Usuário ou senha inválidos';
        } else if (error.response.status === 429) {
          errorMessage = 'Muitas tentativas de login. Tente novamente em alguns minutos.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  },
  
  logout: async (sessionId) => {
    try {
      const response = await api.post('/logout', { 
        sessionId: sessionId || tokenService.getSessionId() 
      });
      
      tokenService.clearAuth();
      
      return response.data;
    } catch (error) {
      tokenService.clearAuth();
      
      console.error('Erro no logout:', error);
      return { success: false, message: 'Erro ao fazer logout' };
    }
  },
  
  isAuthenticated: () => {
    return tokenService.isAuthenticated();
  },
  
  getCurrentUser: () => {
    return tokenService.getUser();
  },

  refreshToken: async () => {
    const currentToken = tokenService.getToken();
    if (!currentToken || tokenService.isTokenExpired(currentToken)) {
      return false;
    }

    try {
      const response = await api.post('/refresh-token');
      const newToken = response.data.accessToken;
      
      if (newToken && validateTokenStructure(newToken)) {
        tokenService.setToken(newToken);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return false;
    }
  },

  validateSession: async () => {
    try {
      const response = await api.get('/validate-session');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
};