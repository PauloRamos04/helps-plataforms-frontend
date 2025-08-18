import api from '../api';

class MemoryService {
  /**
   * Obtém estatísticas de memória da aplicação
   */
  async getMemoryStats() {
    try {
      const response = await api.get('/api/memory/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas de memória:', error);
      throw error;
    }
  }

  /**
   * Força limpeza manual de memória
   */
  async forceCleanup() {
    try {
      const response = await api.post('/api/memory/cleanup');
      return response.data;
    } catch (error) {
      console.error('Erro ao executar limpeza de memória:', error);
      throw error;
    }
  }

  /**
   * Obtém informações detalhadas sobre o uso de memória
   */
  async getDetailedMemoryInfo() {
    try {
      const response = await api.get('/api/memory/detailed');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter informações detalhadas de memória:', error);
      throw error;
    }
  }
}

export default new MemoryService();
