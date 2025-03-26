import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: null,
    token: null
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        console.log('Initial auth check - token exists:', !!token);

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            
            // Normalize roles to always be an array
            if (!user.roles) {
              user.roles = [];
            } else if (!Array.isArray(user.roles)) {
              user.roles = [user.roles];
            }

            setAuth({
              isAuthenticated: true,
              user,
              token
            });

            console.log('Auth initialized from localStorage - user:', user.username);
            console.log('User roles:', user.roles);
          } catch (error) {
            console.error('Error parsing user JSON:', error);
            // Clear invalid data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
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

      console.log('Login response:', response);

      if (response.success) {
        console.log('Login successful, updating state');

        const user = response.user;
        const token = response.token;

        // Ensure roles is an array
        if (!user.roles) {
          user.roles = [];
        } else if (!Array.isArray(user.roles)) {
          user.roles = [user.roles];
        }

        // Explicitly store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        setAuth({
          isAuthenticated: true,
          user: user,
          token: token
        });

        console.log('User roles after login:', user.roles);
        console.log('Token stored:', !!localStorage.getItem('token'));
      } else {
        console.log('Login failed:', response.message);
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

  const logout = () => {
    authService.logout();

    setAuth({
      isAuthenticated: false,
      user: null,
      token: null
    });
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