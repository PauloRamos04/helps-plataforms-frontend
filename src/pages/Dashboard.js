import React, { useContext, useEffect, useState } from 'react';
import { 
  Box, Container, Typography, Grid, Paper, Card, CardContent, 
  CardHeader, List, ListItem, ListItemText, Divider, CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { chamadoService } from '../api/chamadoService'; // Importação corrigida

function Dashboard() {
  const { auth } = useContext(AuthContext);
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    abertos: 0,
    emAtendimento: 0,
    fechados: 0
  });

  const isHelper = auth.user && auth.user.roles && auth.user.roles.includes('ROLE_HELPER');

  useEffect(() => {
    fetchChamados();
  }, []);

  const fetchChamados = async () => {
    try {
      setLoading(true);
      const data = await chamadoService.getChamados();
      setChamados(data);
      
      // Calcular estatísticas
      const estatisticas = {
        total: data.length,
        abertos: data.filter(c => c.status === 'ABERTO').length,
        emAtendimento: data.filter(c => c.status === 'EM_ATENDIMENTO').length,
        fechados: data.filter(c => c.status === 'FECHADO').length
      };
      setEstatisticas(estatisticas);
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ABERTO':
        return 'Aberto';
      case 'EM_ATENDIMENTO':
        return 'Em Atendimento';
      case 'FECHADO':
        return 'Fechado';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {/* Cards de estatísticas */}
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
                  {estatisticas.total}
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
                  {estatisticas.abertos}
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
                  {estatisticas.emAtendimento}
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
                  {estatisticas.fechados}
                </Typography>
              </Paper>
            </Grid>
            
            {/* Últimos chamados */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Últimos Chamados" />
                <CardContent>
                  {chamados.length > 0 ? (
                    <List>
                      {chamados.slice(0, 5).map((chamado, index) => (
                        <React.Fragment key={chamado.id}>
                          <ListItem 
                            button 
                            component={Link} 
                            to={`/chamados/${chamado.id}`}
                          >
                            <ListItemText
                              primary={chamado.titulo}
                              secondary={
                                <>
                                  <Typography component="span" variant="body2" color="text.primary">
                                    Status: {getStatusLabel(chamado.status)}
                                  </Typography>
                                  {" — "}
                                  {formatDate(chamado.dataCriacao)}
                                </>
                              }
                            />
                          </ListItem>
                          {index < Math.min(chamados.length - 1, 4) && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      Nenhum chamado encontrado.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Conteúdo específico para helpers */}
            {isHelper && (
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Chamados Disponíveis para Atendimento" />
                  <CardContent>
                    {chamados.filter(c => c.status === 'ABERTO').length > 0 ? (
                      <List>
                        {chamados
                          .filter(c => c.status === 'ABERTO')
                          .slice(0, 5)
                          .map((chamado, index) => (
                            <React.Fragment key={chamado.id}>
                              <ListItem 
                                button 
                                component={Link} 
                                to={`/chamados/${chamado.id}`}
                              >
                                <ListItemText
                                  primary={chamado.titulo}
                                  secondary={formatDate(chamado.dataCriacao)}
                                />
                              </ListItem>
                              {index < Math.min(chamados.filter(c => c.status === 'ABERTO').length - 1, 4) && <Divider />}
                            </React.Fragment>
                          ))}
                      </List>
                    ) : (
                      <Typography variant="body1" color="text.secondary">
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