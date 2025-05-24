import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import AuthContext from '../../context/AuthContext';

const PrivateRoute = ({ children, requiredRole }) => {
  const { auth, isLoading, hasRole } = useContext(AuthContext);
  const location = useLocation();
  
  const [directAuthCheck, setDirectAuthCheck] = useState({
    isDone: false,
    isAuthenticated: false
  });
  
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const hasAuth = !!token;
        
        setDirectAuthCheck({
          isDone: true,
          isAuthenticated: hasAuth
        });
      } catch (error) {
        console.error('[PrivateRoute] Error checking auth:', error);
        setDirectAuthCheck({
          isDone: true,
          isAuthenticated: false
        });
      }
    };
    
    checkAuth();
  }, [location.pathname]);
  
  if (isLoading || !directAuthCheck.isDone) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!auth.isAuthenticated && !directAuthCheck.isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

export default PrivateRoute;