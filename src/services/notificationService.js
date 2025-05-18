import api from '../api';

const notificationService = {
  getUnreadNotifications: async () => {
    try {
      const response = await api.get('/notifications/unread');
      return response.data;
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      return [];
    }
  },
  
  getAllNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      console.error("Error fetching all notifications:", error);
      throw error;
    }
  },
  
  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  },
  
  markAllAsRead: async () => {
    try {
      const response = await api.patch('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },
  
  getNotificationCount: async () => {
    try {
      const response = await api.get('/notifications/count');
      return response.data;
    } catch (error) {
      console.error("Error getting notification count:", error);
      return { total: 0, unread: 0 };
    }
  },
  
  createTestNotification: async (message, type = 'TEST', chamadoId = null) => {
    try {
      const payload = {
        message,
        type,
        chamadoId
      };
      
      const response = await api.post('/notifications/test', payload);
      return response.data;
    } catch (error) {
      console.error("Error creating test notification:", error);
      throw error;
    }
  }
};

export default notificationService;