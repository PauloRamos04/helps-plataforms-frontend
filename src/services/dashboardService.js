import api from '../api';

export const dashboardService = {
  getDashboardStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      throw new Error('Não foi possível carregar as estatísticas do dashboard');
    }
  },

  getSystemHealth: async () => {
    try {
      const response = await api.get('/dashboard/health');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar saúde do sistema:', error);
      throw new Error('Não foi possível verificar a saúde do sistema');
    }
  },

  getRealtimeMetrics: async () => {
    try {
      const response = await api.get('/dashboard/realtime');
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('Erro ao buscar métricas em tempo real:', error);
      throw new Error('Não foi possível carregar métricas em tempo real');
    }
  },

  exportDashboardData: async (format = 'json', timeRange = '7d') => {
    try {
      const response = await api.get('/dashboard/export', {
        params: { format, timeRange },
        responseType: format === 'pdf' ? 'blob' : 'json'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar dados do dashboard:', error);
      throw new Error('Não foi possível exportar os dados');
    }
  }
};

export default dashboardService;

