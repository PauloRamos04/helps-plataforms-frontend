import React, { useContext, useEffect, useState } from 'react';
import {
  Box, Container, Typography, Grid, Paper, Card, CardContent,
  CircularProgress, Chip, Avatar, List, ListItem, ListItemText,
  Divider, Button, FormControl, InputLabel, Select, MenuItem,
  Alert
} from '@mui/material';
import {
  TrendingUp, TrendingDown, AccessTime, CheckCircle,
  Person, Category, Speed, Assignment, Star, Timeline,
  Work, Schedule
} from '@mui/icons-material';
import AuthContext from '../context/AuthContext';
import { ticketService } from '../services/ticketService';
import PageHeader from '../components/common/PageHeader';
import { formatDate, getRelativeTime } from '../utils/dateUtils';
import ErrorHandler from '../components/common/ErrorHandler';

function Metrics() {
  const { auth } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]); // Inicializar como array vazio
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');
  const [metrics, setMetrics] = useState({
    total: 0,
    byStatus: {},
    byCategory: {},
    averageResolutionTime: 0,
    totalResolved: 0,
    resolutionRate: 0,
    myTickets: 0,
    myResolved: 0,
    myCreated: 0,
    myInProgress: 0,
    myAverageTime: 0,
    teamMetrics: {}
  });

  const isHelper = auth.user?.roles?.includes('HELPER') || auth.user?.roles?.includes('ROLE_HELPER');
  const isAdmin = auth.user?.roles?.includes('ADMIN') || auth.user?.roles?.includes('ROLE_ADMIN');
  const isUser = !isHelper && !isAdmin;

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await ticketService.getTickets();
      
      // Garantir que seja sempre um array
      const ticketsArray = Array.isArray(data) ? data : [];
      console.log('Tickets carregados para métricas:', ticketsArray);
      
      setTickets(ticketsArray);
      calculateMetrics(ticketsArray);
    } catch (error) {
      console.error('Error loading metrics:', error);
      setError('Não foi possível carregar as métricas. Tente novamente.');
      setTickets([]); // Garantir que seja um array em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const filterByPeriod = (tickets) => {
    // Garantir que tickets seja um array
    if (!Array.isArray(tickets)) {
      console.warn('filterByPeriod: tickets não é um array:', tickets);
      return [];
    }

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
      const ticketDate = new Date(ticket.openingDate || ticket.dataCriacao);
      return ticketDate >= cutoffDate;
    });
  };

  const calculateMetrics = (allTickets) => {
    // Garantir que allTickets seja um array
    if (!Array.isArray(allTickets)) {
      console.warn('calculateMetrics: allTickets não é um array:', allTickets);
      setMetrics({
        total: 0,
        byStatus: {},
        byCategory: {},
        averageResolutionTime: 0,
        totalResolved: 0,
        resolutionRate: 0,
        myTickets: 0,
        myResolved: 0,
        myCreated: 0,
        myInProgress: 0,
        myAverageTime: 0,
        teamMetrics: {}
      });
      return;
    }

    const filteredTickets = filterByPeriod(allTickets);
    
    const byStatus = filteredTickets.reduce((acc, ticket) => {
      const status = ticket.status || 'ABERTO';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const byCategory = filteredTickets.reduce((acc, ticket) => {
      const category = ticket.category || ticket.categoria || 'GERAL';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const resolvedTickets = filteredTickets.filter(t => t.status === 'FECHADO');
    
    // Calcular tempo médio de resolução
    const resolutionTimes = resolvedTickets
      .filter(t => t.openingDate && t.closingDate)
      .map(t => {
        const start = new Date(t.openingDate || t.dataCriacao);
        const end = new Date(t.closingDate || t.dataFechamento);
        return (end - start) / (1000 * 60 * 60); // em horas
      });

    const averageResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;

    // Métricas específicas por papel
    let myTickets, myResolved, myCreated, myInProgress, myAverageTime;

    if (isUser) {
      // Para usuários normais: tickets que eles criaram
      myTickets = filteredTickets.filter(t => 
        t.user?.id === auth.user?.id || t.usuario?.id === auth.user?.id
      );
      myCreated = myTickets.length;
      myResolved = myTickets.filter(t => t.status === 'FECHADO').length;
      myInProgress = myTickets.filter(t => t.status === 'EM_ATENDIMENTO').length;
      myAverageTime = 0;
    } else if (isHelper) {
      // Para helpers: tickets que eles estão atendendo
      myTickets = filteredTickets.filter(t => t.helper?.id === auth.user?.id);
      myResolved = myTickets.filter(t => t.status === 'FECHADO').length;
      myInProgress = myTickets.filter(t => t.status === 'EM_ATENDIMENTO').length;
      myCreated = 0; // Helpers não criam tickets normalmente
      
      // Tempo médio de resolução do helper
      const helperResolutionTimes = myTickets
        .filter(t => t.status === 'FECHADO' && t.openingDate && t.closingDate)
        .map(t => {
          const start = new Date(t.openingDate);
          const end = new Date(t.closingDate);
          return (end - start) / (1000 * 60 * 60);
        });
      
      myAverageTime = helperResolutionTimes.length > 0
        ? helperResolutionTimes.reduce((a, b) => a + b, 0) / helperResolutionTimes.length
        : 0;
    } else {
      // Para admins: visão completa
      myTickets = filteredTickets;
      myResolved = resolvedTickets.length;
      myInProgress = filteredTickets.filter(t => t.status === 'EM_ATENDIMENTO').length;
      myCreated = filteredTickets.length;
      myAverageTime = averageResolutionTime;
    }

    setMetrics({
      total: filteredTickets.length,
      byStatus,
      byCategory,
      averageResolutionTime,
      totalResolved: resolvedTickets.length,
      resolutionRate: filteredTickets.length > 0 ? (resolvedTickets.length / filteredTickets.length) * 100 : 0,
      myTickets: Array.isArray(myTickets) ? myTickets.length : 0,
      myResolved,
      myCreated,
      myInProgress,
      myAverageTime
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ABERTO': return '#2196f3';
      case 'EM_ATENDIMENTO': return '#ff9800';
      case 'FECHADO': return '#4caf50';
      default: return '#757575';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'SUPORTE': return '#e3f2fd';
      case 'FINANCEIRO': return '#e8f5e9';
      case 'TÉCNICO': return '#fff8e1';
      default: return '#f5f5f5';
    }
  };

  const MetricCard = ({ title, value, icon, color, subtitle, trend }) => (
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
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', color: trend > 0 ? '#4caf50' : '#f44336' }}>
              {trend > 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
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

  // Top performers para admins e helpers - com verificação de array
  const topPerformers = Array.isArray(tickets) ? tickets
    .filter(t => t.helper && t.status === 'FECHADO')
    .reduce((acc, ticket) => {
      const helperId = ticket.helper.id;
      const helperName = ticket.helper.name || ticket.helper.username;
      if (!acc[helperId]) {
        acc[helperId] = { name: helperName, count: 0 };
      }
      acc[helperId].count++;
      return acc;
    }, {}) : {};

  const sortedPerformers = Object.values(topPerformers)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  const renderUserMetrics = () => (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">
              Aqui você pode acompanhar o status dos seus chamados abertos e histórico.
            </Typography>
          </Alert>
        </Grid>

        {/* Cards para usuário */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Chamados Criados"
            value={metrics.myCreated}
            icon={<Assignment />}
            color="#2196f3"
            subtitle="Por você neste período"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Em Atendimento"
            value={metrics.myInProgress}
            icon={<Schedule />}
            color="#ff9800"
            subtitle="Sendo resolvidos"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Resolvidos"
            value={metrics.myResolved}
            icon={<CheckCircle />}
            color="#4caf50"
            subtitle="Finalizados"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Taxa de Resolução"
            value={metrics.myCreated > 0 ? `${((metrics.myResolved / metrics.myCreated) * 100).toFixed(1)}%` : '0%'}
            icon={<Timeline />}
            color="#9c27b0"
            subtitle="Dos seus chamados"
          />
        </Grid>

        {/* Seus chamados por categoria */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Seus Chamados por Categoria
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(metrics.byCategory).length > 0 ? (
                  Object.entries(metrics.byCategory).map(([category, count]) => (
                    <Box key={category} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label={category}
                          size="small"
                          sx={{ bgcolor: getCategoryColor(category) }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {count} tickets
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Nenhum dado disponível para este período
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Status dos seus chamados */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status dos Seus Chamados
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(metrics.byStatus).length > 0 ? (
                  Object.entries(metrics.byStatus).map(([status, count]) => (
                    <Box key={status} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{status.replace('_', ' ')}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {count}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        width: '100%', 
                        height: 8, 
                        bgcolor: 'grey.200', 
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          width: metrics.myCreated > 0 ? `${(count / metrics.myCreated) * 100}%` : '0%',
                          height: '100%',
                          bgcolor: getStatusColor(status),
                          transition: 'width 0.3s ease'
                        }} />
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Nenhum dado disponível para este período
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );

  const renderHelperMetrics = () => (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">
              Acompanhe sua performance como Helper e veja suas estatísticas de atendimento.
            </Typography>
          </Alert>
        </Grid>

        {/* Cards para helper */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Tickets Atendidos"
            value={metrics.myTickets}
            icon={<Work />}
            color="#2196f3"
            subtitle="Total no período"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Resolvidos"
            value={metrics.myResolved}
            icon={<CheckCircle />}
            color="#4caf50"
            subtitle="Finalizados por você"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Em Atendimento"
            value={metrics.myInProgress}
            icon={<Schedule />}
            color="#ff9800"
            subtitle="Atualmente"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Tempo Médio"
            value={`${metrics.myAverageTime.toFixed(1)}h`}
            icon={<AccessTime />}
            color="#9c27b0"
            subtitle="Para resolução"
          />
        </Grid>

        {/* Performance vs. time */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sua Performance
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                      {metrics.myTickets > 0 ? ((metrics.myResolved / metrics.myTickets) * 100).toFixed(1) : 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Taxa de Resolução
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                      {metrics.myTickets}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Atendidos
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                      {metrics.myAverageTime.toFixed(1)}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tempo Médio
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Ranking */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ranking de Helpers
              </Typography>
              <List sx={{ pt: 0 }}>
                {sortedPerformers.length > 0 ? (
                  sortedPerformers.map((performer, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ px: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Avatar sx={{ 
                            bgcolor: performer.name === (auth.user?.name || auth.user?.username) ? '#4caf50' : 
                                    index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#4966f2',
                            mr: 2,
                            width: 32,
                            height: 32
                          }}>
                            {performer.name === (auth.user?.name || auth.user?.username) ? <Star /> : index + 1}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1" sx={{ 
                              fontWeight: performer.name === (auth.user?.name || auth.user?.username) ? 'bold' : 'medium' 
                            }}>
                              {performer.name} {performer.name === (auth.user?.name || auth.user?.username) && '(Você)'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {performer.count} resolvidos
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                      {index < sortedPerformers.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    Nenhum dado de performance disponível
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );

  const renderAdminMetrics = () => (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">
              Visão completa do sistema - métricas globais e performance da equipe.
            </Typography>
          </Alert>
        </Grid>

        {/* Cards principais para admin */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total de Chamados"
            value={metrics.total}
            icon={<Assignment />}
            color="#2196f3"
            subtitle={`${period === 'week' ? 'Esta semana' : period === 'month' ? 'Este mês' : period === 'quarter' ? 'Este trimestre' : 'Este ano'}`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Taxa de Resolução"
            value={`${metrics.resolutionRate.toFixed(1)}%`}
            icon={<CheckCircle />}
            color="#4caf50"
            subtitle={`${metrics.totalResolved} resolvidos`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Tempo Médio"
            value={`${metrics.averageResolutionTime.toFixed(1)}h`}
            icon={<AccessTime />}
            color="#ff9800"
            subtitle="Para resolução"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Em Atendimento"
            value={metrics.myInProgress}
            icon={<Schedule />}
            color="#9c27b0"
            subtitle="Atualmente"
          />
        </Grid>

        {/* Gráfico de Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chamados por Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(metrics.byStatus).length > 0 ? (
                  Object.entries(metrics.byStatus).map(([status, count]) => (
                    <Box key={status} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{status.replace('_', ' ')}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {count} ({((count / metrics.total) * 100).toFixed(1)}%)
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        width: '100%', 
                        height: 8, 
                        bgcolor: 'grey.200', 
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          width: `${(count / metrics.total) * 100}%`,
                          height: '100%',
                          bgcolor: getStatusColor(status),
                          transition: 'width 0.3s ease'
                        }} />
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Nenhum dado disponível
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de Categorias */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chamados por Categoria
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(metrics.byCategory).length > 0 ? (
                  Object.entries(metrics.byCategory).map(([category, count]) => (
                    <Box key={category} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label={category}
                          size="small"
                          sx={{ bgcolor: getCategoryColor(category) }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {count} tickets
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        width: '100%', 
                        height: 6, 
                        bgcolor: 'grey.200', 
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          width: `${(count / metrics.total) * 100}%`,
                          height: '100%',
                          bgcolor: '#4966f2',
                          transition: 'width 0.3s ease'
                        }} />
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Nenhum dado disponível
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Performers */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performers
              </Typography>
              <List sx={{ pt: 0 }}>
                {sortedPerformers.length > 0 ? (
                  sortedPerformers.map((performer, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ px: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Avatar sx={{ 
                            bgcolor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#4966f2',
                            mr: 2,
                            width: 32,
                            height: 32
                          }}>
                            {index + 1}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {performer.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {performer.count} chamados resolvidos
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                      {index < sortedPerformers.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    Nenhum dado de performance disponível
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Resumo do período */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumo Executivo
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" sx={{ color: '#4966f2', fontWeight: 'bold' }}>
                      {metrics.byStatus.ABERTO || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aguardando
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                      {metrics.byStatus.EM_ATENDIMENTO || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Em Progresso
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">
                  Eficiência geral:
                </Typography>
                <Chip 
                  label={`${metrics.resolutionRate.toFixed(1)}%`}
                  color={metrics.resolutionRate >= 80 ? 'success' : metrics.resolutionRate >= 60 ? 'warning' : 'error'}
                 sx={{ fontWeight: 'bold' }}
               />
             </Box>
           </CardContent>
         </Card>
       </Grid>
     </Grid>
   </>
 );

 return (
   <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
       <PageHeader title={`Métricas ${isUser ? 'Pessoais' : isHelper ? 'de Performance' : 'do Sistema'}`} />
       
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
     </Box>

     {error && <ErrorHandler message={error} onRetry={fetchData} />}

     {/* Renderizar métricas baseadas no papel do usuário */}
     {isUser && renderUserMetrics()}
     {isHelper && renderHelperMetrics()}
     {isAdmin && renderAdminMetrics()}
   </Container>
 );
}

export default Metrics;