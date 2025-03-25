import React, { useState, useContext } from 'react';
import { 
  Box, Typography, TextField, Button, Paper, 
  FormControl, InputLabel, Select, MenuItem,
  Alert, Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { chamadoService } from '../api/chamadoService';
import AuthContext from '../context/AuthContext';
import NotificationsContext from '../context/NotificationsContext';
import notificationsManager from '../utils/notificationsManager';

function NovoChamado() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const notificationsContext = useContext(NotificationsContext);
  
  const [formData, setFormData] = useState({
    setor: 'SAC',
    tipoSolicitacao: 'CLIENTE SEM ACESSO A SVA',
    responsavel: 'HELPER 1',
    categoria: 'SUPORTE',
    tipo: 'NORMAL',
    descricao: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Enviar chamado para o backend
      const response = await chamadoService.createChamado({
        titulo: formData.tipoSolicitacao,
        descricao: formData.descricao,
        setor: formData.setor,
        responsavel: formData.responsavel,
        categoria: formData.categoria,
        tipo: formData.tipo
      });
      
      // Mostrar mensagem de sucesso
      setOpenSnackbar(true);
      
      // Criar notificação usando o gerenciador
      notificationsManager.createChamadoNotification(
        response.id || 1, 
        formData.tipoSolicitacao,
        formData.tipo,
        formData.categoria
      );
      
      // Também tentar adicionar a notificação pelo contexto
      if (notificationsContext && typeof notificationsContext.addNotification === 'function') {
        notificationsContext.addNotification({
          message: `Novo chamado criado: ${formData.tipoSolicitacao}`,
          type: 'NOVO_CHAMADO',
          read: false,
          chamadoId: response.id || 1,
          createdAt: new Date().toISOString(),
          categoria: formData.categoria,
          prioridade: formData.tipo
        });
      } else {
        console.warn("Função addNotification não disponível no contexto de notificações");
      }
      
      // Redirecionar após um breve atraso
      setTimeout(() => {
        navigate('/chamados');
      }, 1500);
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      setError('Erro ao criar chamado. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  // Componente Select personalizado para combinar com o design
  const CustomSelect = ({ name, label, value, options, onChange }) => (
    <Box sx={{ mb: 2 }}>
      <FormControl fullWidth size="small">
        <InputLabel 
          id={`${name}-label`}
          sx={{ fontSize: '14px' }}
        >
          {label}
        </InputLabel>
        <Select
          labelId={`${name}-label`}
          name={name}
          value={value}
          label={label}
          onChange={onChange}
          sx={{ 
            bgcolor: 'white',
            borderRadius: '4px',
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: '#e0e0e0'
            }
          }}
        >
          {options.map(option => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: '8px',
          p: 3,
          mb: 3
        }}
      >
        <Typography variant="h6" component="h1" sx={{ mb: 3, fontWeight: 'medium' }}>
          Novo Chamado
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <CustomSelect 
            name="setor"
            label="Setor"
            value={formData.setor}
            options={['SAC']}
            onChange={handleChange}
          />
          
          <CustomSelect 
            name="tipoSolicitacao"
            label="Solicitação"
            value={formData.tipoSolicitacao}
            options={['CLIENTE SEM ACESSO A SVA']}
            onChange={handleChange}
          />
          
          <CustomSelect 
            name="responsavel"
            label="Responsável"
            value={formData.responsavel}
            options={['HELPER 1', 'HELPER 2']}
            onChange={handleChange}
          />
          
          <CustomSelect 
            name="categoria"
            label="Categoria"
            value={formData.categoria}
            options={['SUPORTE', 'FINANCEIRO', 'TÉCNICO']}
            onChange={handleChange}
          />
          
          <CustomSelect 
            name="tipo"
            label="Tipo"
            value={formData.tipo}
            options={['NORMAL', 'URGENTE', 'PRIORITÁRIO']}
            onChange={handleChange}
          />
          
          <Box 
            sx={{ 
              p: 3, 
              bgcolor: '#f5f5f5', 
              borderRadius: '4px',
              minHeight: '200px',
              mb: 3
            }}
          >
            <TextField
              fullWidth
              multiline
              rows={6}
              placeholder="Descreva sua solicitação aqui..."
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              variant="outlined"
              sx={{ 
                '.MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: '4px'
                }
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              sx={{ 
                bgcolor: '#4966f2',
                borderRadius: '4px',
                textTransform: 'none',
                px: 3
              }}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Chamado criado com sucesso!
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default NovoChamado;