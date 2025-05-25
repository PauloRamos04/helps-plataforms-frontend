import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
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
  
  const authRef = useRef(auth);
  const setupInProgress = useRef(false);
  const reconnectTimer = useRef(null);
  const fetchTimer = useRef(null);

  authRef.current = auth;

  const fetchNotifications = useCallback(async () => {
    if (!authRef.current?.isAuthenticated || loading) return;
    
    setLoading(true);
    try {
      const response = await api.get('/notifications/unread');
      const data = response.data;
      
      const notificationsData = Array.isArray(data) ? data : (data?.data || []);
      
      if (Array.isArray(notificationsData)) {
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      
      setNotifications(prevNotifications => 
        prevNotifications.map(n => ({ ...n, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }, []);

  const addNotification = useCallback((notification) => {
    if (!notification) return;
    
    setNotifications(prev => {
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      
      const newNotifications = [notification, ...prev].slice(0, 50);
      
      if (!notification.read) {
        setUnreadCount(prevCount => prevCount + 1);
      }
      
      return newNotifications;
    });
  }, []);

  const handleNewNotification = useCallback((notification) => {
    if (!notification || !authRef.current?.user) return;
    
    const shouldReceive = checkIfShouldReceiveNotification(notification);
    if (shouldReceive) {
      addNotification(notification);
    }
  }, [addNotification]);

  const checkIfShouldReceiveNotification = useCallback((notification) => {
    if (!authRef.current?.user || !notification) return false;
    
    const userRoles = authRef.current.user.roles || [];
    const isAdminOrHelper = userRoles.some(role => 
      role === 'ADMIN' || role === 'HELPER' || 
      role === 'ROLE_ADMIN' || role === 'ROLE_HELPER'
    );
    
    switch (notification.type) {
      case 'NEW_TICKET':
      case 'NOVO_CHAMADO':
        return isAdminOrHelper;
      default:
        return true;
    }
  }, []);

  const setupWebSocket = useCallback(() => {
    if (!authRef.current?.isAuthenticated || !authRef.current?.user || setupInProgress.current) {
      return;
    }
    
    setupInProgress.current = true;
    
    const connectWebSocket = () => {
      notificationWebSocketService.connect(
        () => {
          setWsConnected(true);
          setupInProgress.current = false;
          
          const userId = authRef.current.user.id;
          const username = authRef.current.user.username;
          
          if (userId && username) {
            notificationWebSocketService.subscribeToUserNotifications(userId, username);
            notificationWebSocketService.addNotificationCallback(handleNewNotification);
          }
          
          notificationWebSocketService.subscribeToGlobalNotifications();
          
          if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current);
            reconnectTimer.current = null;
          }
        },
        (error) => {
          console.error('Erro WebSocket:', error);
          setWsConnected(false);
          setupInProgress.current = false;
          
          if (authRef.current?.isAuthenticated && !reconnectTimer.current) {
            reconnectTimer.current = setTimeout(() => {
              reconnectTimer.current = null;
              if (authRef.current?.isAuthenticated) {
                setupWebSocket();
              }
            }, 5000);
          }
        }
      );
    };

    connectWebSocket();
  }, [handleNewNotification]);

  const addDummyNotification = useCallback(() => {
    const dummyNotification = {
      id: `dummy-${Date.now()}`,
      message: 'Esta é uma notificação de teste',
      type: 'TEST',
      ticketId: null,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    addNotification(dummyNotification);
  }, [addNotification]);

  const cleanup = useCallback(() => {
    setupInProgress.current = false;
    setNotifications([]);
    setUnreadCount(0);
    setWsConnected(false);
    
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    
    if (fetchTimer.current) {
      clearInterval(fetchTimer.current);
      fetchTimer.current = null;
    }
    
    notificationWebSocketService.removeNotificationCallback(handleNewNotification);
    notificationWebSocketService.disconnect();
  }, [handleNewNotification]);

  useEffect(() => {
    if (!auth?.isAuthenticated || !auth?.user?.id) {
      cleanup();
      return;
    }

    fetchNotifications();
    setupWebSocket();
    
    fetchTimer.current = setInterval(() => {
      if (!wsConnected && authRef.current?.isAuthenticated) {
        fetchNotifications();
      }
    }, 60000);

    return cleanup;
  }, [auth?.isAuthenticated, auth?.user?.id]);

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