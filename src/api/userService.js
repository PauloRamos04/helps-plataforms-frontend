// src/api/userService.js
import api from '../api';

export const userService = {
  // Obter todos os usuários
  getAllUsers: async () => {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  },
  
  // Obter um usuário específico por ID
  getUserById: async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar usuário ${id}:`, error);
      throw error;
    }
  },
  
  // Criar um novo usuário com role específica
  createUserWithRole: async (userData) => {
    try {
      // Adicionar log para verificar os dados sendo enviados
      console.log('Enviando dados para criar usuário:', userData);
      
      const response = await api.post('/admin/users', userData);
      return response.data;
    } catch (error) {
        console.error('Resposta de erro completa:', error.response?.data);
      console.error('Erro ao criar usuário:', error);
      console.error('Resposta de erro:', error.response?.data);
      throw error;
    }
  },
  
  // Deletar um usuário
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao deletar usuário ${id}:`, error);
      throw error;
    }
  },
  
  // Atualizar o status de um usuário (ativar/desativar)
  updateUserStatus: async (id, enabled) => {
    try {
      const response = await api.patch(`/admin/users/${id}/status`, { enabled });
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar status do usuário ${id}:`, error);
      throw error;
    }
  }
};

export default userService;