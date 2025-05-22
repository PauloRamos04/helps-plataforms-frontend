import React, { useContext, useEffect, useState } from 'react';
import { 
  Box, Container, Typography, Grid, Paper, Card, CardContent, 
  List, ListItem, ListItemText, Divider, CircularProgress,
  Link, Button, Avatar, Chip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { ticketService } from '../services/ticketService';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/tickets/StatusBadge';
import { formatDate, getRelativeTime } from '../utils/dateUtils';
import ErrorHandler from '../components/common/ErrorHandler';

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
      setTickets(data);
      
      const stats = {
        total: data.length,
        open: data.filter(t => t.status === 'ABERTO').length,
        inProgress: data.filter(t => t.status === 'EM_ATENDIMENTO').length,
        closed: data.filter(t => t.status === 'FECHADO').length
      };
      setStats(stats);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setError('Não foi possível carregar os chamados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = (ticket) => {
    const user = ticket.user || ticket.usuario || ticket.solicitante;
    if (!user) return 'Usuário não identificado';
    
    return user.name || user.nome || user.username || 'Usuário';
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'SUPORTE':
        return { bg: '#e3f2fd', color: '#0d47a1' };
      case 'FINANCEIRO':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'TÉCNICO':
        return { bg: '#fff8e1', color: '#ff6f00' };
      default:
        return { bg: '#f5f5f5', color: '#616161' };
    }
  };

  const openTickets = tickets.filter(t => t.status === 'ABERTO');
  const availableTickets = isHelper || isAdmin ? openTickets : openTickets.filter(t => 
    t.user?.id === auth.user?.id || t.usuario?.id === auth.user?.id
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader 
        title="Dashboard"
        actionButton={
          <Link component={RouterLink} to="/tickets/new" underline="none">
            <Button
              variant="contained"
              sx={{
                bgcolor: '#4966f2',
                borderRadius: '4px',
                textTransform: 'none'
              }}
            >
              Novo Chamado
            </Button>
          </Link>
        }
      />
      
      {error && <ErrorHandler message={error} onRetry={fetchTickets} />}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {/* Stat cards */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: '#e3f2fd'
                }}
              >
                <Typography component="h2" variant="h6" color="primary" gutterBottom>
                  Total de Chamados
                </Typography>
                <Typography component="p" variant="h4">
                  {stats.total}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: '#e8f5e9'
                }}
              >
                <Typography component="h2" variant="h6" color="success.main" gutterBottom>
                  Chamados Abertos
                </Typography>
                <Typography component="p" variant="h4">
                  {stats.open}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: '#fff8e1'
                }}
              >
                <Typography component="h2" variant="h6" color="warning.main" gutterBottom>
                  Em Atendimento
                </Typography>
                <Typography component="p" variant="h4">
                  {stats.inProgress}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: '#e8eaf6'
                }}
              >
                <Typography component="h2" variant="h6" color="info.main" gutterBottom>
                  Chamados Fechados
                </Typography>
                <Typography component="p" variant="h4">
                  {stats.closed}
                </Typography>
              </Paper>
            </Grid>
            
            {/* Chamados em Aberto - Seção Principal */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Chamados em Aberto
                    </Typography>
                    <Link component={RouterLink} to="/tickets" underline="none">
                      <Button size="small" sx={{ color: '#4966f2' }}>
                        Ver todos
                      </Button>
                    </Link>
                  </Box>
                  
                  {availableTickets.length > 0 ? (
                    <List sx={{ p: 0 }}>
                      {availableTickets.slice(0, 6).map((ticket, index) => {
                        const categoryColor = getCategoryColor(ticket.category || ticket.categoria);
                        
                        return (
                          <React.Fragment key={ticket.id}>
                            <ListItem 
                              button 
                              component={RouterLink} 
                              to={`/tickets/${ticket.id}`}
                              sx={{ 
                                py: 2,
                                px: 0,
                                '&:hover': {
                                  bgcolor: 'rgba(73, 102, 242, 0.04)'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                {/* Avatar do solicitante */}
                                <Avatar
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: '#4966f2',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    mr: 2
                                  }}
                                >
                                  {getUserDisplayName(ticket).charAt(0).toUpperCase()}
                                </Avatar>
                                
                                {/* Conteúdo principal */}
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <Typography 
                                      variant="body1" 
                                      sx={{ 
                                        fontWeight: 'medium',
                                        mr: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1
                                      }}
                                    >
                                      #{ticket.id} - {ticket.title || ticket.titulo}
                                    </Typography>
                                    <Chip
                                      label={ticket.category || ticket.categoria || 'GERAL'}
                                      size="small"
                                      sx={{
                                        bgcolor: categoryColor.bg,
                                        color: categoryColor.color,
                                        fontSize: '11px',
                                        height: '20px',
                                        ml: 1
                                      }}
                                    />
                                  </Box>
                                  
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">
                                      Por: {getUserDisplayName(ticket)}
                                    </Typography>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="caption" color="text.secondary">
                                        {getRelativeTime(ticket.openingDate || ticket.dataCriacao)}
                                      </Typography>
                                      <StatusBadge status={ticket.status} />
                                    </Box>
                                  </Box>
                                  
                                  {/* Descrição truncada */}
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ 
                                      mt: 0.5,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {ticket.description || ticket.descricao}
                                  </Typography>
                                </Box>
                              </Box>
                            </ListItem>
                            {index < availableTickets.slice(0, 6).length - 1 && <Divider />}
                          </React.Fragment>
                        );
                      })}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        {isHelper || isAdmin ? 'Não há chamados abertos no momento.' : 'Você não possui chamados abertos.'}
                      </Typography>
                      <Link component={RouterLink} to="/tickets/new" underline="none">
                        <Button variant="outlined" sx={{ borderColor: '#4966f2', color: '#4966f2' }}>
                          Criar novo chamado
                        </Button>
                      </Link>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Últimos Chamados - Sidebar */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Atividade Recente
                  </Typography>
                  {tickets.length > 0 ? (
                    <List sx={{ p: 0 }}>
                      {tickets.slice(0, 5).map((ticket, index) => (
                        <React.Fragment key={ticket.id}>
                          <ListItem 
                            button 
                            component={RouterLink} 
                            to={`/tickets/${ticket.id}`}
                            sx={{ py: 1.5, px: 0 }}
                          >
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  #{ticket.id} - {(ticket.title || ticket.titulo).substring(0, 30)}...
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                  <StatusBadge status={ticket.status} />
                                  <Typography variant="caption" color="text.secondary">
                                    {getRelativeTime(ticket.openingDate || ticket.dataCriacao)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < 4 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      Nenhum chamado encontrado.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
}

export default Dashboard;