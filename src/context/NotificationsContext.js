import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthContext from './AuthContext';
import notificationService from '../api/notificationService';
import notificationWebSocketService from '../api/notificationWebSocketService';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { auth } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Carregar notificações não lidas
  const fetchNotifications = async () => {
    if (!auth.isAuthenticated) return;
    
    setLoading(true);
    try {
      const data = await notificationService.getUnreadNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Marcar uma notificação como lida
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      // Atualizar contador de não lidas
      updateUnreadCount();
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Marcar todas as notificações como lidas
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      setNotifications(prevNotifications => 
        prevNotifications.map(n => ({ ...n, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  };

  // Atualizar contador de notificações não lidas
  const updateUnreadCount = () => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  };

  // Adicionar nova notificação
  const addNotification = (notification) => {
    if (!notification) return;
    
    setNotifications(prev => {
      // Verificar se a notificação já existe
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      
      // Adicionar nova notificação
      const newNotifications = [notification, ...prev];
      
      // Atualizar contador se a notificação não estiver lida
      if (!notification.read) {
        setUnreadCount(prevCount => prevCount + 1);
      }
      
      return newNotifications;
    });
  };

  // Configurar WebSocket para notificações em tempo real
  const setupWebSocket = () => {
    if (!auth.isAuthenticated || !auth.user) return;
    
    notificationWebSocketService.connect(
      () => {
        setWsConnected(true);
        
        // Assinar notificações do usuário atual
        const userId = auth.user.id;
        const username = auth.user.username;
        
        if (userId && username) {
          notificationWebSocketService.subscribeToUserNotifications(userId, username);
          
          // Registrar callback para receber notificações
          notificationWebSocketService.addNotificationCallback(addNotification);
        }
        
        // Também assinar notificações globais
        notificationWebSocketService.subscribeToGlobalNotifications();
      },
      (error) => {
        console.error('Erro na conexão WebSocket:', error);
        setWsConnected(false);
      }
    );
  };

  // Efeito para iniciar carregamento de notificações e setup de WebSocket
  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchNotifications();
      setupWebSocket();
      
      // Polling como fallback
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);
      
      return () => {
        clearInterval(interval);
        notificationWebSocketService.disconnect();
      };
    } else {
      // Limpar o estado quando o usuário não está autenticado
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [auth.isAuthenticated, auth.user]);

  // Valor a ser fornecido pelo contexto
  const contextValue = {
    notifications,
    unreadCount,
    loading,
    wsConnected,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
    addNotification
  };

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext;