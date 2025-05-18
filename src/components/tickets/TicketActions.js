import React, { useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTicketActions } from '../../hooks/useTicketActions';

const TicketActions = ({ ticket, onSuccess }) => {
  const navigate = useNavigate();
  const { assignTicket, closeTicket, loading } = useTicketActions(ticket?.id, onSuccess);
  
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Ações
      </Typography>
      
      {ticket?.status === 'ABERTO' && (
        <Button
          fullWidth
          variant="contained"
          onClick={assignTicket}
          disabled={loading}
          sx={{ 
            bgcolor: '#4966f2',
            borderRadius: '4px',
            textTransform: 'none',
            mb: 2,
            py: 1
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Assumir Este Chamado'}
        </Button>
      )}

      {ticket?.status === 'EM_ATENDIMENTO' && (
        <Button
          fullWidth
          variant="contained"
          onClick={closeTicket}
          disabled={loading}
          sx={{ 
            bgcolor: '#4CAF50',
            borderRadius: '4px',
            textTransform: 'none',
            mb: 2,
            py: 1
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Finalizar Chamado'}
        </Button>
      )}

      <Button
        fullWidth
        variant="outlined"
        onClick={() => navigate('/tickets')}
        sx={{ 
          borderColor: '#e0e0e0',
          color: '#666',
          borderRadius: '4px',
          textTransform: 'none',
          py: 1
        }}
      >
        Voltar para lista
      </Button>
    </Box>
  );
};

export default TicketActions;