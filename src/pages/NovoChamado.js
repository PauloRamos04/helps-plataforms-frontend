import React, { useState } from 'react';
import { 
  Box, Typography, TextField, Button, Paper, 
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { chamadoService } from '../api';

function NovoChamado() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    setor: 'SAC',
    tipoSolicitacao: 'CLIENTE SEM ACESSO A SVA',
    responsavel: 'HELPER 1',
    descricao: ''
  });
  const [loading, setLoading] = useState(false);
  
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
    
    try {
      await chamadoService.createChamado({
        titulo: formData.tipoSolicitacao,
        descricao: formData.descricao,
        setor: formData.setor,
        responsavel: formData.responsavel
      });
      navigate('/chamados');
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
    } finally {
      setLoading(false);
    }
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
          
          <Box 
            sx={{ 
              p: 3, 
              bgcolor: '#f5f5f5', 
              borderRadius: '4px',
              minHeight: '200px',
              mb: 3
            }}
          >
            {/* Área para descrição do chamado */}
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
    </Box>
  );
}

export default NovoChamado;