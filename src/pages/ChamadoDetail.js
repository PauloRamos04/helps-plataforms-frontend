import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, Paper, Button, Grid, Chip, 
  CircularProgress, Alert, Divider, Snackbar,
  Card, CardContent, Dialog, DialogContent, Tooltip
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
      const data = await chamadoService.getChamadoById(id);
      setChamado(data);
      if (data.helper && data.helper.username) {
        setSelectedHelper(data.helper.username);
      }
    } catch (error) {
      setError('Não foi possível carregar os detalhes do chamado. Tente novamente.');
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
          message: `Não é possível assumir um chamado com status ${chamado.status}`,
          severity: 'warning'
        });
        setActionInProgress(false);
        return;
      }
      
      await chamadoService.aderirChamado(id);
      await fetchChamado();
      
      setNotification({
        open: true,
        message: 'Você assumiu o chamado com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          'Não foi possível assumir o chamado. Verifique se o status está correto.';
      
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
        message: 'Chamado finalizado com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: 'Não foi possível finalizar o chamado. Tente novamente.',
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
          Voltar para lista de chamados
        </Button>
      </Box>
    );
  }

  if (!chamado) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Chamado não encontrado.</Alert>
        <Button 
          variant="text" 
          onClick={() => navigate('/chamados')}
          sx={{ mt: 2, color: '#4966f2' }}
        >
          Voltar para lista de chamados
        </Button>
      </Box>
    );
  }

  const statusColor = getStatusColor(chamado.status);
  const imageUrl = chamado.imagePath ? chamadoService.getImageUrl(chamado.imagePath) : null;

  return (
    <Box sx={{ p: 3 }}>
      {/* Container Principal */}
      <Box sx={{ mb: 3 }}>
        {/* Cabeçalho */}
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
          {/* Título e Status */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1
          }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              {chamado.title}
            </Typography>
            
            <Chip 
              label={chamado.status?.replace('_', ' ') || 'ABERTO'}
              sx={{ 
                bgcolor: statusColor.bg, 
                color: statusColor.color,
                fontWeight: 'medium',
              }}
            />
          </Box>
          
          {/* Info do usuário e categoria */}
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1
          }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Criado por: {chamado.user?.username} em {formatDate(chamado.openingDate)}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={chamado.category} arrow>
                <Chip 
                  label={`Categoria: ${chamado.category.length > 20 ? 
                    chamado.category.substring(0, 20) + '...' : 
                    chamado.category}`}
                  variant="outlined" 
                  size="small" 
                  sx={{ bgcolor: '#f0f0f0', height: 24 }} 
                />
              </Tooltip>
              
              <Chip 
                label={`Tipo: ${chamado.tipo}`} 
                variant="outlined" 
                size="small" 
                sx={{ bgcolor: '#f0f0f0', height: 24 }} 
              />
            </Box>
          </Box>
        </Paper>

        {/* Conteúdo dividido em duas colunas */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          {/* Coluna do Chat - Encapsulado em um Paper para manter borda consistente */}
          <Box sx={{ 
            width: { xs: '100%', md: '60%' },
            border: '1px solid #e0e0e0',
            borderRight: { xs: '1px solid #e0e0e0', md: 'none' },
            borderRadius: { xs: '0 0 8px 8px', md: '0 0 0 8px' },
            overflow: 'hidden',
            minHeight: '300px'
          }}>
            <ChatComponentWrapper 
              chamadoId={parseInt(id)} 
              chamadoStatus={chamado.status}
              alignUserMessages="right"
            />
          </Box>

          {/* Coluna de Informações */}
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
            {/* Card de descrição */}
            <Box>
              <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 'medium' }}>
                Descrição do Chamado
              </Typography>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  whiteSpace: 'pre-wrap', 
                  mb: imageUrl ? 3 : 0,
                  color: '#333',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  lineHeight: 1.6
                }}
              >
                {chamado.description}
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

            {/* Informações do chamado */}
            <Box>
              <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 'medium' }}>
                Informações do Chamado
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Atendente Designado
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
                        {chamado.dataInicio ? `Atendendo desde ${formatDate(chamado.dataInicio)}` : ''}
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

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Ações
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
                    {actionInProgress ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Assumir Este Chamado'}
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
                    {actionInProgress ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Finalizar Chamado'}
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
                  Voltar para lista
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

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

// Componente de wrapper para o ChatComponent
// Este componente simplesmente passa as props para o ChatComponent real
const ChatComponentWrapper = (props) => {
  return <ChatComponent {...props} />;
};

export default ChamadoDetail;