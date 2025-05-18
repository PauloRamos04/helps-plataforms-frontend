import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const LoadingFallback = () => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: 'calc(100vh - 64px)' 
  }}>
    <CircularProgress size={40} sx={{ color: '#4966f2' }} />
  </Box>
);

export default LoadingFallback;