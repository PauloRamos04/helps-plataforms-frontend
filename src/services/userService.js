import api from '../api';

export const userService = {
  getAllUsers: async () => {
    try {
      const response = await api.get('/admin/users');
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  },

  getUserById: async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  },
  
  createUser: async (userData) => {
    try {
      const response = await api.post('/admin/users', userData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  },
  
  createRegularUser: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao criar usuário regular:', error);
      throw error;
    }
  },
  
  createHelper: async (userData) => {
    try {
      const response = await api.post('/register/helper', userData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao criar helper:', error);
      throw error;
    }
  },
  
  createAdmin: async (userData) => {
    try {
      const response = await api.post('/register/admin', userData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao criar admin:', error);
      throw error;
    }
  },
  
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/admin/users/${id}`, userData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  },
  
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      
      if (response.status === 200 || response.status === 204) {
        return { success: true, message: 'Usuário excluído com sucesso' };
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      if (error.response?.status === 404) {
        throw new Error('Usuário não encontrado');
      } else if (error.response?.status === 403) {
        throw new Error('Você não tem permissão para excluir este usuário');
      } else if (error.response?.status === 409) {
        throw new Error('Não é possível excluir este usuário devido a dependências');
      }
      throw new Error(error.message || 'Erro ao excluir usuário');
    }
  },
  
  updateUserStatus: async (id, enabled) => {
    try {
      const response = await api.patch(`/admin/users/${id}/status`, { enabled });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }
};