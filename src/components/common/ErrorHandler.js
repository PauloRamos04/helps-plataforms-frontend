// src/components/common/ErrorHandler.js
import React from 'react';
import { Alert, Box, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * A reusable error handling component
 * @param {Object} props - Component props
 * @param {string} props.message - Error message to display
 * @param {Function} props.onRetry - Function to call when retry button is clicked
 * @param {string} props.severity - Alert severity (error, warning, info, success)
 * @param {boolean} props.showRetry - Whether to show retry button
 */
const ErrorHandler = ({ 
  message = 'Ocorreu um erro. Por favor, tente novamente.', 
  onRetry, 
  severity = 'error',
  showRetry = true 
}) => {
  return (
    <Box sx={{ my: 2 }}>
      <Alert 
        severity={severity}
        action={
          showRetry && onRetry ? (
            <Button
              color="inherit"
              size="small"
              onClick={onRetry}
              startIcon={<RefreshIcon />}
            >
              Tentar novamente
            </Button>
          ) : null
        }
      >
        {message}
      </Alert>
    </Box>
  );
};

export default ErrorHandler;