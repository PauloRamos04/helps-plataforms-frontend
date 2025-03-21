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
  isLoading: false
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
            
            setAuth({
              isAuthenticated: true,
              user,
              token
            });
            
            console.log('Auth initialized from localStorage - user:', user.username);
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
        
        // Update auth state
        setAuth({
          isAuthenticated: true,
          user: response.user,
          token: response.token
        });
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

  // Value to provide to context consumers
  const contextValue = {
    auth,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Default export
export default AuthContext;