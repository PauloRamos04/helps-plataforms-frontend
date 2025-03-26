import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import notificationWebSocketService from '../api/notificationWebSocketService';
import notificationService from '../api/notificationService';

const useNotifications = () => {
    const { auth } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);

    // Função para carregar notificações não lidas
    const loadNotifications = async () => {
        if (!auth.isAuthenticated) return;

        setLoading(true);
        try {
            const data = await notificationService.getUnreadNotifications();
            if (Array.isArray(data)) {
                setNotifications(data);
                setUnreadCount(data.length);
            }
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        } finally {
            setLoading(false);
        }
    };

    // Marcar uma notificação específica como lida
    const markAsRead = async (notificationId) => {
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
    };

    // Marcar todas as notificações como lidas
    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();

            setNotifications(prev =>
                prev.map(notification => ({ ...notification, read: true }))
            );

            setUnreadCount(0);
        } catch (error) {
            console.error('Erro ao marcar todas notificações como lidas:', error);
        }
    };

    // Callback para processar novas notificações recebidas via WebSocket
    const handleNewNotification = (notification) => {
        if (!notification) return;
        
        // Verificar se já temos esta notificação
        const exists = notifications.some(n => n.id === notification.id);
        if (exists) return;
        
        console.log('Nova notificação recebida:', notification);
        
        // Adicionar à lista de notificações
        setNotifications(prev => {
            const newNotifications = [notification, ...prev];
            return newNotifications;
        });
        
        // Incrementar contagem de não lidas
        if (!notification.read) {
            setUnreadCount(prev => prev + 1);
        }
    };

    // Configurar conexão WebSocket
    useEffect(() => {
        if (!auth.isAuthenticated || !auth.user) return;
        
        const setupWebSocket = () => {
            setWsConnected(false);
            
            notificationWebSocketService.connect(
                () => {
                    setWsConnected(true);
                    console.log('WebSocket conectado - iniciando assinaturas de notificações');
                    
                    // Assinar canal de notificações pessoais usando o ID e username do usuário
                    const userId = auth.user?.id;
                    const username = auth.user?.username;
                    
                    if (userId && username) {
                        const success = notificationWebSocketService.subscribeToUserNotifications(
                            userId,
                            username
                        );
                        
                        if (success) {
                            console.log(`Assinatura de notificações para usuário ${username} (ID: ${userId}) bem-sucedida`);
                        } else {
                            console.warn(`Falha ao assinar notificações para ${username} (${userId})`);
                        }
                    } else {
                        console.warn('Dados de usuário insuficientes para assinatura de notificações');
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
                    
                    // Em caso de falha, recorrer ao polling
                    loadNotifications();
                }
            );
        };
        
        // Iniciar conexão WebSocket
        setupWebSocket();
        
        // Polling como fallback (menos frequente se WebSocket estiver funcionando)
        const pollingInterval = setInterval(() => {
            loadNotifications();
        }, wsConnected ? 60000 : 15000); // 60s com WebSocket / 15s sem WebSocket
        
        // Cleanup na desmontagem do componente
        return () => {
            notificationWebSocketService.removeNotificationCallback(handleNewNotification);
            clearInterval(pollingInterval);
        };
    }, [auth.isAuthenticated, auth.user]);

    return {
        notifications,
        unreadCount,
        loading,
        wsConnected,
        markAsRead,
        markAllAsRead,
        refreshNotifications: loadNotifications,
        addNotification: handleNewNotification
    };
};

export default useNotifications;