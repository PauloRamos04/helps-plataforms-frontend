import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: null,
    token: null,
    sessionId: null
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const sessionId = localStorage.getItem('sessionId');

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            
            if (!user.roles) {
              user.roles = [];
            } else if (!Array.isArray(user.roles)) {
              user.roles = [user.roles];
            }

            setAuth({
              isAuthenticated: true,
              user,
              token,
              sessionId
            });
          } catch (error) {
            console.error('Error parsing user JSON:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('sessionId');
          }
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);

    try {
      const response = await authService.login(credentials);

      if (response.success) {
        const user = response.user;
        const token = response.token;
        const sessionId = response.sessionId;

        if (!user.roles) {
          user.roles = [];
        } else if (!Array.isArray(user.roles)) {
          user.roles = [user.roles];
        }

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('sessionId', sessionId);

        setAuth({
          isAuthenticated: true,
          user: user,
          token: token,
          sessionId: sessionId
        });
      }

      setIsLoading(false);
      return response;
    } catch (error) {
      console.error('Error in login function:', error);
      setIsLoading(false);
      return {
        success: false,
        message: error.message || 'Erro ao fazer login'
      };
    }
  };

  const logout = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      
      if (sessionId) {
        await authService.logout(sessionId);
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionId');
      
      setAuth({
        isAuthenticated: false,
        user: null,
        token: null,
        sessionId: null
      });

      window.location.href = '/login';
    }
  };

  const hasRole = (roleToCheck) => {
    if (!auth.isAuthenticated || !auth.user || !auth.user.roles) {
      return false;
    }

    const normalizeRole = (role) => {
      if (typeof role !== 'string') return '';
      return role.replace('ROLE_', '').toUpperCase();
    };

    const normalizedRoleToCheck = normalizeRole(roleToCheck);

    return auth.user.roles.some(role => {
      const normalizedUserRole = normalizeRole(role);
      return normalizedUserRole === normalizedRoleToCheck;
    });
  };

  const contextValue = {
    auth,
    login,
    logout,
    isLoading,
    hasRole
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;