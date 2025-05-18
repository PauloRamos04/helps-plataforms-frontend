import React, { useContext, useEffect, useState } from 'react';
import { 
  Box, Container, Typography, Grid, Paper, Card, CardContent, 
  List, ListItem, ListItemText, Divider, CircularProgress,
  Link, Button
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { ticketService } from '../services/ticketService';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/tickets/StatusBadge';
import { formatDate } from '../utils/dateUtils';
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

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ticketService.getChamados();
      setTickets(data);
      
      // Calculate stats
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
            
            {/* Recent tickets */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Últimos Chamados
                  </Typography>
                  {tickets.length > 0 ? (
                    <List>
                      {tickets.slice(0, 5).map((ticket) => (
                        <React.Fragment key={ticket.id}>
                          <ListItem 
                            button 
                            component={RouterLink} 
                            to={`/tickets/${ticket.id}`}
                            sx={{ py: 1.5 }}
                          >
                            <ListItemText
                              primary={ticket.title || ticket.titulo}
                              secondary={
                                <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                                  <Typography component="span" variant="body2" color="text.primary">
                                    <StatusBadge status={ticket.status} />
                                  </Typography>
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    {formatDate(ticket.openingDate || ticket.dataCriacao)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      Nenhum chamado encontrado.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Helper-specific content */}
            {isHelper && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Chamados Disponíveis para Atendimento
                    </Typography>
                    {tickets.filter(t => t.status === 'ABERTO').length > 0 ? (
                      <List>
                        {tickets
                          .filter(t => t.status === 'ABERTO')
                          .slice(0, 5)
                          .map((ticket) => (
                            <React.Fragment key={ticket.id}>
                              <ListItem 
                                button 
                                component={RouterLink} 
                                to={`/tickets/${ticket.id}`}
                                sx={{ py: 1.5 }}
                              >
                                <ListItemText
                                  primary={ticket.title || ticket.titulo}
                                  secondary={formatDate(ticket.openingDate || ticket.dataCriacao)}
                                />
                              </ListItem>
                              <Divider />
                            </React.Fragment>
                          ))}
                      </List>
                    ) : (
                      <Typography variant="body1" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        Não há chamados abertos no momento.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Container>
  );
}

export default Dashboard;