import { 
  Box, Container, Typography, Grid, Paper, Card, CardContent, 
  CircularProgress, List, ListItem, ListItemText,
  Divider, Button
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import ErrorHandler from '../components/common/ErrorHandler';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/tickets/StatusBadge';
import AuthContext from '../context/AuthContext';
import { ticketService } from '../services/ticketService';
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

function Dashboard() {
  const { auth } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0
  });

  const isHelper = auth.user?.roles?.includes('HELPER') || 
                   auth.user?.roles?.includes('ROLE_HELPER');
  const isAdmin = auth.user?.roles?.includes('ADMIN') || 
                  auth.user?.roles?.includes('ROLE_ADMIN');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ticketService.getChamados();
      
      const ticketsData = Array.isArray(data) ? data : (data?.data || []);
      
      // Ordenar tickets de forma inteligente
      const sortedTickets = ticketsData.sort((a, b) => {
        // Prioridade por status: EM_ATENDIMENTO > ABERTO > FECHADO
        const statusPriority = {
          'EM_ATENDIMENTO': 3,
          'IN_PROGRESS': 3,
          'ABERTO': 2,
          'OPEN': 2,
          'FECHADO': 1,
          'CLOSED': 1
        };
        
        const aPriority = statusPriority[a.status] || 0;
        const bPriority = statusPriority[b.status] || 0;
        
        // Se os status são diferentes, ordenar por prioridade
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        // Se os status são iguais, ordenar por data de abertura (mais recente primeiro)
        const aDate = new Date(a.openingDate || 0);
        const bDate = new Date(b.openingDate || 0);
        
        // Verificar se as datas são válidas
        if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0;
        if (isNaN(aDate.getTime())) return 1;
        if (isNaN(bDate.getTime())) return -1;
        
        return bDate - aDate;
      });
      
      setTickets(sortedTickets);
      
      const stats = {
        total: sortedTickets.length,
        open: sortedTickets.filter(t => t.status === 'ABERTO').length,
        inProgress: sortedTickets.filter(t => t.status === 'EM_ATENDIMENTO').length,
        closed: sortedTickets.filter(t => t.status === 'FECHADO').length
      };
      setStats(stats);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setError('Não foi possível carregar os chamados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const getTicketData = (ticket) => ({
    id: ticket.id,
    title: ticket.title || ticket.titulo,
    status: ticket.status,
    openingDate: ticket.openingDate
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader 
        title="Dashboard"
        actionButton={
          <Button
            component={RouterLink}
            to="/tickets/new"
            variant="contained"
            sx={{
              bgcolor: '#4966f2',
              borderRadius: '4px',
              textTransform: 'none',
              fontWeight: 'medium'
            }}
          >
            Novo Chamado
          </Button>
        }
      />
      
      {error && <ErrorHandler message={error} onRetry={fetchTickets} />}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Cards de Estatísticas */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                bgcolor: '#e3f2fd', 
                border: '1px solid #bbdefb',
                '&:hover': { boxShadow: 3 }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h3" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 1 }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1976d2', fontWeight: 'medium' }}>
                    Total de Chamados
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                bgcolor: '#fff3e0', 
                border: '1px solid #ffcc02',
                '&:hover': { boxShadow: 3 }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h3" sx={{ color: '#f57c00', fontWeight: 'bold', mb: 1 }}>
                    {stats.open}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#f57c00', fontWeight: 'medium' }}>
                    Chamados Abertos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                bgcolor: '#e8f5e8', 
                border: '1px solid #a5d6a7',
                '&:hover': { boxShadow: 3 }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h3" sx={{ color: '#388e3c', fontWeight: 'bold', mb: 1 }}>
                    {stats.inProgress}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#388e3c', fontWeight: 'medium' }}>
                    Em Atendimento
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                bgcolor: '#f3e5f5', 
                border: '1px solid #ce93d8',
                '&:hover': { boxShadow: 3 }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h3" sx={{ color: '#7b1fa2', fontWeight: 'bold', mb: 1 }}>
                    {stats.closed}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#7b1fa2', fontWeight: 'medium' }}>
                    Finalizados
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Cards de Conteúdo */}
          <Grid container spacing={3}>
            {/* Últimos Chamados */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ height: '100%', '&:hover': { boxShadow: 3 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                      Últimos Chamados
                    </Typography>
                    <Button
                      component={RouterLink}
                      to="/tickets"
                      variant="text"
                      size="small"
                      sx={{ color: '#4966f2', textTransform: 'none' }}
                    >
                      Ver todos
                    </Button>
                  </Box>
                  
                  {tickets.length > 0 ? (
                    <List sx={{ p: 0 }}>
                      {tickets.slice(0, 5).map((ticket) => {
                        const ticketData = getTicketData(ticket);
                        const isHighPriority = ticketData.status === 'EM_ATENDIMENTO';
                        const isOpen = ticketData.status === 'ABERTO';
                        
                        return (
                          <React.Fragment key={ticketData.id}>
                            <ListItem 
                              button 
                              component={RouterLink} 
                              to={`/tickets/${ticketData.id}`}
                              sx={{ 
                                py: 1.5,
                                bgcolor: isHighPriority ? '#fff8e1' : 'inherit',
                                borderLeft: isHighPriority ? '4px solid #ff9800' : '4px solid transparent',
                                borderRadius: '4px',
                                mb: 0.5,
                                '&:hover': {
                                  bgcolor: isHighPriority ? '#fff3e0' : 'rgba(0, 0, 0, 0.04)',
                                  transform: 'translateX(4px)',
                                  transition: 'all 0.2s ease'
                                }
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {isHighPriority && (
                                      <Box 
                                        sx={{ 
                                          width: 6, 
                                          height: 6, 
                                          borderRadius: '50%', 
                                          bgcolor: '#ff9800',
                                          animation: 'pulse 2s infinite'
                                        }} 
                                      />
                                    )}
                                    <Typography 
                                      variant="body1" 
                                      sx={{ 
                                        fontWeight: isHighPriority ? 'bold' : 'normal',
                                        color: isHighPriority ? '#e65100' : 'inherit'
                                      }}
                                    >
                                      {ticketData.title}
                                    </Typography>
                                  </Box>
                                }
                                secondary={
                                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                                    <Typography component="span" variant="body2" color="text.primary">
                                      <StatusBadge status={ticketData.status} />
                                    </Typography>
                                    <Typography component="span" variant="caption" color="text.secondary">
                                      {formatDate(ticketData.openingDate)}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                            <Divider />
                          </React.Fragment>
                        );
                      })}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        Nenhum chamado encontrado.
                      </Typography>
                      <Button 
                        variant="contained"
                        component={RouterLink}
                        to="/tickets/new"
                        sx={{ 
                          bgcolor: '#4966f2',
                          '&:hover': { bgcolor: '#3f51b5' },
                          textTransform: 'none'
                        }}
                      >
                        Criar primeiro chamado
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Sidebar com Informações */}
            <Grid item xs={12} lg={4}>
              <Grid container spacing={2}>
                {/* Ações Rápidas */}
                <Grid item xs={12}>
                  <Card sx={{ '&:hover': { boxShadow: 3 } }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: 2 }}>
                        Ações Rápidas
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                          component={RouterLink}
                          to="/tickets/new"
                          variant="contained"
                          fullWidth
                          sx={{ 
                            bgcolor: '#4966f2',
                            '&:hover': { bgcolor: '#3f51b5' },
                            textTransform: 'none',
                            mb: 1
                          }}
                        >
                          Novo Chamado
                        </Button>
                        <Button
                          component={RouterLink}
                          to="/tickets"
                          variant="outlined"
                          fullWidth
                          sx={{ 
                            borderColor: '#e0e0e0',
                            color: '#666',
                            textTransform: 'none'
                          }}
                        >
                          Ver Todos os Chamados
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Chamados Disponíveis para Helpers */}
                {isHelper && (
                  <Grid item xs={12}>
                    <Card sx={{ '&:hover': { boxShadow: 3 } }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: 2 }}>
                          Chamados Disponíveis
                        </Typography>
                        {tickets.filter(t => t.status === 'ABERTO').length > 0 ? (
                          <List sx={{ p: 0 }}>
                            {tickets
                              .filter(t => t.status === 'ABERTO')
                              .slice(0, 3)
                              .map((ticket) => {
                                const ticketData = getTicketData(ticket);
                                return (
                                  <React.Fragment key={ticketData.id}>
                                    <ListItem 
                                      button 
                                      component={RouterLink} 
                                      to={`/tickets/${ticketData.id}`}
                                      sx={{ 
                                        py: 1,
                                        borderRadius: '4px',
                                        mb: 0.5,
                                        '&:hover': {
                                          bgcolor: 'rgba(0, 0, 0, 0.04)',
                                          transform: 'translateX(4px)',
                                          transition: 'all 0.2s ease'
                                        }
                                      }}
                                    >
                                      <ListItemText
                                        primary={
                                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                            {ticketData.title}
                                          </Typography>
                                        }
                                        secondary={
                                          <Typography variant="caption" color="text.secondary">
                                            {formatDate(ticketData.openingDate)}
                                          </Typography>
                                        }
                                      />
                                    </ListItem>
                                    <Divider />
                                  </React.Fragment>
                                );
                              })}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            Não há chamados abertos no momento.
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Informações do Usuário */}
                <Grid item xs={12}>
                  <Card sx={{ '&:hover': { boxShadow: 3 } }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: 2 }}>
                        Bem-vindo!
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            bgcolor: '#4966f2',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            mr: 2
                          }}
                        >
                          {auth.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </Box>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {auth.user?.name || auth.user?.username || 'Usuário'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {isAdmin ? 'Administrador' : isHelper ? 'Helper' : 'Usuário'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Você tem {stats.total} chamado{stats.total !== 1 ? 's' : ''} no sistema.
                      </Typography>
                      
                      {stats.open > 0 && (
                        <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'medium' }}>
                          ⚠️ {stats.open} chamado{stats.open !== 1 ? 's' : ''} aguardando atendimento
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
}

export default Dashboard;