import api from '../api';

import { ticketService } from './ticketService';

export const metricsService = {
  getDashboardMetrics: async () => {
    try {
      const response = await api.get('/metrics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      
      // Fallback: usar o endpoint de tickets
      try {
        const ticketsResponse = await ticketService.getTickets();
        return {
          success: true,
          data: ticketsResponse
        };
      } catch (fallbackError) {
        console.error('Fallback também falhou:', fallbackError);
        throw new Error('Não foi possível carregar as métricas');
      }
    }
  }
};

export default metricsService;