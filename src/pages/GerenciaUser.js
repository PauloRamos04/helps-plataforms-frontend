import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, TextField, MenuItem, Select,
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tabs, Tab, Snackbar, Alert, CircularProgress,
  Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  IconButton, Tooltip, InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import userService from '../api/userService';
import UserEditForm from '../components/user/UserEditForm';

// Funções de validação
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

const validatePassword = (value) => {
  if (!value) return '';
  
  const errors = [];
  if (value.length < 6) {
    errors.push('Senha deve ter pelo menos 6 caracteres');
  }
  
  return errors.join('. ');
};

// Componente auxiliar para os painéis das abas - DEFINIDO ANTES DE SER USADO
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
};

// Componente para listar usuários
const UsersList = ({ users, onRefresh }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    // Filtrar usuários com base na consulta de pesquisa
    if (!searchQuery) {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(query) || 
        (user.name && user.name.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const getRoleColor = (role) => {
    if (role.includes('ADMIN')) {
      return { bg: '#d32f2f', color: 'white' };
    } else if (role.includes('HELPER')) {
      return { bg: '#388e3c', color: 'white' };
    } else if (role.includes('OPERADOR')) {
      return { bg: '#1976d2', color: 'white' };
    } else {
      return { bg: '#757575', color: 'white' };
    }
  };

  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  const handleOpenStatusDialog = (user) => {
    setSelectedUser(user);
    setOpenStatusDialog(true);
  };

  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setOpenEditDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      await userService.deleteUser(selectedUser.id);
      setSuccessMessage(`Usuário ${selectedUser.username} excluído com sucesso!`);
      onRefresh();
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      setError(err.response?.data?.message || 'Erro ao excluir usuário. Tente novamente.');
    } finally {
      setLoading(false);
      handleCloseDeleteDialog();
    }
  };

  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;
    
    const newStatus = !selectedUser.enabled;
    setLoading(true);
    
    try {
      await userService.updateUserStatus(selectedUser.id, newStatus);
      setSuccessMessage(`Status do usuário ${selectedUser.username} alterado com sucesso!`);
      onRefresh();
    } catch (err) {
      console.error('Erro ao atualizar status do usuário:', err);
      setError(err.response?.data?.message || `Erro ao ${newStatus ? 'ativar' : 'desativar'} usuário. Tente novamente.`);
    } finally {
      setLoading(false);
      handleCloseStatusDialog();
    }
  };

  const handleEditSuccess = () => {
    setSuccessMessage(`Usuário ${selectedUser.username} atualizado com sucesso!`);
    onRefresh();
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField
          placeholder="Buscar usuário..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ width: '300px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Tooltip title="Atualizar lista">
          <IconButton onClick={onRefresh} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Nome</TableCell>
              <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Perfil</TableCell>
              <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'medium', color: '#666' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>#{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>
                    {user.roles && user.roles.map(role => {
                      const { bg, color } = getRoleColor(role);
                      return (
                        <Chip 
                          key={role}
                          label={role} 
                          size="small" 
                          sx={{ 
                            bgcolor: bg, 
                            color: color,
                            mr: 0.5
                          }} 
                        />
                      );
                    })}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.enabled ? 'Ativo' : 'Inativo'} 
                      size="small" 
                      sx={{ 
                        bgcolor: user.enabled ? '#e8f5e9' : '#ffebee', 
                        color: user.enabled ? '#2e7d32' : '#c62828',
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="Editar usuário">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenEditDialog(user)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={user.enabled ? "Desativar usuário" : "Ativar usuário"}>
                        <IconButton 
                          size="small" 
                          color={user.enabled ? "warning" : "success"}
                          onClick={() => handleOpenStatusDialog(user)}
                          sx={{ mr: 1 }}
                        >
                          {user.enabled ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Excluir usuário">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleOpenDeleteDialog(user)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    Nenhum usuário encontrado
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo de edição do usuário */}
      <UserEditForm 
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        user={selectedUser}
        onSuccess={handleEditSuccess}
      />

      {/* Diálogo de confirmação para excluir usuário */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o usuário <strong>{selectedUser?.username}</strong>? Esta ação não poderá ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={loading}>Cancelar</Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmação para alterar status do usuário */}
      <Dialog
        open={openStatusDialog}
        onClose={handleCloseStatusDialog}
      >
        <DialogTitle>Confirmar alteração de status</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja {selectedUser?.enabled ? 'desativar' : 'ativar'} o usuário <strong>{selectedUser?.username}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog} disabled={loading}>Cancelar</Button>
          <Button 
            onClick={handleToggleUserStatus} 
            color={selectedUser?.enabled ? "warning" : "success"} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (selectedUser?.enabled ? 'Desativar' : 'Ativar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mensagens de sucesso/erro */}
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={() => setSuccessMessage('')}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

// Componente para criar novo usuário
const UserForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'OPERADOR'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear the error for this field when the user changes it
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate form fields
    const validationErrors = {};
    
    // Username validation
    const usernameError = validateRequired(formData.username, 'Nome de usuário') || 
                          validateUsername(formData.username);
    if (usernameError) validationErrors.username = usernameError;
    
    // Password validation
    const passwordError = validateRequired(formData.password, 'Senha') || 
                          validatePassword(formData.password);
    if (passwordError) validationErrors.password = passwordError;
    
    // If there
    
    // If there are validation errors, show them and stop submission
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setLoading(false);
      return;
    }
    
    try {
      // Call the API to create the user
      await userService.createUserWithRole({
        username: formData.username,
        password: formData.password,
        name: formData.name,
        role: formData.role
      });

      setSuccessMessage('Usuário criado com sucesso!');
      
      // Clear the form after successful submission
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'OPERADOR'
      });
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      
      // Extract error message from response
      const errorMessage = err.response?.data?.message || 'Erro ao criar usuário. Verifique os dados e tente novamente.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
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
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || ''}
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
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "A senha deve ter pelo menos 6 caracteres"}
      />

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
          {loading ? <CircularProgress size={24} /> : 'Criar Usuário'}
        </Button>
      </Box>
    </Box>
  );
};

// Componente principal de gerenciamento de usuários
function GerenciaUser() {
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.getAllUsers();
      console.log('Usuários carregados:', data);
      setUsers(data);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError('Erro ao carregar usuários. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 'medium' }}>
            Gerenciamento de Usuários
          </Typography>
          
          <Button
            variant="outlined"
            onClick={() => navigate('/dashboard')}
            sx={{ 
              borderColor: '#e0e0e0',
              color: '#666',
              borderRadius: '4px',
              textTransform: 'none'
            }}
          >
            Voltar
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Listar Usuários" id="tab-0" />
              <Tab label="Criar Usuário" id="tab-1" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress size={40} sx={{ color: '#4966f2' }} />
              </Box>
            ) : (
              <UsersList users={users} onRefresh={fetchUsers} />
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <UserForm />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}

export default GerenciaUser;