import api from '../api';

export const metricsService = {
  getDashboardMetrics: async () => {
    try {
      const response = await api.get('/metrics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      throw new Error('Não foi possível carregar as métricas');
    }
  }
};

export default metricsService;