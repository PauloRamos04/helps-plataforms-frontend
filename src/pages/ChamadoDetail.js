import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, Paper, Button, Grid, Chip, 
  CircularProgress, Alert, Divider, Snackbar,
  Card, CardContent, Dialog, DialogContent
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { chamadoService } from '../api/chamadoService';
import ChatComponent from '../components/chat/ChatComponent';
import AuthContext from '../context/AuthContext';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';

function ChamadoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const [chamado, setChamado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [selectedHelper, setSelectedHelper] = useState('');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  useEffect(() => {
    fetchChamado();
  }, [id]);

  const fetchChamado = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching ticket data ID:', id);
      const data = await chamadoService.getChamadoById(id);
      console.log('Ticket data received:', data);
      setChamado(data);
      if (data.helper && data.helper.username) {
        setSelectedHelper(data.helper.username);
      }
    } catch (error) {
      console.error('Error loading ticket details:', error);
      setError('Could not load ticket details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAderir = async () => {
    try {
      setActionInProgress(true);
      
      if (chamado.status !== 'ABERTO') {
        setNotification({
          open: true,
          message: `Cannot take a ticket with status ${chamado.status}`,
          severity: 'warning'
        });
        setActionInProgress(false);
        return;
      }
      
      await chamadoService.aderirChamado(id);
      await fetchChamado();
      
      setNotification({
        open: true,
        message: 'You have successfully taken the ticket!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error taking ticket:', error);
      
      const errorMessage = error.response?.data?.message || 
                          'Could not take the ticket. Check if the status is correct.';
      
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setActionInProgress(false);
    }
  };

  const handleFinalizar = async () => {
    try {
      setActionInProgress(true);
      await chamadoService.finalizarChamado(id);
      await fetchChamado();
      setNotification({
        open: true,
        message: 'Ticket finalized successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error finalizing ticket:', error);
      setNotification({
        open: true,
        message: 'Could not finalize the ticket. Try again.',
        severity: 'error'
      });
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
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
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="text" 
          onClick={() => navigate('/chamados')}
          sx={{ mt: 2, color: '#4966f2' }}
        >
          Back to tickets list
        </Button>
      </Box>
    );
  }

  if (!chamado) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Ticket not found.</Alert>
        <Button 
          variant="text" 
          onClick={() => navigate('/chamados')}
          sx={{ mt: 2, color: '#4966f2' }}
        >
          Back to tickets list
        </Button>
      </Box>
    );
  }

  const statusColor = getStatusColor(chamado.status);
  const imageUrl = chamado.imagePath ? chamadoService.getImageUrl(chamado.imagePath) : null;

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: '8px',
          p: 3,
          mb: 3
        }}
      >
        {/* Ticket Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              {chamado.titulo}
            </Typography>
            
            <Chip 
              label={chamado.status?.replace('_', ' ') || 'OPEN'}
              sx={{ 
                bgcolor: statusColor.bg, 
                color: statusColor.color,
                fontWeight: 'medium',
                fontSize: '0.875rem',
                py: 0.5,
                px: 1
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', mb: 1 }}>
            <Typography sx={{ color: '#666', mr: 1 }}>
              <strong>Created by:</strong> {chamado.usuario?.name || chamado.usuario?.username || 'User'}
            </Typography>
            <Typography sx={{ color: '#666', fontSize: '14px' }}>
              on {formatDate(chamado.dataAbertura)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip 
              label={`Category: ${chamado.categoria}`} 
              variant="outlined" 
              size="small" 
              sx={{ bgcolor: '#f0f0f0' }} 
            />
            <Chip 
              label={`Type: ${chamado.tipo}`} 
              variant="outlined" 
              size="small" 
              sx={{ bgcolor: '#f0f0f0' }} 
            />
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Left Column: Ticket Details, Image and Chat */}
          <Grid item xs={12} md={8}>
            {/* Ticket Description Card */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 'medium' }}>
                  Description
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    whiteSpace: 'pre-wrap', 
                    mb: imageUrl ? 3 : 0,
                    color: '#333' 
                  }}
                >
                  {chamado.descricao}
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
                        alt="Ticket attachment" 
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
                      Click to enlarge image
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Divider sx={{ my: 3 }} />

            {/* Chat Section */}
            <Box sx={{ width: '100%', mb: 3 }}>
              <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 'medium' }}>
                Chat
              </Typography>
              <ChatComponent chamadoId={parseInt(id)} chamadoStatus={chamado.status} />
            </Box>
          </Grid>

          {/* Right Column: Status, Helper, Actions */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}
            >
              <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 'medium' }}>
                Ticket Information
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip 
                  label={chamado.status?.replace('_', ' ') || 'OPEN'}
                  sx={{ 
                    bgcolor: statusColor.bg, 
                    color: statusColor.color,
                    fontWeight: 'medium',
                    width: '100%',
                    justifyContent: 'left'
                  }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Assigned Helper
                </Typography>
                
                {chamado.helper ? (
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
                        {chamado.helper.name || chamado.helper.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {chamado.dataInicio ? `Attending since ${formatDate(chamado.dataInicio)}` : ''}
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
                      No helper assigned
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Actions
                </Typography>
                
                {isHelperOrAdmin() && chamado.status === 'ABERTO' && (
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
                    {actionInProgress ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Take This Ticket'}
                  </Button>
                )}

                {isHelperOrAdmin() && chamado.status === 'EM_ATENDIMENTO' && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleFinalizar}
                    disabled={actionInProgress}
                    sx={{ 
                      bgcolor: '#4CAF50',
                      borderRadius: '4px',
                      textTransform: 'none',
                      mb: 2,
                      py: 1
                    }}
                  >
                    {actionInProgress ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Finalize Ticket'}
                  </Button>
                )}

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/chamados')}
                  sx={{ 
                    borderColor: '#e0e0e0',
                    color: '#666',
                    borderRadius: '4px',
                    textTransform: 'none',
                    py: 1
                  }}
                >
                  Back to list
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Image Dialog */}
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
                alt="Ticket attachment" 
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
                Close
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ChamadoDetail;