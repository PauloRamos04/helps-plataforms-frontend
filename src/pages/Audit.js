import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Card, CardContent, CircularProgress, Alert, TextField,
  InputAdornment, Chip, Avatar, List, ListItem, ListItemText,
  Divider, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Launch as LaunchIcon,
  TrendingUp, TrendingDown, AccessTime, CheckCircle,
  Assignment, Timeline, Work, Schedule
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { ticketService } from '../services/ticketService';
import PageHeader from '../components/common/PageHeader';
import ErrorHandler from '../components/common/ErrorHandler';
import StatusBadge from '../components/tickets/StatusBadge';
import { formatDate, formatDateTime } from '../utils/dateUtils';

function Audit() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userMetrics, setUserMetrics] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersData, ticketsData] = await Promise.all([
        userService.getAllUsers(),
        ticketService.getTickets()
      ]);
      
      setUsers(Array.isArray(usersData) ? usersData : (usersData?.data || []));
      setTickets(Array.isArray(ticketsData) ? ticketsData : (ticketsData?.data || []));
    } catch (error) {
      console.error('Error loading audit data:', error);
      setError('Não foi possível carregar os dados de auditoria.');
    } finally {
      setLoading(false);
    }
  };

  const filterByPeriod = (tickets) => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (period) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return tickets;
    }

    return tickets.filter(ticket => {
      const ticketDate = new Date(ticket.openingDate || ticket.dataAbertura);
      return ticketDate >= cutoffDate;
    });
  };

  const calculateUserMetrics = (userId) => {
    const filteredTickets = filterByPeriod(tickets);
    
    const userCreatedTickets = filteredTickets.filter(t => 
      (t.user?.id || t.usuario?.id) === userId
    );
    
    const userHelperTickets = filteredTickets.filter(t => 
      t.helper?.id === userId
    );
    
    const allUserTickets = [...userCreatedTickets, ...userHelperTickets]
      .filter((ticket, index, self) => 
        index === self.findIndex(t => t.id === ticket.id)
      )
      .sort((a, b) => new Date(b.openingDate || b.dataAbertura) - new Date(a.openingDate || a.dataAbertura));
    
    const resolvedByUser = userHelperTickets.filter(t => t.status === 'FECHADO');
    const inProgressByUser = userHelperTickets.filter(t => t.status === 'EM_ATENDIMENTO');
    
    const resolutionTimes = resolvedByUser
      .filter(t => t.openingDate && t.closingDate)
      .map(t => {
        const start = new Date(t.openingDate);
        const end = new Date(t.closingDate);
        return (end - start) / (1000 * 60 * 60);
      });

    const averageResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;

    const userResolutionRate = userHelperTickets.length > 0 
      ? (resolvedByUser.length / userHelperTickets.length) * 100 
      : 0;

    return {
      createdTickets: userCreatedTickets.length,
      handledTickets: userHelperTickets.length,
      resolvedTickets: resolvedByUser.length,
      inProgressTickets: inProgressByUser.length,
      averageResolutionTime,
      resolutionRate: userResolutionRate,
      recentTickets: allUserTickets.slice(0, 10),
      allTickets: allUserTickets
    };
  };

  const handleViewUserMetrics = (user) => {
    setSelectedUser(user);
    setUserMetrics(calculateUserMetrics(user.id));
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setUserMetrics(null);
  };

  const handleTicketClick = (ticketId) => {
    navigate(`/tickets/${ticketId}`);
  };

  const getRoleColor = (role) => {
    if (role.includes('ADMIN')) {
      return { bg: '#d32f2f', color: 'white' };
    } else if (role.includes('HELPER')) {
      return { bg: '#388e3c', color: 'white' };
    } else if (role.includes('OPERADOR')) {
      return { bg: '#1976d2', color: 'white' };
    } else {
      return { bg: '#757575', color: 'white' };
    }
  };

  const getOverallUserMetrics = (userId) => {
    const metrics = calculateUserMetrics(userId);
    return {
      totalActivity: metrics.createdTickets + metrics.handledTickets,
      performance: metrics.resolutionRate
    };
  };

  const calculateTicketDuration = (ticket) => {
    if (ticket.status === 'FECHADO' && ticket.openingDate && ticket.closingDate) {
      const start = new Date(ticket.openingDate);
      const end = new Date(ticket.closingDate);
      const hours = (end - start) / (1000 * 60 * 60);
      
      if (hours < 24) {
        return `${hours.toFixed(1)}h`;
      } else {
        const days = Math.floor(hours / 24);
        const remainingHours = Math.floor(hours % 24);
        return `${days}d ${remainingHours}h`;
      }
    }
    
    if (ticket.status === 'EM_ATENDIMENTO' && ticket.openingDate) {
      const start = new Date(ticket.openingDate);
      const now = new Date();
      const hours = (now - start) / (1000 * 60 * 60);
      
      if (hours < 24) {
        return `${hours.toFixed(1)}h (em andamento)`;
      } else {
        const days = Math.floor(hours / 24);
        const remainingHours = Math.floor(hours % 24);
        return `${days}d ${remainingHours}h (em andamento)`;
      }
    }
    
    return '-';
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const MetricCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: '8px', 
            bgcolor: `${color}20`,
            color: color,
            display: 'flex',
            alignItems: 'center'
          }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 0.5 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ borderRadius: '8px', p: 3 }}>
        <PageHeader 
          title="Auditoria de Performance"
          backUrl="/dashboard"
        />

        {error && <ErrorHandler message={error} onRetry={fetchData} />}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Buscar usuário..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: '300px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Período</InputLabel>
              <Select
                value={period}
                label="Período"
                onChange={(e) => setPeriod(e.target.value)}
              >
                <MenuItem value="week">Última Semana</MenuItem>
                <MenuItem value="month">Último Mês</MenuItem>
                <MenuItem value="quarter">Último Trimestre</MenuItem>
                <MenuItem value="year">Último Ano</MenuItem>
              </Select>
            </FormControl>
            
            <Tooltip title="Atualizar dados">
              <IconButton onClick={fetchData} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Usuário</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Perfil</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Atividade Total</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Performance</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => {
                  const metrics = getOverallUserMetrics(user.id);
                  return (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ 
                            bgcolor: '#4966f2', 
                            mr: 2, 
                            width: 32, 
                            height: 32 
                          }}>
                            {(user.name || user.username).charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {user.name || user.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{user.username}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {user.roles && user.roles.map(role => {
                          const { bg, color } = getRoleColor(role);
                          return (
                            <Chip 
                              key={role}
                              label={role} 
                              size="small" 
                              sx={{ 
                                bgcolor: bg, 
                                color: color,
                                mr: 0.5
                              }} 
                            />
                          );
                        })}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {metrics.totalActivity} tickets
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {metrics.performance.toFixed(1)}%
                          </Typography>
                          {metrics.performance >= 80 && <TrendingUp sx={{ ml: 1, color: '#4caf50', fontSize: 16 }} />}
                          {metrics.performance < 50 && <TrendingDown sx={{ ml: 1, color: '#f44336', fontSize: 16 }} />}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.enabled ? 'Ativo' : 'Inativo'} 
                          size="small" 
                          sx={{ 
                            bgcolor: user.enabled ? '#e8f5e9' : '#ffebee', 
                            color: user.enabled ? '#2e7d32' : '#c62828',
                          }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Ver métricas detalhadas">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewUserMetrics(user)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Métricas de Performance - {selectedUser?.name || selectedUser?.username}
          </DialogTitle>
          <DialogContent>
            {userMetrics && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Chamados Criados"
                      value={userMetrics.createdTickets}
                      icon={<Assignment />}
                      color="#2196f3"
                      subtitle="Por este usuário"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Tickets Atendidos"
                      value={userMetrics.handledTickets}
                      icon={<Work />}
                      color="#ff9800"
                      subtitle="Como Helper"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Resolvidos"
                      value={userMetrics.resolvedTickets}
                      icon={<CheckCircle />}
                      color="#4caf50"
                      subtitle="Finalizados"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Tempo Médio"
                      value={`${userMetrics.averageResolutionTime.toFixed(1)}h`}
                      icon={<AccessTime />}
                      color="#9c27b0"
                      subtitle="Para resolução"
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Resumo de Performance
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="body2">Taxa de Resolução:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {userMetrics.resolutionRate.toFixed(1)}%
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="body2">Em Atendimento:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {userMetrics.inProgressTickets}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="body2">Período:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {period === 'week' ? 'Última Semana' : 
                               period === 'month' ? 'Último Mês' : 
                               period === 'quarter' ? 'Último Trimestre' : 'Último Ano'}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Todos os Atendimentos
                        </Typography>
                        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                          {userMetrics.allTickets.length > 0 ? (
                            <List sx={{ pt: 0 }}>
                              {userMetrics.allTickets.map((ticket) => (
                                <React.Fragment key={ticket.id}>
                                  <ListItem sx={{ px: 0, py: 1, cursor: 'pointer' }} onClick={() => handleTicketClick(ticket.id)}>
                                    <ListItemText
                                      primary={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                              #{ticket.id} - {ticket.title || ticket.titulo}
                                            </Typography>
                                            <IconButton size="small" sx={{ ml: 1 }}>
                                              <LaunchIcon fontSize="small" />
                                            </IconButton>
                                          </Box>
                                          <StatusBadge status={ticket.status} />
                                        </Box>
                                      }
                                      secondary={
                                        <Box sx={{ mt: 1 }}>
                                          <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                <strong>Aberto:</strong> {formatDateTime(ticket.openingDate || ticket.dataAbertura)}
                                              </Typography>
                                              {ticket.startDate && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                  <strong>Iniciado:</strong> {formatDateTime(ticket.startDate)}
                                                </Typography>
                                              )}
                                              {ticket.closingDate && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                  <strong>Finalizado:</strong> {formatDateTime(ticket.closingDate)}
                                                </Typography>
                                              )}
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                <strong>Duração:</strong> {calculateTicketDuration(ticket)}
                                              </Typography>
                                              <Typography variant="caption" sx={{ 
                                                display: 'inline-block',
                                                mt: 0.5,
                                                px: 1,
                                                py: 0.25,
                                                bgcolor: '#f5f5f5',
                                                borderRadius: '4px'
                                              }}>
                                                {ticket.category || ticket.categoria || 'GERAL'}
                                              </Typography>
                                            </Grid>
                                          </Grid>
                                          <Box sx={{ mt: 1 }}>
                                            {ticket.helper?.id === selectedUser.id && (
                                              <Chip 
                                                label="Helper" 
                                                size="small" 
                                                sx={{ 
                                                  mr: 1, 
                                                  bgcolor: '#e8f5e9', 
                                                  color: '#2e7d32',
                                                  height: '20px',
                                                  fontSize: '0.7rem'
                                                }} 
                                              />
                                            )}
                                            {(ticket.user?.id || ticket.usuario?.id) === selectedUser.id && (
                                              <Chip 
                                                label="Criador" 
                                                size="small" 
                                                sx={{ 
                                                  mr: 1, 
                                                  bgcolor: '#e3f2fd', 
                                                  color: '#1976d2',
                                                  height: '20px',
                                                  fontSize: '0.7rem'
                                                }} 
                                              />
                                            )}
                                          </Box>
                                        </Box>
                                      }
                                    />
                                  </ListItem>
                                  <Divider />
                                </React.Fragment>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                              Nenhum atendimento encontrado para este período
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} variant="outlined">
              Fechar
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}

export default Audit;