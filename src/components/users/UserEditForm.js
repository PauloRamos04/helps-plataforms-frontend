import React from 'react';
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
import { useUserForm } from '../../hooks/useUserForm';

const UserEditForm = ({ open, onClose, user, onSuccess }) => {
  const {
    formData,
    errors,
    loading,
    error,
    handleChange,
    handleSubmit
  } = useUserForm(user, onSuccess);

  if (!open) return null;

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
            margin="normal"
            required
            inputProps={{ maxLength: 50 }}
            disabled={true} // Username cannot be changed
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