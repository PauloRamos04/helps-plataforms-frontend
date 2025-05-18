import { useState, useEffect } from 'react';
import { userService } from '../services/userService';

export const useUserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(query) || 
      (user.name && user.name.toLowerCase().includes(query))
    );
    
    setFilteredUsers(filtered);
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
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
    
    try {
      setLoading(true);
      await userService.deleteUser(selectedUser.id);
      setSuccessMessage(`Usuário ${selectedUser.username} excluído com sucesso!`);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Erro ao excluir usuário. Tente novamente.');
    } finally {
      setLoading(false);
      handleCloseDeleteDialog();
    }
  };
  
  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;
    
    const newStatus = !selectedUser.enabled;
    
    try {
      setLoading(true);
      await userService.updateUserStatus(selectedUser.id, newStatus);
      setSuccessMessage(`Status do usuário ${selectedUser.username} alterado com sucesso!`);
      fetchUsers();
    } catch (err) {
      setError(err.message || `Erro ao ${newStatus ? 'ativar' : 'desativar'} usuário. Tente novamente.`);
    } finally {
      setLoading(false);
      handleCloseStatusDialog();
    }
  };
  
  const handleEditSuccess = () => {
    setSuccessMessage(`Usuário ${selectedUser.username} atualizado com sucesso!`);
    fetchUsers();
    handleCloseEditDialog();
  };
  
  const handleRefresh = () => {
    fetchUsers();
  };
  
  const handleCloseSnackbar = () => {
    setError('');
    setSuccessMessage('');
  };
  
  return {
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
  };
};