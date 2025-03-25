import React, { useEffect, useState, useContext } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Button,
  Alert, CircularProgress, IconButton, Tooltip,
  TextField, InputAdornment, FormControl, InputLabel, 
  Select, MenuItem, Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { chamadoService } from '../api/chamadoService';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AuthContext from '../context/AuthContext';

function SolicitacoesList() {
  const [chamados, setChamados] = useState([]);
  const [filteredChamados, setFilteredChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  
  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Lista de categorias disponíveis
  const categorias = ['SUPORTE', 'FINANCEIRO', 'TÉCNICO'];

  useEffect(() => {
    fetchChamados();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [chamados, searchQuery, statusFilter, categoriaFilter]);

  const fetchChamados = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chamadoService.getChamados();
      
      // Filtra os chamados para mostrar apenas os criados pelo usuário atual
      // a menos que seja um ADMIN ou HELPER
      const isAdminOrHelper = auth.user?.roles?.some(role => 
        role === 'ADMIN' || 
        role === 'HELPER' || 
        role === 'ROLE_ADMIN' || 
        role === 'ROLE_HELPER'
      );
      
      let filteredData = data;
      if (!isAdminOrHelper) {
        filteredData = data.filter(chamado => 
          chamado.usuario?.id === parseInt(auth.user?.id)
        );
      }
      
      setChamados(filteredData);
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
      setError('Não foi possível carregar as solicitações. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...chamados];
    
    // Aplicar filtro de pesquisa
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(chamado => 
        (chamado.titulo && chamado.titulo.toLowerCase().includes(query)) ||
        (chamado.descricao && chamado.descricao.toLowerCase().includes(query)) ||
        (chamado.categoria && chamado.categoria.toLowerCase().includes(query)) ||
        (chamado.id && chamado.id.toString().includes(query))
      );
    }
    
    // Aplicar filtro de status
    if (statusFilter) {
      filtered = filtered.filter(chamado => chamado.status === statusFilter);
    }
    
    // Aplicar filtro de categoria
    if (categoriaFilter) {
      filtered = filtered.filter(chamado => chamado.categoria === categoriaFilter);
    }
    
    setFilteredChamados(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleCategoriaFilterChange = (e) => {
    setCategoriaFilter(e.target.value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setCategoriaFilter('');
  };

  const toggleShowFilters = () => {
    setShowFilters(!showFilters);
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
        
        {/* Filtros avançados */}
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
                    value={categoriaFilter}
                    label="Categoria"
                    onChange={handleCategoriaFilterChange}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {categorias.map((categoria) => (
                      <MenuItem key={categoria} value={categoria}>
                        {categoria}
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
                {filteredChamados.length > 0 ? (
                  filteredChamados.map((chamado) => (
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