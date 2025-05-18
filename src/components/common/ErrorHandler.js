import React from 'react';
import { Alert, Box, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

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