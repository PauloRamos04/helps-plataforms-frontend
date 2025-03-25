// src/components/user/UserEditForm.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
import userService from '../../api/userService';

const UserEditForm = ({ open, onClose, user, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    role: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        name: user.name || '',
        role: user.roles && user.roles.length > 0 ? user.roles[0] : 'OPERADOR'
      });
    }
  }, [user]);

  const validateRequired = (value, fieldName) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} é obrigatório`;
    }
    return '';
  };

  const validateUsername = (value) => {
    if (!value) return '';
    
    if (value.length < 3) {
      return 'Nome de usuário deve ter pelo menos 3 caracteres';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Nome de usuário deve conter apenas letras, números e underscores';
    }
    
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    // Validate form fields
    const validationErrors = {};
    
    // Username validation
    const usernameError = validateRequired(formData.username, 'Nome de usuário') || 
                          validateUsername(formData.username);
    if (usernameError) validationErrors.username = usernameError;
    
    // If there are validation errors, show them and stop submission
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setLoading(false);
      return;
    }
    
    try {
      await userService.updateUser(user.id, {
        username: formData.username,
        name: formData.name,
        role: formData.role
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar usuário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Usuário</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Nome de Usuário"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
            inputProps={{ maxLength: 50 }}
            error={!!fieldErrors.username}
            helperText={fieldErrors.username || ''}
            disabled={true} // Geralmente não é recomendado alterar o username
          />

          <TextField
            fullWidth
            label="Nome Completo"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            inputProps={{ maxLength: 100 }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel id="role-edit-label">Perfil</InputLabel>
            <Select
              labelId="role-edit-label"
              name="role"
              value={formData.role}
              onChange={handleChange}
              label="Perfil"
            >
              <MenuItem value="ADMIN">Administrador</MenuItem>
              <MenuItem value="HELPER">Helper</MenuItem>
              <MenuItem value="OPERADOR">Operador</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary"
          variant="contained" 
          disabled={loading}
          sx={{ bgcolor: '#4966f2' }}
        >
          {loading ? <CircularProgress size={24} /> : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserEditForm;