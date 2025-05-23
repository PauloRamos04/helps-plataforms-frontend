import api from '../api';

export const activityLogService = {
  getActivityLogs: async (page = 0, size = 20, sortBy = 'createdAt', sortDirection = 'desc') => {
    try {
      const response = await api.get('/admin/activity/logs', {
        params: { page, size, sortBy, sortDirection }
      });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw new Error('Não foi possível carregar os logs de atividade');
    }
  },

  getActivityLogsByDateRange: async (startDate, endDate, page = 0, size = 20, sortBy = 'createdAt', sortDirection = 'desc') => {
    try {
      const response = await api.get('/admin/activity/logs/date-range', {
        params: { startDate, endDate, page, size, sortBy, sortDirection }
      });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw new Error('Não foi possível carregar os logs do período');
    }
  },

  getUserSessions: async (page = 0, size = 20, sortBy = 'loginTime', sortDirection = 'desc') => {
    try {
      const response = await api.get('/admin/activity/sessions', {
        params: { page, size, sortBy, sortDirection }
      });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw new Error('Não foi possível carregar as sessões');
    }
  },

  getActiveSessions: async () => {
    try {
      const response = await api.get('/admin/activity/sessions/active');
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw new Error('Não foi possível carregar as sessões ativas');
    }
  },

  getActivityStats: async () => {
    try {
      const response = await api.get('/admin/activity/stats');
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw new Error('Não foi possível carregar as estatísticas');
    }
  }
};

export default activityLogService;