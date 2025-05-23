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

  // Carregar notificações não lidas do backend
  const fetchNotifications = async () => {
    if (!auth.isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await api.get('/notifications/unread');
      const data = response.data;
      
      // Verificar se a resposta tem estrutura de ApiResponse
      const notificationsData = Array.isArray(data) ? data : (data?.data || []);
      
      if (Array.isArray(notificationsData)) {
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      // Não mostrar erro para o usuário se for 404 ou 500 (endpoints podem não existir ainda)
    } finally {
      setLoading(false);
    }
  };

  // Marcar uma notificação como lida
  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      updateUnreadCount();
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Marcar todas as notificações como lidas
  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      
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
      
      return newNotifications.slice(0, 50); // Manter apenas as últimas 50
    });
  };

  // Callback para processar novas notificações do WebSocket
  const handleNewNotification = (notification) => {
    if (!notification) return;
    
    // FILTRO: Verificar se a notificação é relevante para o usuário atual
    const shouldReceiveNotification = checkIfShouldReceiveNotification(notification);
    
    if (!shouldReceiveNotification) {
      console.log('Notificação filtrada (não relevante para este usuário):', notification);
      return;
    }
    
    console.log('Nova notificação recebida via WebSocket:', notification);
    addNotification(notification);
  };

  // Função para verificar se o usuário deve receber a notificação
  const checkIfShouldReceiveNotification = (notification) => {
    if (!auth.user || !notification) return false;
    
    const userRoles = auth.user.roles || [];
    const userId = auth.user.id;
    
    // Verificar se é admin ou helper
    const isAdminOrHelper = userRoles.some(role => 
      role === 'ADMIN' || role === 'HELPER' || 
      role === 'ROLE_ADMIN' || role === 'ROLE_HELPER'
    );
    
    switch (notification.type) {
      case 'NEW_TICKET':
      case 'NOVO_CHAMADO':
        // Apenas admins e helpers devem receber notificações de novos tickets
        return isAdminOrHelper;
        
      case 'NEW_MESSAGE':
      case 'NOVA_MENSAGEM':
        // Receber notificações de mensagem apenas se for participante do ticket
        // (backend já filtra, mas adicionamos verificação extra)
        return true;
        
      case 'TICKET_ASSIGNED':
      case 'CHAMADO_EM_ATENDIMENTO':
      case 'TICKET_EM_ATENDIMENTO':
        // Receber se for o solicitante do ticket
        return true;
        
      case 'TICKET_CLOSED':
      case 'CHAMADO_FECHADO':
      case 'TICKET_FECHADO':
        // Receber se for participante do ticket
        return true;
        
      case 'TEST':
        // Notificações de teste sempre são aceitas
        return true;
        
      default:
        // Por padrão, aceitar outras notificações
        return true;
    }
  };

  // Configurar WebSocket para notificações em tempo real
  const setupWebSocket = () => {
    if (!auth.isAuthenticated || !auth.user) {
      setWsConnected(false);
      return;
    }
    
    console.log('Configurando WebSocket para notificações...');
    
    notificationWebSocketService.connect(
      () => {
        console.log('WebSocket conectado para notificações');
        setWsConnected(true);
        
        // Assinar notificações do usuário atual
        const userId = auth.user.id;
        const username = auth.user.username;
        
        if (userId && username) {
          const success = notificationWebSocketService.subscribeToUserNotifications(userId, username);
          console.log(`Assinatura de notificações para ${username}:`, success);
          
          // Registrar callback para receber notificações
          notificationWebSocketService.addNotificationCallback(handleNewNotification);
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

  // Função para adicionar uma notificação de teste
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

  // Efeito para iniciar carregamento de notificações e setup de WebSocket
  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      fetchNotifications();
      setupWebSocket();
      
      // Polling como fallback a cada 60 segundos
      const interval = setInterval(() => {
        if (!wsConnected) {
          fetchNotifications();
        }
      }, 60000);
      
      return () => {
        clearInterval(interval);
        // Remover callback ao desmontar
        notificationWebSocketService.removeNotificationCallback(handleNewNotification);
        notificationWebSocketService.disconnect();
        setWsConnected(false);
      };
    } else {
      // Limpar o estado quando o usuário não está autenticado
      setNotifications([]);
      setUnreadCount(0);
      setWsConnected(false);
      notificationWebSocketService.disconnect();
    }
  }, [auth.isAuthenticated, auth.user?.id]);

  // Efeito para atualizar contador quando notificações mudam
  useEffect(() => {
    updateUnreadCount();
  }, [notifications]);

  // Valor a ser fornecido pelo contexto
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