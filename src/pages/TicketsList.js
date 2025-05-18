import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, 
  Tooltip, TextField, InputAdornment, FormControl, 
  InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTickets } from '../hooks/useTickets';
import StatusBadge from '../components/tickets/StatusBadge';
import { formatDate } from '../utils/dateUtils';
import ErrorHandler from '../components/common/ErrorHandler';
import LoadingFallback from '../components/common/LoadingFallback';

function TicketsList() {
  const navigate = useNavigate();
  const { filteredTickets, loading, error, fetchTickets, updateFilters } = useTickets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Use refs para debounce e evitar atualizações desnecessárias
  const isInitialMount = useRef(true);
  const filterTimer = useRef(null);
  
  // Available categories
  const categories = ['SUPORTE', 'FINANCEIRO', 'TÉCNICO'];
  
  useEffect(() => {
    // Pule a primeira renderização
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Limpe o timer anterior se houver
    if (filterTimer.current) {
      clearTimeout(filterTimer.current);
    }
    
    // Debounce para evitar muitas chamadas
    filterTimer.current = setTimeout(() => {
      updateFilters({
        search: searchQuery,
        status: statusFilter,
        category: categoryFilter
      });
    }, 300); // 300ms debounce
    
    // Limpeza
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
            Tickets
          </Typography>
          
          <Box>
            <Button
              startIcon={<FilterListIcon />}
              onClick={toggleShowFilters}
              variant="outlined"
              size="small"
              sx={{ 
                borderColor: '#e0e0e0',
                color: '#666',
                mr: 1
              }}
            >
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
            
            <Tooltip title="Atualizar">
              <IconButton 
                onClick={fetchTickets} 
                disabled={loading}
                sx={{ ml: 1 }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="contained"
              onClick={() => navigate('/tickets/new')}
              sx={{ 
                bgcolor: '#4966f2',
                borderRadius: '4px',
                textTransform: 'none',
                ml: 2
              }}
            >
              Novo Chamado
            </Button>
          </Box>
        </Box>
        
        {/* Advanced filters */}
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
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <TableRow 
                      key={ticket.id}
                      sx={{ 
                        '&:hover': { 
                          bgcolor: 'rgba(0, 0, 0, 0.04)'
                        },
                        cursor: 'pointer'
                      }}
                      onClick={() => handleRowClick(ticket.id)}
                    >
                      <TableCell sx={{ fontSize: '14px' }}>{`#${ticket.id}`}</TableCell>
                      <TableCell sx={{ fontSize: '14px' }}>
                        {ticket.category || ticket.categoria || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px' }}>
                        {ticket.title || ticket.titulo}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px' }}>
                        {formatDate(
                          ticket.openingDate || 
                          ticket.dataAbertura || 
                          ticket.dataCriacao
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px' }}>
                        <StatusBadge status={ticket.status || 'ABERTO'} />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Ver detalhes">
                          <IconButton 
                            size="small" 
                            sx={{ color: '#4966f2' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(ticket.id);
                            }}
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
                        Nenhum chamado encontrado
                      </Typography>
                      <Button 
                        variant="text" 
                        sx={{ mt: 1, color: '#4966f2' }}
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
        )}
      </Paper>
    </Box>
  );
}

export default TicketsList;