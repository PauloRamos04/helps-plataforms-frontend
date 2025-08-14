// Função auxiliar para validar e criar uma data válida
export const createValidDate = (dateString) => {
  if (!dateString) return null;
  
  // Se já é um objeto Date válido
  if (dateString instanceof Date && !isNaN(dateString.getTime())) {
    return dateString;
  }
  
  // Se é um timestamp numérico
  if (typeof dateString === 'number' && !isNaN(dateString)) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // NOVO: Se é um array de números (formato LocalDateTime do Java)
  if (Array.isArray(dateString) && dateString.length >= 6) {
    // [year, month (1-indexed), day, hour, minute, second, nanosecond]
    const [year, month, day, hour, minute, second] = dateString;
    // Month is 0-indexed in JavaScript Date constructor
    const date = new Date(year, month - 1, day, hour, minute, second);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Se é uma string, tentar criar data diretamente
  if (typeof dateString === 'string') {
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (error) {
      return null;
    }
  }
  
  return null;
};

// Format date to DD/MM/YYYY
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  const date = createValidDate(dateString);
  if (!date) return '-';
  
  try {
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    return '-';
  }
};

// Format date to DD/MM/YYYY HH:MM
export const formatDateTime = (dateString) => {
  const date = createValidDate(dateString);
  if (!date) return '-';
  
  try {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {

    return '-';
  }
};

// Format time to HH:MM
export const formatTime = (dateString) => {
  if (!dateString) return '';
  
  const date = createValidDate(dateString);
  if (!date) return '';
  
  try {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (error) {

    return '';
  }
};

// Get relative time (e.g., "2m ago")
export const getRelativeTime = (dateString) => {
  const date = createValidDate(dateString);
  if (!date) return 'agora';
  
  try {
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `${diffMinutes}m atrás`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`;
    return `${Math.floor(diffMinutes / 1440)}d atrás`;
  } catch (error) {

    return 'agora';
  }
};

// Função para converter qualquer formato de data para ISO string
export const toISOString = (dateString) => {
  const date = createValidDate(dateString);
  if (!date) return new Date().toISOString();
  
  try {
    return date.toISOString();
  } catch (error) {

    return new Date().toISOString();
  }
};

// Função para validar se uma data é válida
export const isValidDate = (dateString) => {
  return createValidDate(dateString) !== null;
};