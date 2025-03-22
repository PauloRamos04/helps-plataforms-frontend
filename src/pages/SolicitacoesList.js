import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Button,
  Alert, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { chamadoService } from '../api/chamadoService';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';

function SolicitacoesList() {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChamados();
  }, []);

  const fetchChamados = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chamadoService.getChamados();
      setChamados(data);
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
      setError('Não foi possível carregar as solicitações. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
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

  const handleRowClick = (id) => {
    navigate(`/chamados/${id}`);
  };

  const renderStatus = (status) => {
    const { bg, color } = getStatusColor(status);
    
    return (
      <Chip 
        label={status.replace('_', ' ')}
        sx={{ 
          bgcolor: bg, 
          color: color,
          fontWeight: 'medium',
          fontSize: '12px'
        }}
        size="small"
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: '8px',
          p: 3
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 'medium' }}>
            Solicitações
          </Typography>
          
          <Box>
            <Tooltip title="Atualizar">
              <IconButton 
                onClick={fetchChamados} 
                disabled={loading}
                sx={{ ml: 1 }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="contained"
              onClick={() => navigate('/novo-chamado')}
              sx={{ 
                bgcolor: '#4966f2',
                borderRadius: '4px',
                textTransform: 'none',
                ml: 2
              }}
            >
              Nova Solicitação
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress size={40} sx={{ color: '#4966f2' }} />
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium', color: '#666', fontSize: '14px' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#666', fontSize: '14px' }}>CATEGORIA</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#666', fontSize: '14px' }}>TÍTULO</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#666', fontSize: '14px' }}>DATA</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#666', fontSize: '14px' }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#666', fontSize: '14px' }}>AÇÕES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chamados.length > 0 ? (
                  chamados.map((chamado) => (
                    <TableRow 
                      key={chamado.id}
                      sx={{ 
                        '&:hover': { 
                          bgcolor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <TableCell sx={{ fontSize: '14px' }}>{`#${chamado.id}`}</TableCell>
                      <TableCell sx={{ fontSize: '14px' }}>{chamado.categoria || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '14px' }}>{chamado.titulo}</TableCell>
                      <TableCell sx={{ fontSize: '14px' }}>
                        {formatDate(chamado.dataAbertura)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px' }}>
                        {renderStatus(chamado.status || 'ABERTO')}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Visualizar detalhes">
                          <IconButton 
                            size="small" 
                            onClick={() => handleRowClick(chamado.id)}
                            sx={{ color: '#4966f2' }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        Nenhuma solicitação encontrada
                      </Typography>
                      <Button 
                        variant="text" 
                        sx={{ mt: 1, color: '#4966f2' }}
                        onClick={() => navigate('/novo-chamado')}
                      >
                        Criar nova solicitação
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

export default SolicitacoesList;