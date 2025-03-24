import api from '../api';

export const notificationService = {
  getUnreadNotifications: async () => {
    try {
      const response = await api.get('/notifications/unread');
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
  }
};

export default notificationService;