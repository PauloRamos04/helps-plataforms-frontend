import api from '../api';

export const userService = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await api.get('/admin/users');
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Create a new user
  createUser: async (userData) => {
    try {
      const response = await api.post('/admin/users', userData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Create a regular user (operador)
  createRegularUser: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Create a helper
  createHelper: async (userData) => {
    try {
      const response = await api.post('/register/helper', userData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Create an admin
  createAdmin: async (userData) => {
    try {
      const response = await api.post('/register/admin', userData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Update a user
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/admin/users/${id}`, userData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Delete a user
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Update user status (active/inactive)
  updateUserStatus: async (id, enabled) => {
    try {
      const response = await api.patch(`/admin/users/${id}/status`, { enabled });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw error;
    }
  }
};