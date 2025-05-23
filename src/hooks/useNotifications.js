import { useState, useEffect, useContext, useCallback } from 'react';
import AuthContext from '../context/AuthContext';
import notificationWebSocketService from '../services/notificationWebSocketService';
import notificationService from '../services/notificationService';

const useNotifications = () => {
    const { auth } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);

    // Função para buscar notificações da API
    const loadNotifications = useCallback(async () => {
        if (!auth.isAuthenticated) return;

        setLoading(true);
        try {
            const data = await notificationService.getUnreadNotifications();
            if (Array.isArray(data)) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
            // Em caso de erro da API, manter as notificações locais
        } finally {
            setLoading(false);
        }
    }, [auth.isAuthenticated]);

    // Função para marcar uma notificação como lida
    const markAsRead = useCallback(async (notificationId) => {
        if (!notificationId) return;
        
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
            console.error('Erro ao marcar notificação como lida:', error);
        }
    }, []);

    // Função para marcar todas as notificações como lidas
    const markAllAsRead = useCallback(async () => {
        try {
            await notificationService.markAllAsRead();
            
            setNotifications(prev =>
                prev.map(notification => ({ ...notification, read: true }))
            );

            setUnreadCount(0);
        } catch (error) {
            console.error('Erro ao marcar todas as notificações como lidas:', error);
        }
    }, []);

    // Callback para processar novas notificações recebidas via WebSocket
    const handleNewNotification = useCallback((notification) => {
        if (!notification) return;
        
        console.log('Nova notificação recebida:', notification);
        
        // Verificar se já temos esta notificação
        setNotifications(prev => {
            const exists = prev.some(n => n.id === notification.id);
            if (exists) return prev;
            
            // Adicionar nova notificação no topo
            const newNotifications = [notification, ...prev];
            
            // Limitar a 50 notificações para performance
            return newNotifications.slice(0, 50);
        });
        
        // Incrementar contagem de não lidas se necessário
        if (!notification.read) {
            setUnreadCount(prev => prev + 1);
        }

        // Mostrar notificação visual/sonora
        showVisualNotification(notification);
    }, []);

    // Função para mostrar notificação visual
    const showVisualNotification = useCallback((notification) => {
        // Verificar se o browser suporta notificações
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.message, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `notification-${notification.id}`,
                renotify: false,
                requireInteraction: false,
                silent: false
            });

            // Auto-fechar após 5 segundos
            setTimeout(() => {
                browserNotification.close();
            }, 5000);

            // Click handler para navegar para o chamado
            browserNotification.onclick = () => {
                if (notification.ticketId || notification.chamadoId) {
                    window.focus();
                    window.location.href = `/tickets/${notification.ticketId || notification.chamadoId}`;
                }
                browserNotification.close();
            };
        }

        // Som de notificação (opcional)
        try {
            const audio = new Audio('/notification-sound.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Falha silenciosa se não conseguir tocar o som
            });
        } catch (error) {
            // Ignorar erro de áudio
        }
    }, []);

    // Função para solicitar permissão de notificação
    const requestNotificationPermission = useCallback(async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }, []);

    // Adicionar uma notificação de teste
    const addTestNotification = useCallback(() => {
        const testNotification = {
            id: `test-${Date.now()}`,
            message: 'Esta é uma notificação de teste do sistema',
            type: 'TEST',
            ticketId: null,
            read: false,
            createdAt: new Date().toISOString()
        };
        
        handleNewNotification(testNotification);
    }, [handleNewNotification]);

    // Configuração WebSocket
    useEffect(() => {
        if (!auth.isAuthenticated || !auth.user) return;
        
        const setupWebSocket = () => {
            setWsConnected(false);
            
            notificationWebSocketService.connect(
                () => {
                    setWsConnected(true);
                    console.log('WebSocket conectado - configurando notificações');
                    
                    // Solicitar permissão para notificações do browser
                    requestNotificationPermission();
                    
                    // Assinar canal de notificações pessoais
                    const userId = auth.user?.id;
                    const username = auth.user?.username;
                    
                    if (userId && username) {
                        const success = notificationWebSocketService.subscribeToUserNotifications(
                            userId,
                            username
                        );
                        
                        if (success) {
                            console.log(`Notificações configuradas para ${username} (ID: ${userId})`);
                        }
                    }
                    
                    // Assinar canal de notificações globais
                    notificationWebSocketService.subscribeToGlobalNotifications();
                    
                    // Registrar callback para novas notificações
                    notificationWebSocketService.addNotificationCallback(handleNewNotification);
                    
                    // Carregar notificações existentes
                    loadNotifications();
                },
                (error) => {
                    console.error('Erro na conexão WebSocket:', error);
                    setWsConnected(false);
                    
                    // Fallback: carregar notificações via polling
                    loadNotifications();
                }
            );
        };
        
        // Iniciar conexão WebSocket
        setupWebSocket();
        
        // Polling como fallback
        const pollingInterval = setInterval(() => {
            if (!wsConnected) {
                loadNotifications();
            }
        }, 30000); // 30 segundos
        
        // Cleanup na desmontagem do componente
        return () => {
            notificationWebSocketService.removeNotificationCallback(handleNewNotification);
            clearInterval(pollingInterval);
        };
    }, [auth.isAuthenticated, auth.user, wsConnected, loadNotifications, handleNewNotification, requestNotificationPermission]);

    return {
        notifications,
        unreadCount,
        loading,
        wsConnected,
        markAsRead,
        markAllAsRead,
        refreshNotifications: loadNotifications,
        addTestNotification,
        requestNotificationPermission
    };
};

export default useNotifications;
export { useNotifications };