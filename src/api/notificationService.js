import api from '../api';

const notificationService = {
  getUnreadNotifications: async () => {
    try {
      const response = await api.get('/notifications/unread');
      return response.data;
    } catch (error) {
      return [];
    }
  },
  
  getAllNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  markAllAsRead: async () => {
    try {
      const response = await api.patch('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getNotificationCount: async () => {
    try {
      const response = await api.get('/notifications/count');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  createTestNotification: async (message, type = 'NOVO_CHAMADO', chamadoId = null) => {
    try {
      const payload = {
        message,
        type,
        chamadoId
      };
      
      const response = await api.post('/notifications/test', payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default notificationService;