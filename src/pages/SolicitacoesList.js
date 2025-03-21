import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';
import { chamadoService } from '../api';

function SolicitacoesList() {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChamados();
  }, []);

  const fetchChamados = async () => {
    try {
      setLoading(true);
      const data = await chamadoService.getChamados();
      setChamados(data);
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
    } finally {
      setLoading(false);
    }
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
        <Typography variant="h6" component="h1" sx={{ mb: 3, fontWeight: 'medium' }}>
          Solicitações
        </Typography>
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'medium', color: '#666', fontSize: '14px' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'medium', color: '#666', fontSize: '14px' }}>CATEGORIA</TableCell>
                <TableCell sx={{ fontWeight: 'medium', color: '#666', fontSize: '14px' }}>SOLICITAÇÃO</TableCell>
                <TableCell sx={{ fontWeight: 'medium', color: '#666', fontSize: '14px' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 'medium', color: '#666', fontSize: '14px' }}>SOLICITANTE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Carregando...</TableCell>
                </TableRow>
              ) : chamados.length > 0 ? (
                chamados.map((chamado) => (
                  <TableRow 
                    key={chamado.id}
                    sx={{ 
                      '&:hover': { 
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                        cursor: 'pointer'
                      }
                    }}
                    onClick={() => window.location.href = `/chamados/${chamado.id}`}
                  >
                    <TableCell sx={{ fontSize: '14px' }}>{`#${chamado.id}`}</TableCell>
                    <TableCell sx={{ fontSize: '14px' }}>SAC</TableCell>
                    <TableCell sx={{ fontSize: '14px' }}>CLIENTE SEM ACESSO AO SVA</TableCell>
                    <TableCell sx={{ fontSize: '14px' }}>EM ANÁLISE</TableCell>
                    <TableCell sx={{ fontSize: '14px' }}>PAULOFR</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">Nenhum chamado encontrado</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default SolicitacoesList;