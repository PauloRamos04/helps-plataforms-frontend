import React, { createContext, useState, useEffect, useContext } from 'react';
import notificationService from '../api/notificationService';
import notificationWebSocketService from '../api/notificationWebSocketService';
import AuthContext from './AuthContext';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const { currentUser } = useContext(AuthContext);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const fetchedNotifications = await notificationService.getAllNotifications();
      setNotifications(fetchedNotifications || []);
      updateUnreadCount(fetchedNotifications);
    } catch (error) {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const updateUnreadCount = (notificationsList) => {
    const count = notificationsList ? notificationsList.filter(n => !n.read).length : 0;
    setUnreadCount(count);
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      // Silent error
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      setNotifications(prevNotifications => 
        prevNotifications.map(n => ({ ...n, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      // Silent error
    }
  };

  const refreshNotifications = () => {
    fetchNotifications();
  };

  const handleNewNotification = (notification) => {
    setNotifications(prevNotifications => {
      // Avoid duplicates
      const exists = prevNotifications.some(n => n.id === notification.id);
      if (exists) return prevNotifications;
      
      const newNotifications = [notification, ...prevNotifications];
      updateUnreadCount(newNotifications);
      return newNotifications;
    });
  };

  const addDummyNotification = async () => {
    try {
      const dummyNotification = await notificationService.createTestNotification(
        'Esta é uma notificação de teste',
        'NOVA_MENSAGEM'
      );
      
      if (dummyNotification) {
        handleNewNotification(dummyNotification);
      }
    } catch (error) {
      // Silent error
    }
  };

  const setupWebSocket = () => {
    if (!currentUser || !currentUser.username) return;
    
    notificationWebSocketService.connect(
      () => {
        setWsConnected(true);
        
        // Subscribe to user's personal notifications
        notificationWebSocketService.subscribeToUserNotifications(currentUser.username);
        
        // Subscribe to global notifications if needed
        notificationWebSocketService.subscribeToGlobalNotifications();
        
        // Register callback for new notifications
        notificationWebSocketService.addNotificationCallback(handleNewNotification);
      },
      (error) => {
        setWsConnected(false);
      }
    );
  };

  useEffect(() => {
    fetchNotifications();
    setupWebSocket();
    
    return () => {
      notificationWebSocketService.disconnect();
    };
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const contextValue = {
    notifications,
    unreadCount,
    loading,
    wsConnected,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    addDummyNotification
  };

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext;