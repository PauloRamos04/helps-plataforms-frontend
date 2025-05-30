import React, { useState, useContext, useEffect } from 'react';
import { 
  Box, Typography, Button, Divider, CircularProgress,
  Paper, Chip, Tooltip, Dialog, DialogContent, DialogTitle,
  DialogActions, DialogContentText
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import ticketService from '../../services/ticketService';  
import notificationWebSocketService from '../../services/notificationWebSocketService';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';

const TicketInfo = ({ ticket, onRefresh, hideActions = false }) => {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [confirmCloseDialog, setConfirmCloseDialog] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(ticket);
  
  useEffect(() => {
    setCurrentTicket(ticket);
  }, [ticket]);

  useEffect(() => {
    if (!currentTicket?.id) return;

    const handleTicketUpdate = (wsMessage) => {
      if (wsMessage.type === 'STATUS' && wsMessage.ticketId === currentTicket.id) {
        setTimeout(() => {
          if (onRefresh) onRefresh();
        }, 500);
      }
    };

    notificationWebSocketService.connect(
      () => {
        notificationWebSocketService.subscribe(
          `/topic/ticket/${currentTicket.id}`, 
          handleTicketUpdate
        );
      },
      (error) => {
        console.error('Erro WebSocket ticket info:', error);
      }
    );

    return () => {
      notificationWebSocketService.unsubscribe(`/topic/ticket/${currentTicket.id}`);
    };
  }, [currentTicket?.id, onRefresh]);
  
  const handleAderir = async () => {
    try {
      setActionInProgress(true);
      try {
        await ticketService.assignTicket(currentTicket.id);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          await ticketService.assignTicketLegacy(currentTicket.id);
        } else {
          throw error;
        }
      }
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error assigning ticket:', error);
    } finally {
      setActionInProgress(false);
    }
  };
  
  const handleOpenCloseConfirmation = () => {
    setConfirmCloseDialog(true);
  };

  const handleCloseConfirmation = () => {
    setConfirmCloseDialog(false);
  };
  
  const handleFinalizar = async () => {
    try {
      setActionInProgress(true);
      setConfirmCloseDialog(false);
      
      try {
        await ticketService.closeTicket(currentTicket.id);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          await ticketService.closeTicketLegacy(currentTicket.id);
        } else {
          throw error;
        }
      }
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error closing ticket:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleOpenImageDialog = () => {
    setImageDialogOpen(true);
  };
  
  const handleCloseImageDialog = () => {
    setImageDialogOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ABERTO':
        return { bg: '#e3f2fd', color: '#0d47a1' };
      case 'EM_ATENDIMENTO':
        return { bg: '#fff8e1', color: '#ff6f00' };
      case 'FECHADO':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      default:
        return { bg: '#f5f5f5', color: '#616161' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isHelperOrAdmin = () => {
    if (!auth || !auth.user || !auth.user.roles) return false;
    
    return auth.user.roles.some(role => 
      role === 'HELPER' || 
      role === 'ADMIN' ||
      role === 'ROLE_HELPER' || 
      role === 'ROLE_ADMIN'
    );
  };

  const isCurrentUserHelper = () => {
    return currentTicket?.helper?.id === auth?.user?.id;
  };
  
  if (!currentTicket) return null;

  const statusColor = getStatusColor(currentTicket.status);
  const imageUrl = currentTicket.imagePath ? ticketService.getImageUrl(currentTicket.imagePath) : null;

  return (
    <>
      <Paper
        elevation={0}
        sx={{ 
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'medium' }}>
              Descrição do Chamado
            </Typography>
            <Chip
              label={currentTicket.status?.replace('_', ' ') || 'ABERTO'}
              sx={{
                bgcolor: statusColor.bg,
                color: statusColor.color,
                fontWeight: 'medium',
                fontSize: '12px'
              }}
              size="small"
            />
          </Box>
          
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-wrap', 
              mb: imageUrl ? 3 : 0,
              color: '#333',
              wordBreak: 'break-word',
              lineHeight: 1.6
            }}
          >
            {currentTicket.description}
          </Typography>
          
          {imageUrl && (
            <Box sx={{ mt: 3, textAlign: 'center', position: 'relative' }}>
              <Box 
                sx={{ 
                  position: 'relative', 
                  display: 'inline-block',
                  maxWidth: '100%',
                  '&:hover .zoom-icon': {
                    opacity: 1
                  }
                }}
              >
                <img 
                  src={imageUrl} 
                  alt="Anexo do chamado" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  onClick={handleOpenImageDialog}
                />
                <Box 
                  className="zoom-icon"
                  sx={{ 
                    position: 'absolute', 
                    top: '8px', 
                    right: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '50%',
                    padding: '4px',
                    cursor: 'pointer',
                    opacity: 0,
                    transition: 'opacity 0.2s ease-in-out'
                  }}
                  onClick={handleOpenImageDialog}
                >
                  <ZoomOutMapIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Clique para ampliar a imagem
              </Typography>
            </Box>
          )}
        </Box>

        <Divider />

        <Box>
          <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 'medium' }}>
            Informações do Chamado
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Atendente Designado
            </Typography>
            
            {currentTicket.helper ? (
              <Box sx={{ mb: 2 }}>
                <Box 
                  sx={{ 
                    p: 2, 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '4px',
                    bgcolor: '#f9f9f9'
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                    {currentTicket.helper.name || currentTicket.helper.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {currentTicket.startDate ? `Atendendo desde ${formatDate(currentTicket.startDate)}` : ''}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box 
                sx={{ 
                  p: 2, 
                  border: '1px dashed #bdbdbd', 
                  borderRadius: '4px',
                  bgcolor: '#fafafa',
                  textAlign: 'center'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Nenhum atendente designado
                </Typography>
              </Box>
            )}
          </Box>

          {!hideActions && (
            <>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Ações
                </Typography>
                
                {isHelperOrAdmin() && currentTicket.status === 'ABERTO' && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAderir}
                    disabled={actionInProgress}
                    sx={{ 
                      bgcolor: '#4966f2',
                      borderRadius: '4px',
                      textTransform: 'none',
                      mb: 2,
                      py: 1
                    }}
                  >
                    {actionInProgress ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Assumir Este Chamado'}
                  </Button>
                )}

                {(isHelperOrAdmin() || isCurrentUserHelper()) && currentTicket.status === 'EM_ATENDIMENTO' && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleOpenCloseConfirmation}
                    disabled={actionInProgress}
                    sx={{ 
                      bgcolor: '#4CAF50',
                      borderRadius: '4px',
                      textTransform: 'none',
                      mb: 2,
                      py: 1
                    }}
                  >
                    Finalizar Chamado
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
            </>
          )}
        </Box>
      </Paper>
      
      <Dialog 
        open={imageDialogOpen} 
        onClose={handleCloseImageDialog}
        maxWidth="lg"
      >
        <DialogContent 
          sx={{ 
            p: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            bgcolor: '#000',
            position: 'relative'
          }}
        >
          {imageUrl && (
            <>
              <img 
                src={imageUrl} 
                alt="Anexo do chamado" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '80vh',
                  objectFit: 'contain'
                }}
              />
              <Button 
                variant="contained" 
                sx={{ 
                  position: 'absolute', 
                  bottom: 16, 
                  right: 16,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.7)'
                  }
                }}
                onClick={handleCloseImageDialog}
              >
                Fechar
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmCloseDialog}
        onClose={handleCloseConfirmation}
      >
        <DialogTitle>Confirmar Finalização do Chamado</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja finalizar este chamado?
            <br />
            <br />
            <strong>Esta ação não poderá ser desfeita.</strong> O chamado será marcado como resolvido e não poderá mais receber mensagens.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseConfirmation}
            disabled={actionInProgress}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleFinalizar}
            variant="contained"
            color="success"
            disabled={actionInProgress}
            sx={{ 
              bgcolor: '#4CAF50',
              '&:hover': { bgcolor: '#45a049' }
            }}
          >
            {actionInProgress ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Sim, Finalizar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TicketInfo;