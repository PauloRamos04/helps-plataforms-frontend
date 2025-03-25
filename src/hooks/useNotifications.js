import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import websocketService from '../api/websocketService';
import notificationService from '../api/notificationService';

const useNotifications = () => {
    const { auth } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const loadNotifications = async () => {
        if (!auth.isAuthenticated) return;

        setLoading(true);
        try {
            const data = await notificationService.getUnreadNotifications();
            setNotifications(data);
            setUnreadCount(data.length);
        } catch (error) {
            // Silenciar erros para experiência do usuário
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
            // Silenciar erros para experiência do usuário
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
            // Silenciar erros para experiência do usuário
        }
    };

    useEffect(() => {
        if (!auth.isAuthenticated) return;
    
        // Configuração inicial do WebSocket
        const setupNotificationListener = () => {
            // Se já estiver conectado, não reconecta
            if (websocketService.isConnected) return;
    
            websocketService.connect(
                () => {
                    const username = auth.user?.username;
                    
                    if (username) {
                        websocketService.subscribeToNotifications(
                            auth.user?.id,
                            username,
                            (notification) => {
                                setNotifications(prev => [notification, ...prev]);
                                setUnreadCount(prev => prev + 1);
                            }
                        );
                    }
                },
                (error) => {
                    console.error('Erro na configuração do WebSocket:', error);
                    // Fallback para polling
                    loadNotifications();
                }
            );
        };
    
        setupNotificationListener();
    
        // Polling como fallback
        const interval = setInterval(loadNotifications, 30000);
        
        return () => {
            clearInterval(interval);
            // Opcional: desconectar o WebSocket
            websocketService.disconnect();
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