import React, { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  DialogContentText, Button, CircularProgress, TextField,
  InputAdornment, Snackbar, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import { useUserList } from '../../hooks/useUserList';
import UserEditForm from './UserEditForm';

const UserList = () => {
  const {
    users,
    filteredUsers,
    loading,
    error,
    successMessage,
    selectedUser,
    searchQuery,
    openDeleteDialog,
    openStatusDialog,
    openEditDialog,
    handleOpenDeleteDialog,
    handleOpenStatusDialog,
    handleOpenEditDialog,
    handleCloseDeleteDialog,
    handleCloseStatusDialog,
    handleCloseEditDialog,
    handleDeleteUser,
    handleToggleUserStatus,
    handleEditSuccess,
    handleSearchChange,
    handleRefresh,
    handleCloseSnackbar
  } = useUserList();

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
          <IconButton onClick={handleRefresh} color="primary">
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length > 0 ? (
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

      <UserEditForm 
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        user={selectedUser}
        onSuccess={handleEditSuccess}
      />

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
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error" 
            variant="contained"
          >
            {loading ? <CircularProgress size={24} /> : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

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
          <Button onClick={handleCloseStatusDialog}>Cancelar</Button>
          <Button 
            onClick={handleToggleUserStatus} 
            color={selectedUser?.enabled ? "warning" : "success"} 
            variant="contained"
          >
            {loading ? <CircularProgress size={24} /> : (selectedUser?.enabled ? 'Desativar' : 'Ativar')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={!!successMessage || !!error} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={error ? "error" : "success"} 
          sx={{ width: '100%' }}
        >
          {error || successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UserList;