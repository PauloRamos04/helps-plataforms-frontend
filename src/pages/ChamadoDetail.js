// src/pages/ChamadoDetail.js
import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, Paper, Button, Grid, Chip, 
  CircularProgress, Alert, Divider, Snackbar
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { chamadoService } from '../api/chamadoService';
import ChatComponent from '../components/chat/ChatComponent';
import AuthContext from '../context/AuthContext';

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

  useEffect(() => {
    fetchChamado();
  }, [id]);

  const fetchChamado = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Buscando dados do chamado ID:', id);
      const data = await chamadoService.getChamadoById(id);
      console.log('Dados do chamado recebidos:', data);
      setChamado(data);
      if (data.helper && data.helper.username) {
        setSelectedHelper(data.helper.username);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do chamado:', error);
      setError('Não foi possível carregar os detalhes do chamado. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Function to adhere to a chamado - UPDATED
  const handleAderir = async () => {
    try {
      setActionInProgress(true);
      console.log('Tentando aderir ao chamado:', id);
      console.log('Status atual do chamado antes de aderir:', chamado.status);
      
      // Check if chamado is in the correct state
      if (chamado.status !== 'ABERTO') {
        setNotification({
          open: true,
          message: `Não é possível aderir a um chamado com status ${chamado.status}`,
          severity: 'warning'
        });
        setActionInProgress(false);
        return;
      }
      
      await chamadoService.aderirChamado(id);
      await fetchChamado(); // Recarrega o chamado após aderir
      
      setNotification({
        open: true,
        message: 'Você aderiu ao chamado com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao aderir ao chamado:', error);
      
      // Extract the error message from the response if available
      const errorMessage = error.response?.data?.message || 
                          'Não foi possível aderir ao chamado. Verifique se o status está correto.';
      
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
      console.log('Tentando finalizar chamado:', id);
      await chamadoService.finalizarChamado(id);
      await fetchChamado(); // Recarrega o chamado após finalizar
      setNotification({
        open: true,
        message: 'Chamado finalizado com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao finalizar chamado:', error);
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

  // Verificar se o usuário atual é um helper ou admin
  const isHelperOrAdmin = () => {
    if (!auth || !auth.user || !auth.user.roles) return false;
    
    return auth.user.roles.some(role => 
      role === 'HELPER' || 
      role === 'ADMIN' ||
      role === 'ROLE_HELPER' || 
      role === 'ROLE_ADMIN'
    );
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
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h1" sx={{ fontWeight: 'medium' }}>
                {chamado.titulo}
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
            
            <Box sx={{ display: 'flex', mb: 2 }}>
              <Typography sx={{ color: '#666', mr: 1 }}>
                {`${chamado.usuario?.name || chamado.usuario?.username || 'Usuário'}`}
              </Typography>
              <Typography sx={{ color: '#999', fontSize: '14px' }}>
                (criou esta solicitação em {formatDate(chamado.dataAbertura)})
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={8}>
            <Box 
              sx={{ 
                p: 3, 
                bgcolor: '#f5f5f5', 
                borderRadius: '4px',
                mb: 3,
                minHeight: '150px'
              }}
            >
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                {chamado.descricao}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ width: '100%', mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Chat
              </Typography>
              <ChatComponent chamadoId={parseInt(id)} chamadoStatus={chamado.status} />
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Status
              </Typography>
              <Chip 
                label={chamado.status?.replace('_', ' ') || 'ABERTO'}
                sx={{ 
                  bgcolor: statusColor.bg, 
                  color: statusColor.color,
                  fontWeight: 'medium',
                  mb: 2
                }}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Helper Vinculado
              </Typography>

              {chamado.helper ? (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {chamado.helper.name || chamado.helper.username}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {chamado.dataInicio ? `Atendendo desde ${formatDate(chamado.dataInicio)}` : ''}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Nenhum helper vinculado
                </Typography>
              )}

              <Box sx={{ mt: 3 }}>
                {/* Botão de aderir ao chamado - apenas para helpers/admins e apenas para chamados ABERTOS */}
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
                      mb: 2
                    }}
                  >
                    {actionInProgress ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Aderir ao Chamado'}
                  </Button>
                )}

                {/* Botão de finalizar chamado - apenas para o helper vinculado e apenas para chamados EM_ATENDIMENTO */}
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
                      mb: 2
                    }}
                  >
                    {actionInProgress ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Finalizar'}
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
                    textTransform: 'none'
                  }}
                >
                  Voltar para a lista
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

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