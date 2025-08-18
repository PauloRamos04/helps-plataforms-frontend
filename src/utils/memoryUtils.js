/**
 * Formata bytes para uma unidade legível (KB, MB, GB, etc.)
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Formata uptime em segundos para um formato legível
 */
export const formatUptime = (seconds) => {
  if (!seconds || seconds === 0) return '0s';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

/**
 * Calcula a porcentagem de uso de memória
 */
export const calculateMemoryUsage = (used, total) => {
  if (!total || total === 0) return 0;
  return (used / total) * 100;
};

/**
 * Obtém o status de saúde da memória baseado na porcentagem de uso
 */
export const getMemoryHealthStatus = (usagePercentage) => {
  if (usagePercentage >= 90) return 'critical';
  if (usagePercentage >= 75) return 'warning';
  if (usagePercentage >= 50) return 'moderate';
  return 'healthy';
};

/**
 * Formata timestamp para exibição
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return 'Data inválida';
  }
};
