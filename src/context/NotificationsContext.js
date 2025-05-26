import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthContext from './AuthContext';
import notificationWebSocketService from '../services/notificationWebSocketService';
import api from '../api';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { auth } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const fetchNotifications = async () => {
    if (!auth.isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await api.get('/notifications/unread');
      const data = response.data;
      
      const notificationsData = Array.isArray(data) ? data : (data?.data || []);
      
      if (Array.isArray(notificationsData)) {
        const unreadNotifications = notificationsData.filter(n => !n.read);
        setNotifications(unreadNotifications);
        setUnreadCount(unreadNotifications.length);
      }
    } catch (error) {
      return error;
    } finally {
      setLoading(false);
    }
  };

  const updateUnreadCount = (notificationsList = notifications) => {
    const count = notificationsList.filter(n => !n.read).length;
    setUnreadCount(count);
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      
      setNotifications(prevNotifications => {
        const updated = prevNotifications.filter(n => n.id !== notificationId);
        setUnreadCount(updated.length);
        return updated;
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  };

  const addNotification = (notification) => {
    if (!notification) return;
    
    setNotifications(prev => {
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      
      const newNotifications = [notification, ...prev];
      
      if (!notification.read) {
        setUnreadCount(prevCount => prevCount + 1);
      }
      
      return newNotifications.slice(0, 50);
    });
  };

  const handleNewNotification = (notification) => {
    if (!notification) return;
    
    const shouldReceiveNotification = checkIfShouldReceiveNotification(notification);
    
    if (!shouldReceiveNotification) {
      return;
    }
    
    addNotification(notification);
  };

  const checkIfShouldReceiveNotification = (notification) => {
    if (!auth.user || !notification) return false;
    
    const userRoles = auth.user.roles || [];
    
    const isAdminOrHelper = userRoles.some(role => 
      role === 'ADMIN' || role === 'HELPER' || 
      role === 'ROLE_ADMIN' || role === 'ROLE_HELPER'
    );
    
    switch (notification.type) {
      case 'NEW_TICKET':
      case 'NOVO_CHAMADO':
        return isAdminOrHelper;
        
      case 'NEW_MESSAGE':
      case 'NOVA_MENSAGEM':
        return true;
        
      case 'TICKET_ASSIGNED':
      case 'CHAMADO_EM_ATENDIMENTO':
      case 'TICKET_EM_ATENDIMENTO':
        return true;
        
      case 'TICKET_CLOSED':
      case 'CHAMADO_FECHADO':
      case 'TICKET_FECHADO':
        return true;
        
      case 'TEST':
        return true;
        
      default:
        return true;
    }
  };

  const setupWebSocket = () => {
    if (!auth.isAuthenticated || !auth.user) {
      setWsConnected(false);
      return;
    }
    
    notificationWebSocketService.connect(
      () => {
        setWsConnected(true);
        
        const userId = auth.user.id;
        const username = auth.user.username;
        
        if (userId && username) {
          notificationWebSocketService.subscribeToUserNotifications(userId, username);
          notificationWebSocketService.addNotificationCallback(handleNewNotification);
        }
        
        notificationWebSocketService.subscribeToGlobalNotifications();
      },
      (error) => {
        setWsConnected(false);
      }
    );
  };

  const addDummyNotification = () => {
    const dummyNotification = {
      id: `dummy-${Date.now()}`,
      message: 'Esta é uma notificação de teste',
      type: 'TEST',
      ticketId: null,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    addNotification(dummyNotification);
  };

  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      fetchNotifications();
      setupWebSocket();
      
      const interval = setInterval(() => {
        if (!wsConnected) {
          fetchNotifications();
        }
      }, 60000);
      
      return () => {
        clearInterval(interval);
        notificationWebSocketService.removeNotificationCallback(handleNewNotification);
        notificationWebSocketService.disconnect();
        setWsConnected(false);
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setWsConnected(false);
      notificationWebSocketService.disconnect();
    }
  }, [auth.isAuthenticated, auth.user?.id]);

  const contextValue = {
    notifications,
    unreadCount,
    loading,
    wsConnected,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
    addNotification,
    addDummyNotification
  };

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext;