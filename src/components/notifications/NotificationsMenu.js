import React, { useState, useEffect } from 'react';
import {
  Badge, IconButton, Menu, MenuItem, Typography, Box, 
  Divider, List, ListItem, ListItemText, CircularProgress
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../../hooks/useNotifications';

const NotificationsMenu = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    refreshNotifications 
  } = useNotifications();
  
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
    refreshNotifications();
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    if (notification.chamadoId) {
      navigate(`/chamados/${notification.chamadoId}`);
    }
    
    handleCloseMenu();
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsRead();
    handleCloseMenu();
  };
  
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
                        {formatRelativeTime(notification.createdAt)}
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