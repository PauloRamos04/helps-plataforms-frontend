import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthContext from './AuthContext';
import notificationService from '../api/notificationService';
import websocketService from '../api/websocketService';
import notificationsManager from '../utils/notificationsManager';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { auth } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const loadNotifications = async () => {
    if (!auth.isAuthenticated) return;

    setLoading(true);
    try {
      console.log("Carregando notificações...");
      
      try {
        const data = await notificationService.getUnreadNotifications();
        console.log("Notificações carregadas da API:", data);
        
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.length);
        } else {
          console.warn("Dados de notificações inválidos da API, usando gerenciador local");
          // Use o gerenciador local como fallback
          const localNotifications = notificationsManager.getUnreadNotifications();
          setNotifications(localNotifications);
          setUnreadCount(localNotifications.length);
        }
      } catch (apiError) {
        // Se houver erro na API, usamos o gerenciador local
        console.warn("Erro na API de notificações, usando gerenciador local:", apiError);
        const localNotifications = notificationsManager.getUnreadNotifications();
        setNotifications(localNotifications);
        setUnreadCount(localNotifications.length);
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setLoading(false);
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

  // Adiciona uma notificação manualmente (para testes ou quando recebida via WebSocket)
  const addNotification = (notification) => {
    console.log("Adicionando nova notificação:", notification);
    // Verificar se a notificação é válida
    if (!notification) return;
    
    // Adicionar ID se não existir
    const notificationWithId = {
      ...notification,
      id: notification.id || Date.now(),
      createdAt: notification.createdAt || new Date().toISOString(),
      read: notification.read || false
    };
    
    setNotifications(prev => [notificationWithId, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const connectToWebSocket = () => {
    if (!auth.isAuthenticated) return;

    console.log("Tentando conectar ao WebSocket...");
    
    websocketService.connect(
      () => {
        console.log("WebSocket conectado, configurando assinaturas de notificações");
        setWsConnected(true);
        
        // Inscrever-se no tópico global de notificações
        websocketService.subscribeToGlobalNotifications((notification) => {
          console.log("Notificação global recebida:", notification);
          addNotification(notification);
        });
        
        // Inscrever-se nas notificações específicas do usuário
        if (auth.user && auth.user.username) {
          websocketService.subscribeToNotifications(
            auth.user.id,
            auth.user.username,
            (notification) => {
              console.log("Notificação pessoal recebida:", notification);
              addNotification(notification);
            }
          );
        }
      },
      (error) => {
        console.error("Erro na conexão WebSocket:", error);
        setWsConnected(false);
      }
    );
  };

  // Efeito para conexão inicial e carregar notificações
  useEffect(() => {
    if (!auth.isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    console.log("Auth state mudou, recarregando notificações e conectando WebSocket");
    loadNotifications();
    connectToWebSocket();

    // Polling como fallback
    const interval = setInterval(loadNotifications, 15000);
    
    return () => {
      clearInterval(interval);
      if (websocketService.isConnected) {
        websocketService.disconnect();
      }
      setWsConnected(false);
    };
  }, [auth.isAuthenticated, auth.user?.id]);

  // Adicionar uma notificação artificial para teste
  const addDummyNotification = () => {
    const dummyNotification = {
      id: Date.now(),
      message: "Nova notificação de teste - " + new Date().toLocaleTimeString(),
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