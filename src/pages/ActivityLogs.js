import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
  TextField, InputAdornment, Grid, Card, CardContent, Button,
  CircularProgress, Alert, Pagination, Select, MenuItem, FormControl,
  InputLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  ExitToApp as ExitToAppIcon,
  Lock as LockIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import activityLogService from '../services/activityLogService';
import PageHeader from '../components/common/PageHeader';
import ErrorHandler from '../components/common/ErrorHandler';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`tabpanel-${index}`}
    {...other}
    style={{ padding: '16px 0' }}
  >
    {value === index && <Box>{children}</Box>}
  </div>
);

function ActivityLogs() {
  const [tabValue, setTabValue] = useState(0);
  const [activityLogs, setActivityLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchData();
  }, [tabValue, page, activityFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      switch (tabValue) {
        case 0:
          await fetchActivityLogs();
          break;
        case 1:
          await fetchSessions();
          break;
        case 2:
          await fetchActiveSessions();
          break;
        case 3:
          await fetchStats();
          break;
      }
    } catch (error) {
      setError('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    const data = await activityLogService.getActivityLogs(page, size);
    setActivityLogs(data.content || []);
    setTotalPages(data.totalPages || 0);
  };

  const fetchSessions = async () => {
    const data = await activityLogService.getUserSessions(page, size);
    setSessions(data.content || []);
    setTotalPages(data.totalPages || 0);
  };

  const fetchActiveSessions = async () => {
    const data = await activityLogService.getActiveSessions();
    setActiveSessions(data || []);
  };

  const fetchStats = async () => {
    const data = await activityLogService.getActivityStats();
    setStats(data);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage - 1);
  };

  const getActivityIcon = (activity) => {
    const normalizedActivity = activity?.toUpperCase() || '';
    
    if (normalizedActivity.includes('LOGIN')) {
      if (normalizedActivity.includes('FAILED') || normalizedActivity.includes('FALHOU')) {
        return <LockIcon fontSize="small" sx={{ color: '#ff9800' }} />;
      }
      return <PersonIcon fontSize="small" sx={{ color: '#4caf50' }} />;
    }
    
    if (normalizedActivity.includes('LOGOUT')) {
      return <ExitToAppIcon fontSize="small" sx={{ color: '#f44336' }} />;
    }
    
    if (normalizedActivity.includes('SESSION') || normalizedActivity.includes('SESSAO')) {
      return <AccessTimeIcon fontSize="small" sx={{ color: '#9e9e9e' }} />;
    }
    
    if (normalizedActivity.includes('TICKET') || normalizedActivity.includes('CHAMADO')) {
      return <AssignmentIcon fontSize="small" sx={{ color: '#2196f3' }} />;
    }
    
    if (normalizedActivity.includes('USER') || normalizedActivity.includes('USUARIO')) {
      return <GroupIcon fontSize="small" sx={{ color: '#9c27b0' }} />;
    }
    
    return <ComputerIcon fontSize="small" sx={{ color: '#757575' }} />;
  };

  const getActivityColor = (activity) => {
    const normalizedActivity = activity?.toUpperCase() || '';
    
    if (normalizedActivity.includes('LOGIN')) {
      if (normalizedActivity.includes('FAILED') || normalizedActivity.includes('FALHOU')) {
        return '#ff9800';
      }
      return '#4caf50';
    }
    
    if (normalizedActivity.includes('LOGOUT')) {
      return '#f44336';
    }
    
    if (normalizedActivity.includes('SESSION') || normalizedActivity.includes('SESSAO')) {
      return '#9e9e9e';
    }
    
    if (normalizedActivity.includes('TICKET') || normalizedActivity.includes('CHAMADO')) {
      return '#2196f3';
    }
    
    if (normalizedActivity.includes('USER') || normalizedActivity.includes('USUARIO')) {
      return '#9c27b0';
    }
    
    return '#757575';
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes < 1) return 'Menos de 1 min';
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    const formatted = date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
    
    if (diffMinutes < 60) {
      return `${formatted} (${diffMinutes}min atrás)`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${formatted} (${hours}h atrás)`;
    }
    
    return formatted;
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `${diffMinutes}min atrás`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`;
    return `${Math.floor(diffMinutes / 1440)}d atrás`;
  };

  const getSessionStatusChip = (session) => {
    if (session.isActive) {
      return (
        <Chip
          label="Ativa"
          size="small"
          sx={{ 
            bgcolor: '#e8f5e9', 
            color: '#2e7d32',
            fontWeight: 'medium'
          }}
        />
      );
    } else {
      return (
        <Chip
          label="Finalizada"
          size="small"
          sx={{ 
            bgcolor: '#f5f5f5', 
            color: '#616161',
            fontWeight: 'medium'
          }}
        />
      );
    }
  };

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.userDisplayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.activity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.additionalInfo && log.additionalInfo.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = activityFilter === '' || log.activity === activityFilter;
    
    return matchesSearch && matchesFilter;
  });

  const uniqueActivities = [...new Set(activityLogs.map(log => log.activity))].sort();

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ borderRadius: '8px', p: 3 }}>
        <PageHeader 
          title="Logs de Atividade do Sistema"
          backUrl="/dashboard"
        />

        {error && <ErrorHandler message={error} onRetry={fetchData} />}

        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Atividades" />
              <Tab label="Histórico de Sessões" />
              <Tab label="Sessões Ativas" />
              <Tab label="Estatísticas" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                placeholder="Buscar por usuário, ação ou descrição..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ minWidth: '300px', flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <FormControl size="small" sx={{ minWidth: '200px' }}>
                <InputLabel>Filtrar por Ação</InputLabel>
                <Select
                  value={activityFilter}
                  label="Filtrar por Ação"
                  onChange={(e) => setActivityFilter(e.target.value)}
                >
                  <MenuItem value="">Todas as ações</MenuItem>
                  {uniqueActivities.map(activity => (
                    <MenuItem key={activity} value={activity}>
                      {activity}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <IconButton onClick={fetchData} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Ação</TableCell>
                        <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Usuário</TableCell>
                        <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>IP</TableCell>
                        <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Data/Hora</TableCell>
                        <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Descrição</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getActivityIcon(log.activity)}
                              <Chip
                                label={log.activity}
                                size="small"
                                sx={{
                                  ml: 1,
                                  bgcolor: getActivityColor(log.activity) + '20',
                                  color: getActivityColor(log.activity),
                                  fontWeight: 'medium'
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {log.userDisplayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{log.username}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {log.ipAddress || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={formatDateTime(log.createdAt)}>
                              <Typography variant="body2">
                                {formatRelativeTime(log.createdAt)}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: '300px' }}>
                              {log.additionalInfo || 'Nenhuma descrição adicional'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page + 1}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              </>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Usuário</TableCell>
                        <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Login</TableCell>
                        <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Logout</TableCell>
                        <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Duração</TableCell>
                        <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>IP</TableCell>
                        <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {session.userDisplayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{session.username}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDateTime(session.loginTime)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {session.logoutTime ? formatDateTime(session.logoutTime) : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDuration(session.durationMinutes)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {session.ipAddress || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getSessionStatusChip(session)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page + 1}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              </>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Usuário</TableCell>
                      <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Login</TableCell>
                      <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Última Atividade</TableCell>
                      <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Tempo Online</TableCell>
                      <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>IP</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeSessions.map((session) => (
                      <TableRow key={session.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {session.userDisplayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{session.username}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDateTime(session.loginTime)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatRelativeTime(session.lastActivity)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDuration(session.durationMinutes)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {session.ipAddress || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : stats ? (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <PersonIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                        {stats.activeSessions}
                      </Typography>
                      <Typography color="textSecondary">
                        Sessões Ativas
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <TrendingUpIcon sx={{ fontSize: 40, color: '#2196f3' }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                        {stats.totalSessions}
                      </Typography>
                      <Typography color="textSecondary">
                        Total de Sessões
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <ScheduleIcon sx={{ fontSize: 40, color: '#ff9800' }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                        {stats.totalLogins24h}
                      </Typography>
                      <Typography color="textSecondary">
                        Logins (24h)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <GroupIcon sx={{ fontSize: 40, color: '#9c27b0' }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                        {stats.activeUsers || 0}
                      </Typography>
                      <Typography color="textSecondary">
                        Usuários Únicos (24h)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Atividades por Tipo
                      </Typography>
                      <Grid container spacing={2}>
                        {Object.entries(stats.activitiesByType || {}).map(([type, count]) => (
                          <Grid item xs={12} sm={6} md={4} key={type}>
                            <Box sx={{ 
                              p: 2, 
                              border: '1px solid #e0e0e0', 
                              borderRadius: '4px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getActivityIcon(type)}
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  {type}
                                </Typography>
                              </Box>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {count}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Alert severity="info">Nenhuma estatística disponível</Alert>
            )}
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}

export default ActivityLogs;