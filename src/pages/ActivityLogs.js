import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
  TextField, InputAdornment, Grid, Card, CardContent, Button,
  CircularProgress, Alert, Pagination
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchData();
  }, [tabValue, page]);

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
    switch (activity) {
      case 'LOGIN':
        return <PersonIcon fontSize="small" color="success" />;
      case 'LOGOUT':
        return <PersonIcon fontSize="small" color="error" />;
      case 'LOGIN_FAILED':
        return <PersonIcon fontSize="small" color="warning" />;
      default:
        return <ComputerIcon fontSize="small" color="action" />;
    }
  };

  const getActivityColor = (activity) => {
    switch (activity) {
      case 'LOGIN':
        return '#4caf50';
      case 'LOGOUT':
        return '#f44336';
      case 'LOGIN_FAILED':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '-';
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ borderRadius: '8px', p: 3 }}>
        <PageHeader 
          title="Logs de Atividade"
          backUrl="/dashboard"
        />

        {error && <ErrorHandler message={error} onRetry={fetchData} />}

        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Atividades" />
              <Tab label="Sessões" />
              <Tab label="Sessões Ativas" />
              <Tab label="Estatísticas" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <TextField
                placeholder="Buscar atividades..."
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
                        <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Atividade</TableCell>
                        <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Usuário</TableCell>
                        <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>IP</TableCell>
                        <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Data/Hora</TableCell>
                        <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Detalhes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activityLogs.map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getActivityIcon(log.activity)}
                              <Chip
                                label={log.activity}
                                size="small"
                                sx={{
                                  ml: 1,
                                  bgcolor: getActivityColor(log.activity),
                                  color: 'white'
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>{log.userDisplayName}</TableCell>
                          <TableCell>{log.ipAddress || '-'}</TableCell>
                          <TableCell>
                            <Tooltip title={formatDateTime(log.createdAt)}>
                              <span>{formatRelativeTime(log.createdAt)}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{log.additionalInfo || '-'}</TableCell>
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
                          <TableCell>{session.userDisplayName}</TableCell>
                          <TableCell>{formatDateTime(session.loginTime)}</TableCell>
                          <TableCell>{formatDateTime(session.logoutTime)}</TableCell>
                          <TableCell>{formatDuration(session.durationMinutes)}</TableCell>
                          <TableCell>{session.ipAddress || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={session.isActive ? 'Ativa' : 'Finalizada'}
                              size="small"
                              color={session.isActive ? 'success' : 'default'}
                            />
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
                        <TableCell>{session.userDisplayName}</TableCell>
                        <TableCell>{formatDateTime(session.loginTime)}</TableCell>
                        <TableCell>{formatRelativeTime(session.lastActivity)}</TableCell>
                        <TableCell>{formatDuration(session.durationMinutes)}</TableCell>
                        <TableCell>{session.ipAddress || '-'}</TableCell>
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
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Sessões Ativas
                      </Typography>
                      <Typography variant="h4">
                        {stats.activeSessions}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Sessões
                      </Typography>
                      <Typography variant="h4">
                        {stats.totalSessions}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Logins (24h)
                      </Typography>
                      <Typography variant="h4">
                        {stats.totalLogins24h}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Usuários Únicos (24h)
                      </Typography>
                      <Typography variant="h4">
                        {stats.uniqueUsers24h || 0}
                      </Typography>
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