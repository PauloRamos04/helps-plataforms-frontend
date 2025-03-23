// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../api';

// Create the context
const AuthContext = createContext({
  auth: {
    isAuthenticated: false,
    user: null,
    token: null
  },
  login: () => {},
  logout: () => {},
  isLoading: false,
  hasRole: () => false
});

// Provider component
export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: null,
    token: null
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Load authentication state from localStorage on component mount
  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        console.log('Initial auth check - token exists:', !!token);
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            
            // Garantir que o usuário tem um array de roles
            if (!user.roles) {
              user.roles = [];
            } else if (!Array.isArray(user.roles)) {
              // Se roles não for um array, converter para array
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
  
  // Login function
  const login = async (credentials) => {
    setIsLoading(true);
    
    try {
      const response = await authService.login(credentials);
      
      if (response.success) {
        console.log('Login successful, updating state');
        
        // Garantir que o usuário tem um array de roles
        const user = response.user;
        if (!user.roles) {
          user.roles = [];
        } else if (!Array.isArray(user.roles)) {
          user.roles = [user.roles];
        }
        
        // Update auth state
        setAuth({
          isAuthenticated: true,
          user: user,
          token: response.token
        });
        
        console.log('User roles after login:', user.roles);
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

  // Logout function
  const logout = () => {
    authService.logout();
    
    setAuth({
      isAuthenticated: false,
      user: null,
      token: null
    });
  };
  
  // Function to check if user has a specific role
  const hasRole = (roleToCheck) => {
    if (!auth.isAuthenticated || !auth.user || !auth.user.roles) {
      return false;
    }
    
    // Normalizar o nome do role (remover prefixo ROLE_ se necessário)
    const normalizeRole = (role) => {
      if (typeof role !== 'string') return '';
      return role.replace('ROLE_', '').toUpperCase();
    };
    
    const normalizedRoleToCheck = normalizeRole(roleToCheck);
    
    // Verificar se o usuário tem o role procurado
    return auth.user.roles.some(role => {
      const normalizedUserRole = normalizeRole(role);
      return normalizedUserRole === normalizedRoleToCheck;
    });
  };

  // Value to provide to context consumers
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

// Default export
export default AuthContext;