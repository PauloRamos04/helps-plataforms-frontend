import React, { useState } from 'react';
import {
  Box, TextField, FormControl, InputLabel, Select,
  MenuItem, Button, CircularProgress, Alert
} from '@mui/material';
import { useUserForm } from '../../hooks/useUserForm';

const UserForm = ({ initialData = null, onSuccess }) => {
  const {
    formData,
    errors,
    loading,
    error,
    successMessage,
    handleChange,
    handleSubmit
  } = useUserForm(initialData, onSuccess);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Nome de Usuário"
        name="username"
        value={formData.username}
        onChange={handleChange}
        margin="normal"
        required
        sx={{ mb: 2 }}
        inputProps={{ maxLength: 50 }}
        error={!!errors.username}
        helperText={errors.username || ''}
        disabled={!!initialData}
      />

      <TextField
        fullWidth
        label="Nome Completo"
        name="name"
        value={formData.name}
        onChange={handleChange}
        margin="normal"
        sx={{ mb: 2 }}
        inputProps={{ maxLength: 100 }}
      />

      {!initialData && (
        <TextField
          fullWidth
          label="Senha"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          margin="normal"
          required
          sx={{ mb: 2 }}
          inputProps={{ minLength: 6 }}
          error={!!errors.password}
          helperText={errors.password || "A senha deve ter pelo menos 6 caracteres"}
        />
      )}

      <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
        <InputLabel id="role-label">Perfil</InputLabel>
        <Select
          labelId="role-label"
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

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          type="submit"
          variant="contained"
          sx={{ 
            bgcolor: '#4966f2',
            borderRadius: '4px',
            textTransform: 'none'
          }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : initialData ? 'Atualizar Usuário' : 'Criar Usuário'}
        </Button>
      </Box>
    </Box>
  );
};

export default UserForm;