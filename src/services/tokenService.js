const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const SESSION_KEY = 'auth_session';

const tokenService = {
  setToken: (token) => {
    if (!token) return false;
    try {
      localStorage.setItem(TOKEN_KEY, token);
      return true;
    } catch (error) {
      console.error('Error storing token:', error);
      return false;
    }
  },

  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  },

  hasToken: () => {
    const token = tokenService.getToken();
    if (!token) return false;
    
    return !tokenService.isTokenExpired(token);
  },

  removeToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  isTokenExpired: (token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  },

  getTokenPayload: (token = null) => {
    const tokenToUse = token || tokenService.getToken();
    if (!tokenToUse) return null;
    
    try {
      return JSON.parse(atob(tokenToUse.split('.')[1]));
    } catch (error) {
      return null;
    }
  },

  setUser: (user) => {
    if (!user) return false;
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Error storing user:', error);
      return false;
    }
  },

  getUser: () => {
    try {
      const userData = localStorage.getItem(USER_KEY);
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error retrieving user:', error);
    }
    return null;
  },

  removeUser: () => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error removing user:', error);
    }
  },

  setSessionId: (sessionId) => {
    if (!sessionId) return false;
    try {
      localStorage.setItem(SESSION_KEY, sessionId);
      return true;
    } catch (error) {
      console.error('Error storing session ID:', error);
      return false;
    }
  },

  getSessionId: () => {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch (error) {
      console.error('Error retrieving session ID:', error);
      return null;
    }
  },

  removeSessionId: () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Error removing session ID:', error);
    }
  },

  clearAuth: () => {
    tokenService.removeToken();
    tokenService.removeUser();
    tokenService.removeSessionId();
  },

  isAuthenticated: () => {
    return tokenService.hasToken() && !!tokenService.getUser();
  },

  refreshTokenIfNeeded: () => {
    const token = tokenService.getToken();
    if (!token) return false;
    
    const payload = tokenService.getTokenPayload(token);
    if (!payload) return false;
    
    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = payload.exp - currentTime;
    
    return timeUntilExpiry < 300;
  }
};

export default tokenService;