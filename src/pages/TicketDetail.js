import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, 
  CircularProgress, Alert, Dialog, DialogContent
} from '@mui/material';
import { useParams } from 'react-router-dom';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import AuthContext from '../context/AuthContext';
import { ticketService } from '../services/ticketService';
import PageHeader from '../components/common/PageHeader';
import TicketChat from '../components/tickets/TicketChat';
import TicketInfo from '../components/tickets/TicketInfo';
// Removida a importação de TicketActions
import ErrorHandler from '../components/common/ErrorHandler';

function TicketDetail() {
  const { id } = useParams();
  const { auth } = useContext(AuthContext);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Tenta buscar o chamado - verifica qual função está disponível
      const data = await ticketService.getTicketById(id);
      
      console.log("Dados do ticket recebidos:", data);
      
      // Verificação de segurança - importante para evitar tela em branco
      if (!data) {
        throw new Error('Dados do chamado não encontrados');
      }
      
      setTicket(data);
    } catch (error) {
      console.error("Erro ao carregar chamado:", error);
      
      // Mensagem de erro mais específica baseada no código de status
      if (error.response && error.response.status) {
        if (error.response.status === 404) {
          setError('Chamado não encontrado. Verifique o ID e tente novamente.');
        } else if (error.response.status === 500) {
          setError('Erro no servidor. Por favor, tente novamente mais tarde.');
        } else if (error.response.status === 401 || error.response.status === 403) {
          setError('Você não tem permissão para acessar este chamado.');
        } else {
          setError(`Erro ao carregar os detalhes do chamado (${error.response.status}). Tente novamente.`);
        }
      } else {
        setError('Não foi possível carregar os detalhes do chamado. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenImageDialog = () => {
    setImageDialogOpen(true);
  };
  
  const handleCloseImageDialog = () => {
    setImageDialogOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress size={40} sx={{ color: '#4966f2' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <ErrorHandler 
          message={error} 
          onRetry={fetchTicket}
        />
      </Box>
    );
  }

  if (!ticket) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Chamado não encontrado.</Alert>
      </Box>
    );
  }

  // Compatibilidade para diferentes estruturas de dados
  const title = ticket.title || ticket.titulo || `Chamado #${id}`;
  
  try {
    return (
      <Box sx={{ p: 3 }}>
        {/* Main container */}
        <Box sx={{ mb: 3 }}>
          {/* Header */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2,
              borderRadius: '8px 8px 0 0',
              border: '1px solid #e0e0e0',
              borderBottom: 'none',
              bgcolor: '#f5f5f5',
            }}
          >
            <PageHeader 
              title={title}
              backUrl="/tickets"
            />
          </Paper>

          {/* Content divided into two columns */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }
          }}>
            {/* Chat Column */}
            <Box sx={{ 
              width: { xs: '100%', md: '60%' },
              border: '1px solid #e0e0e0',
              borderRight: { xs: '1px solid #e0e0e0', md: 'none' },
              borderRadius: { xs: '0 0 8px 8px', md: '0 0 0 8px' },
              overflow: 'hidden',
              minHeight: '300px'
            }}>
              <TicketChat 
                ticketId={parseInt(id)} 
                ticketStatus={ticket.status || 'ABERTO'}
              />
            </Box>

            {/* Information Column */}
            <Paper
              elevation={0}
              sx={{ 
                width: { xs: '100%', md: '40%' },
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                border: '1px solid #e0e0e0',
                borderLeft: { xs: '1px solid #e0e0e0', md: 'none' },
                borderTop: { xs: 'none', md: '1px solid #e0e0e0' },
                borderRadius: { xs: '0', md: '0 0 8px 0' },
                mt: { xs: 0, md: 0 }
              }}
            >
              {/* Agora passamos onRefresh para o TicketInfo e removemos hideActions */}
              <TicketInfo 
                ticket={ticket} 
                onRefresh={fetchTicket} 
              />
              
              {/* Removido o componente TicketActions e a imagem duplicada */}
            </Paper>
          </Box>
        </Box>

        {/* Removido o Dialog duplicado, pois já existe no TicketInfo */}
      </Box>
    );
  } catch (renderError) {
    console.error("Erro ao renderizar o componente:", renderError);
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Erro ao exibir os detalhes do chamado. Por favor, atualize a página.
        </Alert>
      </Box>
    );
  }
}

export default TicketDetail;