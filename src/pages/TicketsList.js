import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, 
  Tooltip, TextField, InputAdornment, FormControl, 
  InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import ErrorHandler from '../components/common/ErrorHandler';
import LoadingFallback from '../components/common/LoadingFallback';
import StatusBadge from '../components/tickets/StatusBadge';
import useTickets from '../hooks/useTickets';
import { formatDate } from '../utils/dateUtils';

// CSS para animação de pulse
const pulseAnimation = `
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
`;

// Adicionar CSS ao head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = pulseAnimation;
  document.head.appendChild(style);
}

function TicketsList() {
  const navigate = useNavigate();
  const { filteredTickets, loading, error, fetchTickets, updateFilters } = useTickets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const isInitialMount = useRef(true);
  const filterTimer = useRef(null);
  
  const categories = ['SUPORTE', 'FINANCEIRO', 'TÉCNICO'];
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (filterTimer.current) {
      clearTimeout(filterTimer.current);
    }
    
    filterTimer.current = setTimeout(() => {
      updateFilters({
        search: searchQuery,
        status: statusFilter,
        category: categoryFilter
      });
    }, 300);
    
    return () => {
      if (filterTimer.current) {
        clearTimeout(filterTimer.current);
      }
    };
  }, [searchQuery, statusFilter, categoryFilter, updateFilters]);
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };
  
  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
  };
  
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setCategoryFilter('');
  };
  
  const toggleShowFilters = () => {
    setShowFilters(prev => !prev);
  };
  
  const handleRowClick = (id) => {
    navigate(`/tickets/${id}`);
  };

  const getUserDisplayName = (ticket) => {
    const user = ticket.user || ticket.usuario || ticket.solicitante;
    if (!user) return 'Usuário não identificado';
    
    return user.name || user.nome || user.username || 'Usuário';
  };

  // Função para obter estatísticas dos tickets
  const getTicketStats = () => {
    const total = filteredTickets.length;
    const open = filteredTickets.filter(t => t.status === 'ABERTO').length;
    const inProgress = filteredTickets.filter(t => t.status === 'EM_ATENDIMENTO').length;
    const closed = filteredTickets.filter(t => t.status === 'FECHADO').length;
    
    return { total, open, inProgress, closed };
  };

  const stats = getTicketStats();

  // Função para compatibilidade com diferentes estruturas de resposta
  const getCompatibleTickets = () => {
    if (!filteredTickets) return [];
    
    // Se filteredTickets é um array, use diretamente
    if (Array.isArray(filteredTickets)) {
      return filteredTickets;
    }
    
    // Se é um objeto com propriedade data (ApiResponse)
    if (filteredTickets.data && Array.isArray(filteredTickets.data)) {
      return filteredTickets.data;
    }
    
    // Se é um objeto com propriedade success (ApiResponse)
    if (filteredTickets.success && filteredTickets.data && Array.isArray(filteredTickets.data)) {
      return filteredTickets.data;
    }
    
    return [];
  };

  const tickets = getCompatibleTickets();
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
          Meus Chamados
        </Typography>
        
        {/* Estatísticas dos tickets */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ 
            p: 2, 
            bgcolor: '#e3f2fd', 
            borderRadius: '8px', 
            minWidth: '120px',
            textAlign: 'center'
          }}>
            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              {stats.total}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Total
            </Typography>
          </Box>
          
          <Box sx={{ 
            p: 2, 
            bgcolor: '#fff3e0', 
            borderRadius: '8px', 
            minWidth: '120px',
            textAlign: 'center'
          }}>
            <Typography variant="h6" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
              {stats.open}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Abertos
            </Typography>
          </Box>
          
          <Box sx={{ 
            p: 2, 
            bgcolor: '#e8f5e8', 
            borderRadius: '8px', 
            minWidth: '120px',
            textAlign: 'center'
          }}>
            <Typography variant="h6" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
              {stats.inProgress}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Em Atendimento
            </Typography>
          </Box>
          
          <Box sx={{ 
            p: 2, 
            bgcolor: '#f3e5f5', 
            borderRadius: '8px', 
            minWidth: '120px',
            textAlign: 'center'
          }}>
            <Typography variant="h6" sx={{ color: '#7b1fa2', fontWeight: 'bold' }}>
              {stats.closed}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Finalizados
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/tickets/new')}
              sx={{ 
                bgcolor: '#4966f2',
                '&:hover': { bgcolor: '#3f51b5' },
                textTransform: 'none',
                fontWeight: 'medium'
              }}
            >
              Novo Chamado
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={toggleShowFilters}
              sx={{ 
                borderColor: '#e0e0e0',
                color: '#666',
                textTransform: 'none'
              }}
            >
              {showFilters ? 'Ocultar Filtros' : 'Filtros'}
            </Button>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchTickets}
            disabled={loading}
            sx={{ 
              borderColor: '#e0e0e0',
              color: '#666',
              textTransform: 'none'
            }}
          >
            Atualizar
          </Button>
        </Box>
      </Box>
        
        {showFilters && (
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: '4px' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="Buscar por título, descrição, ID..."
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={statusFilter}
                    label="Status"
                    onChange={handleStatusFilterChange}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="ABERTO">ABERTO</MenuItem>
                    <MenuItem value="EM_ATENDIMENTO">EM ATENDIMENTO</MenuItem>
                    <MenuItem value="FECHADO">FECHADO</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="categoria-filter-label">Categoria</InputLabel>
                  <Select
                    labelId="categoria-filter-label"
                    value={categoryFilter}
                    label="Categoria"
                    onChange={handleCategoryFilterChange}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={2}>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  fullWidth
                  sx={{ borderColor: '#e0e0e0', color: '#666' }}
                >
                  Limpar Filtros
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {error && <ErrorHandler message={error} onRetry={fetchTickets} />}
        
        {loading ? (
          <LoadingFallback />
        ) : (
          <Paper elevation={0} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>CATEGORIA</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>TÍTULO</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>SOLICITANTE</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>DATA</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>STATUS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket) => {
                      const isHighPriority = ticket.status === 'EM_ATENDIMENTO';
                      const isOpen = ticket.status === 'ABERTO';
                      
                      return (
                        <TableRow 
                          key={ticket.id}
                          sx={{ 
                            '&:hover': { 
                              bgcolor: 'rgba(0, 0, 0, 0.04)',
                              cursor: 'pointer'
                            },
                            bgcolor: isHighPriority ? '#fff8e1' : 'inherit',
                            borderLeft: isHighPriority ? '4px solid #ff9800' : '4px solid transparent'
                          }}
                          onClick={() => handleRowClick(ticket.id)}
                        >
                          <TableCell sx={{ fontSize: '14px', fontWeight: 'bold' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {isHighPriority && (
                                <Box 
                                  sx={{ 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: '50%', 
                                    bgcolor: '#ff9800',
                                    animation: 'pulse 2s infinite'
                                  }} 
                                />
                              )}
                              #{ticket.id}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontSize: '14px' }}>
                            <Box
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                bgcolor: '#f0f0f0',
                                borderRadius: '12px',
                                display: 'inline-block',
                                fontSize: '12px',
                                fontWeight: 'medium',
                                color: '#666'
                              }}
                            >
                              {ticket.category || ticket.categoria || '-'}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontSize: '14px', maxWidth: '300px' }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: isHighPriority ? 'bold' : 'normal'
                              }}
                            >
                              {ticket.title || ticket.titulo}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: '14px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  bgcolor: isHighPriority ? '#ff9800' : '#4966f2',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  mr: 1
                                }}
                              >
                                {getUserDisplayName(ticket).charAt(0).toUpperCase()}
                              </Box>
                              <Typography variant="body2">
                                {getUserDisplayName(ticket)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontSize: '14px' }}>
                            {formatDate(ticket.openingDate)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '14px' }}>
                            <StatusBadge status={ticket.status || 'ABERTO'} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary" variant="h6" sx={{ mb: 1 }}>
                          Nenhum chamado encontrado
                        </Typography>
                        <Typography color="textSecondary" variant="body2" sx={{ mb: 2 }}>
                          {searchQuery || statusFilter || categoryFilter 
                            ? 'Tente ajustar os filtros de busca'
                            : 'Crie seu primeiro chamado para começar'
                          }
                        </Typography>
                        <Button 
                          variant="contained" 
                          sx={{ 
                            bgcolor: '#4966f2',
                            '&:hover': { bgcolor: '#3f51b5' },
                            textTransform: 'none'
                          }}
                          onClick={() => navigate('/tickets/new')}
                        >
                          Criar novo chamado
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
    </Box>
  );
}

export default TicketsList;