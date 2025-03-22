import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Grid, Chip, TextField,
  CircularProgress, Alert, Radio, RadioGroup, FormControlLabel,
  Divider, Card, CardContent, FormControl
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { chamadoService } from '../api/chamadoService';

function ChamadoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chamado, setChamado] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [selectedHelper, setSelectedHelper] = useState('');

  useEffect(() => {
    fetchChamado();
    fetchMensagens();
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
      console.error('Erro ao carregar detalhes do chamado:', error);
      setError('Não foi possível carregar os detalhes do chamado. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMensagens = async () => {
    try {
      const data = await chamadoService.getMensagens(id);
      setMensagens(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const handleEnviarMensagem = async () => {
    if (!mensagem.trim()) return;

    try {
      setSending(true);
      await chamadoService.enviarMensagem(id, { conteudo: mensagem });
      setMensagem('');
      fetchMensagens();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Não foi possível enviar a mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const handleHelperChange = (event) => {
    setSelectedHelper(event.target.value);
  };

  const handleAderir = async () => {
    try {
      await chamadoService.aderirChamado(id);
      fetchChamado();
    } catch (error) {
      console.error('Erro ao aderir ao chamado:', error);
      alert('Não foi possível aderir ao chamado. Tente novamente.');
    }
  };

  const handleFinalizar = async () => {
    try {
      await chamadoService.finalizarChamado(id);
      fetchChamado();
    } catch (error) {
      console.error('Erro ao finalizar chamado:', error);
      alert('Não foi possível finalizar o chamado. Tente novamente.');
    }
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
                {`Paulo Ramos`} {/* Aqui você poderia usar chamado.usuario?.nome se disponível */}
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

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Conversas
              </Typography>

              {mensagens.length > 0 ? (
                mensagens.map((msg, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2, borderRadius: '8px' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2">
                          {msg.autor?.nome || 'Usuário'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(msg.dataEnvio)}
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        {msg.conteudo}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Box sx={{ p: 3, bgcolor: '#f9f9f9', borderRadius: '4px', textAlign: 'center' }}>
                  <Typography color="textSecondary">
                    Nenhuma mensagem ainda. Inicie a conversa!
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Digite sua mensagem aqui..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                variant="outlined"
                sx={{ 
                  '.MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: '4px'
                  },
                  mb: 2
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleEnviarMensagem}
                  disabled={sending || !mensagem.trim()}
                  sx={{ 
                    bgcolor: '#4966f2',
                    borderRadius: '4px',
                    textTransform: 'none'
                  }}
                >
                  {sending ? 'Enviando...' : 'Enviar'}
                </Button>
              </Box>
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

              <FormControl component="fieldset">
                <RadioGroup value={selectedHelper} onChange={handleHelperChange}>
                  <FormControlLabel 
                    value="" 
                    control={<Radio />} 
                    label="Helper Vinculado" 
                    disabled={chamado.status === 'EM_ATENDIMENTO' || chamado.status === 'FECHADO'} 
                  />
                  <FormControlLabel 
                    value="HELPER 1" 
                    control={<Radio />} 
                    label="Helper 1" 
                    disabled={chamado.status === 'EM_ATENDIMENTO' || chamado.status === 'FECHADO'} 
                  />
                  <FormControlLabel 
                    value="HELPER 2" 
                    control={<Radio />} 
                    label="Helper 2" 
                    disabled={chamado.status === 'EM_ATENDIMENTO' || chamado.status === 'FECHADO'} 
                  />
                </RadioGroup>
              </FormControl>

              <Box sx={{ mt: 3 }}>
                {chamado.status === 'ABERTO' && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAderir}
                    sx={{ 
                      bgcolor: '#4966f2',
                      borderRadius: '4px',
                      textTransform: 'none',
                      mb: 2
                    }}
                  >
                    Aderir ao Chamado
                  </Button>
                )}

                {chamado.status === 'EM_ATENDIMENTO' && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleFinalizar}
                    sx={{ 
                      bgcolor: '#4CAF50',
                      borderRadius: '4px',
                      textTransform: 'none',
                      mb: 2
                    }}
                  >
                    Finalizar
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
    </Box>
  );
}

export default ChamadoDetail;