import React, { useContext, useEffect, useState } from 'react';
import { 
  Box, Container, Typography, Grid, Paper, Card, CardContent, 
  CircularProgress, List, ListItem, ListItemText,
  Divider, Button
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
      
      setTickets(ticketsData);
      
      const stats = {
        total: ticketsData.length,
        open: ticketsData.filter(t => t.status === 'ABERTO').length,
        inProgress: ticketsData.filter(t => t.status === 'EM_ATENDIMENTO').length,
        closed: ticketsData.filter(t => t.status === 'FECHADO').length
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
    openingDate: ticket.openingDate || ticket.dataAbertura || ticket.dataCriacao
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
              textTransform: 'none'
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
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Últimos Chamados
                  </Typography>
                  {tickets.length > 0 ? (
                    <List>
                      {tickets.slice(0, 5).map((ticket) => {
                        const ticketData = getTicketData(ticket);
                        return (
                          <React.Fragment key={ticketData.id}>
                            <ListItem 
                              button 
                              component={RouterLink} 
                              to={`/tickets/${ticketData.id}`}
                              sx={{ py: 1.5 }}
                            >
                              <ListItemText
                                primary={ticketData.title}
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
                    <Typography variant="body1" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      Nenhum chamado encontrado.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
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
                          .map((ticket) => {
                            const ticketData = getTicketData(ticket);
                            return (
                              <React.Fragment key={ticketData.id}>
                                <ListItem 
                                  button 
                                  component={RouterLink} 
                                  to={`/tickets/${ticketData.id}`}
                                  sx={{ py: 1.5 }}
                                >
                                  <ListItemText
                                    primary={ticketData.title}
                                    secondary={formatDate(ticketData.openingDate)}
                                  />
                                </ListItem>
                                <Divider />
                              </React.Fragment>
                            );
                          })}
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