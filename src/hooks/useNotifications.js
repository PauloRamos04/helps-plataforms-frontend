// src/hooks/useNotifications.js
import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import websocketService from '../api/websocketService';
import axios from 'axios';

// Função para obter as notificações não lidas
const fetchUnreadNotifications = async () => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/notifications/unread`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao obter notificações:', error);
    return [];
  }
};

// Hook personalizado para gerenciar notificações
const useNotifications = () => {
  const { auth } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Carregar notificações não lidas
  const loadNotifications = async () => {
    if (!auth.isAuthenticated) return;
    
    setLoading(true);
    try {
      const data = await fetchUnreadNotifications();
      setNotifications(data);
      setUnreadCount(data.length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Marcar uma notificação como lida
  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Atualizar o estado local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Marcar todas as notificações como lidas
  const markAllAsRead = async () => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/notifications/mark-all-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Atualizar o estado local
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
    }
  };

  // Configurar WebSocket para notificações em tempo real
  useEffect(() => {
    if (!auth.isAuthenticated) return;
    
    // Primeira carga de notificações
    loadNotifications();
    
    // Configurar o ouvinte de WebSocket para notificações
    const setupNotificationListener = () => {
      if (!websocketService.isConnected) {
        websocketService.connect(
          // onConnected
          () => {
            console.log('Conectado para receber notificações');
            
            // Inscrever para receber notificações pessoais
            const username = auth.user?.username;
            if (username) {
              const userNotificationTopic = `/user/${username}/queue/notifications`;
              
              websocketService.stompClient.subscribe(
                userNotificationTopic,
                (payload) => {
                  const notification = JSON.parse(payload.body);
                  
                  // Adicionar a nova notificação à lista
                  setNotifications(prev => [notification, ...prev]);
                  
                  // Incrementar o contador de não lidas
                  setUnreadCount(prev => prev + 1);
                }
              );
            }
          },
          // onError
          (error) => {
            console.error('Erro ao conectar para notificações:', error);
          }
        );
      }
    };
    
    setupNotificationListener();
    
    // Limpar ao desmontar
    return () => {
      // Não desconecta o WebSocket aqui para permitir que outros componentes o utilizem
    };
  }, [auth.isAuthenticated, auth.user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: loadNotifications
  };
};

export default useNotifications;