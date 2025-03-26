import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthContext from './AuthContext';
import notificationService from '../api/notificationService';
import notificationWebSocketService from '../api/notificationWebSocketService';
import notificationsManager from '../utils/notificationsManager';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { auth } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const loadNotifications = async (silent = false) => {
    if (!auth.isAuthenticated) return;

    if (!silent) setLoading(true);
    try {
      try {
        const data = await notificationService.getUnreadNotifications();
        
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.length);
        } else {
          const localNotifications = notificationsManager.getUnreadNotifications();
          setNotifications(localNotifications);
          setUnreadCount(localNotifications.length);
        }
      } catch (apiError) {
        const localNotifications = notificationsManager.getUnreadNotifications();
        setNotifications(localNotifications);
        setUnreadCount(localNotifications.length);
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Erro ao marcar todas notificações como lidas:", error);
    }
  };

  const addNotification = (notification) => {
    if (!notification) return;
    
    const notificationWithId = {
      ...notification,
      id: notification.id || Date.now(),
      createdAt: notification.createdAt || new Date().toISOString(),
      read: notification.read || false
    };
    
    setNotifications(prev => {
      if (prev.some(n => n.id === notificationWithId.id)) {
        return prev;
      }
      return [notificationWithId, ...prev];
    });
    
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const setupWebSocket = () => {
    if (!auth.isAuthenticated || !auth.user) return;
    
    console.log("Configurando WebSocket para notificações...");
    console.log("Usuário autenticado:", auth.user.username);
    console.log("Papéis do usuário:", auth.user.roles);
    
    const handleNotification = (notification) => {
      console.log("Notificação recebida via WebSocket:", notification);
      // Adiciona à lista de notificações no estado
      addNotification(notification);
    };
    
    notificationWebSocketService.removeNotificationCallback(handleNotification);
    notificationWebSocketService.addNotificationCallback(handleNotification);
    
    notificationWebSocketService.connect(
      () => {
        setWsConnected(true);
        console.log("WebSocket conectado com sucesso!");
        
        // Primeiro assina notificações globais
        console.log("Assinando tópico de notificações globais...");
        const globalSuccess = notificationWebSocketService.subscribeToGlobalNotifications();
        console.log("Assinatura global bem-sucedida:", globalSuccess);
        
        // Depois assina notificações pessoais
        if (auth.user.username) {
          console.log("Assinando tópico de notificações pessoais para", auth.user.username);
          const userSuccess = notificationWebSocketService.subscribeToUserNotifications(auth.user.username);
          console.log("Assinatura pessoal bem-sucedida:", userSuccess);
        } else {
          console.warn("Nome de usuário não disponível para assinar notificações pessoais");
        }
      },
      (error) => {
        console.error("Erro na conexão WebSocket:", error);
        setWsConnected(false);
      }
    );
  };

useEffect(() => {
  if (!auth.isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setWsConnected(false);
      notificationWebSocketService.disconnect();
      return;
  }
  setupWebSocket();

  return () => {
      notificationWebSocketService.disconnect();
      setWsConnected(false);
  };
}, [auth.isAuthenticated, auth.user?.id]);

  const addDummyNotification = () => {
    const dummyNotification = {
      id: Date.now(),
      message: `Nova notificação de teste - ${new Date().toLocaleTimeString()}`,
      type: "NOVO_CHAMADO",
      read: false,
      chamadoId: 1,
      createdAt: new Date().toISOString()
    };
    
    addNotification(dummyNotification);
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        wsConnected,
        markAsRead,
        markAllAsRead,
        refreshNotifications: loadNotifications,
        addNotification,
        addDummyNotification
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext;