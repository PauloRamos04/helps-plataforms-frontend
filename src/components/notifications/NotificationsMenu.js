// src/components/notifications/NotificationsMenu.js
import React, { useState, useEffect } from 'react';
import {
  Badge, IconButton, Menu, MenuItem, Typography, Box, 
  Divider, List, ListItem, ListItemText, CircularProgress
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';

const NotificationsMenu = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Simular algumas notificações
  useEffect(() => {
    setNotifications([
      {
        id: 1,
        message: 'Nova mensagem no chamado #123',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutos atrás
        read: false,
        chamadoId: 123
      },
      {
        id: 2,
        message: 'Chamado #456 foi atualizado',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutos atrás
        read: false,
        chamadoId: 456
      }
    ]);
  }, []);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
    setLoading(true);
    
    // Simular carregamento
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationClick = (notification) => {
    // Marcar como lida
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    
    // Navegar para o chamado se aplicável
    if (notification.chamadoId) {
      navigate(`/chamados/${notification.chamadoId}`);
    }
    
    handleCloseMenu();
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    handleCloseMenu();
  };
  
  // Formatar data relativa
  const formatRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `${diffMinutes}m atrás`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`;
    return `${Math.floor(diffMinutes / 1440)}d atrás`;
  };
  
  return (
    <>
      <IconButton 
        color="inherit" 
        onClick={handleOpenMenu}
        sx={{ color: '#4966f2' }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            width: 320,
            maxWidth: '100%',
            maxHeight: 400,
            overflowY: 'auto'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="medium">
            Notificações
          </Typography>
          
          {unreadCount > 0 && (
            <Typography 
              variant="body2" 
              sx={{ color: '#4966f2', cursor: 'pointer' }}
              onClick={handleMarkAllAsRead}
            >
              Marcar todas como lidas
            </Typography>
          )}
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length > 0 ? (
          <List disablePadding>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem 
                  button 
                  onClick={() => handleNotificationClick(notification)}
                  sx={{ 
                    bgcolor: notification.read ? 'transparent' : 'rgba(73, 102, 242, 0.1)',
                    py: 1.5
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: notification.read ? 'normal' : 'medium'
                        }}
                      >
                        {notification.message}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="textSecondary">
                        {formatRelativeTime(notification.timestamp)}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Nenhuma notificação no momento
            </Typography>
          </Box>
        )}
      </Menu>
    </>
  );
};

export default NotificationsMenu;