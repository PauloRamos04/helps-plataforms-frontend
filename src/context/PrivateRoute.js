import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute = ({ children }) => {
  const { auth, isLoading } = useContext(AuthContext);
  const location = useLocation();
  
  // State for direct localStorage check
  const [directAuthCheck, setDirectAuthCheck] = useState({
    isDone: false,
    isAuthenticated: false
  });
  
  // Check authentication status directly from localStorage
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const hasAuth = !!token;
        
        console.log(`[PrivateRoute] Path: ${location.pathname}, Direct token check:`, hasAuth);
        
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
  
  // Show loading indicator while checks are in progress
  if (isLoading || !directAuthCheck.isDone) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If authentication fails from either context or direct check, redirect to login
  if (!auth.isAuthenticated && !directAuthCheck.isAuthenticated) {
    console.log('[PrivateRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" />;
  }
  
  // If authenticated by either method, render children
  console.log('[PrivateRoute] Authenticated, rendering protected route');
  return children;
};

export default PrivateRoute;