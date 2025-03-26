import api from '../api';

export const userService = {
  getAllUsers: async () => {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  },

  getUserById: async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar usuário ${id}:`, error);
      throw error;
    }
  },
  
  createUserWithRole: async (userData) => {
    try {
      console.log('Enviando dados para criar usuário:', userData);
      
      const response = await api.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      console.error('Resposta de erro:', error.response?.data);
      throw error;
    }
  },
  
  updateUser: async (id, userData) => {
    try {
      console.log('Enviando dados para atualizar usuário:', userData);
      
      const response = await api.put(`/admin/users/${id}`, userData);

      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar usuário ${id}:`, error);
      console.error('Resposta de erro:', error.response?.data);
      throw error;
    }
  },
  
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao deletar usuário ${id}:`, error);
      throw error;
    }
  },
  
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