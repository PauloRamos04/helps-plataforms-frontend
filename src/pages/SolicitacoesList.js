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
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Available categories list
  const categorias = ['SUPORTE', 'FINANCEIRO', 'TÉCNICO'];
  
  // Check user roles
  const isAdmin = auth?.user?.roles?.some(role => 
    role === 'ADMIN' || role === 'ROLE_ADMIN'
  );
  
  const isHelper = auth?.user?.roles?.some(role => 
    role === 'HELPER' || role === 'ROLE_HELPER'
  );

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
      
      console.log('Received tickets data:', data);
      
      // Filter tickets to show only those created by the current user
      // unless user is an ADMIN or HELPER
      const isAdminOrHelper = isAdmin || isHelper;
      
      let filteredData = data;
      if (!isAdminOrHelper) {
        // Check both usuario.id and user.id to handle both backend naming conventions
        filteredData = data.filter(chamado => {
          const userId = parseInt(auth.user?.id);
          const chamadoUserId = chamado.usuario?.id || chamado.user?.id;
          return chamadoUserId === userId;
        });
      }
      
      setChamados(filteredData);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setError('Could not load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...chamados];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(chamado => 
        (chamado.titulo && chamado.titulo.toLowerCase().includes(query)) ||
        (chamado.title && chamado.title.toLowerCase().includes(query)) ||
        (chamado.descricao && chamado.descricao.toLowerCase().includes(query)) ||
        (chamado.description && chamado.description.toLowerCase().includes(query)) ||
        ((chamado.categoria || chamado.category) && 
         (chamado.categoria || chamado.category).toLowerCase().includes(query)) ||
        (chamado.id && chamado.id.toString().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      // Handle both legacy and new status names
      if (statusFilter === 'ABERTO') {
        filtered = filtered.filter(chamado => 
          chamado.status === 'ABERTO' || chamado.status === 'OPEN'
        );
      } else if (statusFilter === 'EM_ATENDIMENTO') {
        filtered = filtered.filter(chamado => 
          chamado.status === 'EM_ATENDIMENTO' || chamado.status === 'IN_PROGRESS'
        );
      } else if (statusFilter === 'FECHADO') {
        filtered = filtered.filter(chamado => 
          chamado.status === 'FECHADO' || chamado.status === 'CLOSED'
        );
      } else {
        filtered = filtered.filter(chamado => chamado.status === statusFilter);
      }
    }
    
    // Apply category filter
    if (categoriaFilter) {
      filtered = filtered.filter(chamado => 
        chamado.categoria === categoriaFilter || chamado.category === categoriaFilter
      );
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
    // Handle both legacy and new status names
    if (status === 'ABERTO' || status === 'OPEN') {
      return { bg: '#e3f2fd', color: '#0d47a1' };
    } else if (status === 'EM_ATENDIMENTO' || status === 'IN_PROGRESS') {
      return { bg: '#fff8e1', color: '#ff6f00' };
    } else if (status === 'FECHADO' || status === 'CLOSED') {
      return { bg: '#e8f5e9', color: '#2e7d32' };
    } else {
      return { bg: '#f5f5f5', color: '#616161' };
    }
  };

  const getStatusLabel = (status) => {
    // Handle both legacy and new status names
    if (status === 'ABERTO' || status === 'OPEN') {
      return 'OPEN';
    } else if (status === 'EM_ATENDIMENTO' || status === 'IN_PROGRESS') {
      return 'IN PROGRESS';
    } else if (status === 'FECHADO' || status === 'CLOSED') {
      return 'CLOSED';
    }
    return status?.replace('_', ' ') || 'UNKNOWN';
  };

  const handleRowClick = (id) => {
    navigate(`/chamados/${id}`);
  };

  const renderStatus = (status) => {
    const { bg, color } = getStatusColor(status);
    
    return (
      <Chip 
        label={getStatusLabel(status)}
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
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            
            <Tooltip title="Refresh">
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
              New Ticket
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
                  placeholder="Search by title, description, ID..."
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
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="ABERTO">OPEN</MenuItem>
                    <MenuItem value="EM_ATENDIMENTO">IN PROGRESS</MenuItem>
                    <MenuItem value="FECHADO">CLOSED</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="categoria-filter-label">Category</InputLabel>
                  <Select
                    labelId="categoria-filter-label"
                    value={categoriaFilter}
                    label="Category"
                    onChange={handleCategoriaFilterChange}
                  >
                    <MenuItem value="">All</MenuItem>
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
                  Clear Filters
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
                  <TableCell sx={{ fontWeight: 'medium', color: '#666', fontSize: '14px' }}>CATEGORY</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#666', fontSize: '14px' }}>TITLE</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#666', fontSize: '14px' }}>DATE</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#666', fontSize: '14px' }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#666', fontSize: '14px' }}>ACTIONS</TableCell>
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
                      <TableCell sx={{ fontSize: '14px' }}>
                        {chamado.categoria || chamado.category || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px' }}>
                        {chamado.titulo || chamado.title}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px' }}>
                        {formatDate(
                          chamado.dataAbertura || 
                          chamado.openingDate || 
                          chamado.dataCriacao
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px' }}>
                        {renderStatus(chamado.status || 'OPEN')}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View details">
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
                        No tickets found
                      </Typography>
                      <Button 
                        variant="text" 
                        sx={{ mt: 1, color: '#4966f2' }}
                        onClick={() => navigate('/novo-chamado')}
                      >
                        Create new ticket
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