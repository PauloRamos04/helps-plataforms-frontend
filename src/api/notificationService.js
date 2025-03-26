import api from '../api';

const notificationService = {
  getUnreadNotifications: async () => {
    try {
      const response = await api.get('/notifications/unread');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notificações não lidas:', error);
      return [];
    }
  },
  
  getAllNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar todas as notificações:', error);
      throw error;
    }
  },
  
  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao marcar notificação ${notificationId} como lida:`, error);
      throw error;
    }
  },
  
  markAllAsRead: async () => {
    try {
      const response = await api.patch('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      throw error;
    }
  },
  
  getNotificationCount: async () => {
    try {
      const response = await api.get('/notifications/count');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar contagem de notificações:', error);
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
      console.error('Erro ao criar notificação de teste:', error);
      throw error;
    }
  }
};

export default notificationService;