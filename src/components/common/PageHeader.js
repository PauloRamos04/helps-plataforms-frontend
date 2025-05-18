import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({ 
  title, 
  backUrl = null, 
  actionButton = null 
}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      mb: 3 
    }}>
      <Typography variant="h6" component="h1" sx={{ fontWeight: 'medium' }}>
        {title}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        {backUrl && (
          <Button
            variant="outlined"
            onClick={() => navigate(backUrl)}
            sx={{ 
              borderColor: '#e0e0e0',
              color: '#666',
              borderRadius: '4px',
              textTransform: 'none'
            }}
          >
            Voltar
          </Button>
        )}
        
        {actionButton}
      </Box>
    </Box>
  );
};

export default PageHeader;