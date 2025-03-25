/**
 * Gerenciador de notificações local que pode ser usado como fallback
 * quando o servidor de websocket não está disponível
 */

// Armazena notificações localmente
let notifications = [];
let listeners = [];

// Constantes para tipos de notificações
export const NOTIFICATION_TYPES = {
  NOVO_CHAMADO: 'NOVO_CHAMADO',
  CHAMADO_EM_ATENDIMENTO: 'CHAMADO_EM_ATENDIMENTO', 
  CHAMADO_FECHADO: 'CHAMADO_FECHADO',
  NOVA_MENSAGEM: 'NOVA_MENSAGEM'
};

/**
 * Adiciona uma notificação
 */
export const addNotification = (notification) => {
  const newNotification = {
    ...notification,
    id: notification.id || Date.now(),
    createdAt: notification.createdAt || new Date().toISOString(),
    read: notification.read || false
  };
  
  notifications = [newNotification, ...notifications];
  
  // Notificar listeners
  notifyListeners();
  
  return newNotification;
};

/**
 * Marca uma notificação como lida
 */
export const markAsRead = (notificationId) => {
  notifications = notifications.map(notification => 
    notification.id === notificationId 
      ? { ...notification, read: true } 
      : notification
  );
  
  // Notificar listeners
  notifyListeners();
};

/**
 * Marca todas as notificações como lidas
 */
export const markAllAsRead = () => {
  notifications = notifications.map(notification => ({ ...notification, read: true }));
  
  // Notificar listeners
  notifyListeners();
};

/**
 * Retorna todas as notificações não lidas
 */
export const getUnreadNotifications = () => {
  return notifications.filter(notification => !notification.read);
};

/**
 * Retorna todas as notificações
 */
export const getAllNotifications = () => {
  return [...notifications];
};

/**
 * Adiciona um listener para mudanças nas notificações
 */
export const addListener = (callback) => {
  if (typeof callback === 'function' && !listeners.includes(callback)) {
    listeners.push(callback);
  }
};

/**
 * Remove um listener
 */
export const removeListener = (callback) => {
  listeners = listeners.filter(listener => listener !== callback);
};

/**
 * Notifica os listeners sobre mudanças
 */
const notifyListeners = () => {
  listeners.forEach(listener => {
    try {
      listener(getAllNotifications());
    } catch (error) {
      console.error("Erro ao notificar listener:", error);
    }
  });
};

/**
 * Cria uma notificação de novo chamado
 */
export const createChamadoNotification = (chamadoId, titulo, tipo, categoria) => {
  return addNotification({
    message: `Novo chamado criado: ${titulo}`,
    type: NOTIFICATION_TYPES.NOVO_CHAMADO,
    chamadoId,
    categoria,
    prioridade: tipo
  });
};

/**
 * Cria uma notificação de chamado em atendimento
 */
export const createAtendimentoNotification = (chamadoId, titulo, helper) => {
  return addNotification({
    message: `Chamado "${titulo}" em atendimento por ${helper}`,
    type: NOTIFICATION_TYPES.CHAMADO_EM_ATENDIMENTO,
    chamadoId
  });
};

/**
 * Cria uma notificação de chamado fechado
 */
export const createChamadoFechadoNotification = (chamadoId, titulo) => {
  return addNotification({
    message: `Chamado "${titulo}" foi fechado`,
    type: NOTIFICATION_TYPES.CHAMADO_FECHADO,
    chamadoId
  });
};

export default {
  addNotification,
  markAsRead,
  markAllAsRead,
  getUnreadNotifications,
  getAllNotifications,
  addListener,
  removeListener,
  createChamadoNotification,
  createAtendimentoNotification,
  createChamadoFechadoNotification,
  NOTIFICATION_TYPES
};