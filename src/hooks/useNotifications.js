import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import websocketService from '../api/websocketService';
import axios from 'axios';


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

const useNotifications = () => {
    const { auth } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

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

            setNotifications(prev =>
                prev.map(notification => ({ ...notification, read: true }))
            );

            setUnreadCount(0);
        } catch (error) {
            console.error('Erro ao marcar todas notificações como lidas:', error);
        }
    };

    useEffect(() => {
        if (!auth.isAuthenticated) return;

        loadNotifications();

        const setupNotificationListener = () => {
            if (!websocketService.isConnected) {
                websocketService.connect(
                    () => {
                        console.log('Conectado para receber notificações');

                        const username = auth.user?.username;
                        if (username) {
                            const userNotificationTopic = `/user/${username}/queue/notifications`;

                            websocketService.stompClient.subscribe(
                                userNotificationTopic,
                                (payload) => {
                                    const notification = JSON.parse(payload.body);

                                    setNotifications(prev => [notification, ...prev]);

                                    setUnreadCount(prev => prev + 1);
                                }
                            );
                        }
                    },
                    (error) => {
                        console.error('Erro ao conectar para notificações:', error);
                    }
                );
            }
        };

        setupNotificationListener();

        return () => {
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