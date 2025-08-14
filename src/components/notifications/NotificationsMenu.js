import React, { useState, useContext } from 'react';
import {
  Badge, IconButton, Menu, MenuItem, Typography, Box, 
  Divider, List, ListItem, ListItemText, CircularProgress,
  Button, Tooltip, Chip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MessageIcon from '@mui/icons-material/Message';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useNavigate } from 'react-router-dom';
import NotificationsContext from '../../context/NotificationsContext';

const NotificationsMenu = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    wsConnected,
    markAsRead, 
    markAllAsRead, 
    refreshNotifications,
    addDummyNotification
  } = useContext(NotificationsContext);
  
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationClick = (notification) => {
    if (notification.id && !notification.read) {
      markAsRead(notification.id);
    }
    
    handleCloseMenu();
    
    if (notification.ticketId || notification.chamadoId) {
      const ticketId = notification.ticketId || notification.chamadoId;
      setTimeout(() => {
        navigate(`/tickets/${ticketId}`);
      }, 300);
    }
  };

  const handleClearAll = async () => {
    await markAllAsRead();
    handleCloseMenu();
  };
  
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'agora';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {

        return 'agora';
      }
      
      const now = new Date();
      const diffMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffMinutes < 1) return 'agora';
      if (diffMinutes < 60) return `${diffMinutes}m atrás`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`;
      return `${Math.floor(diffMinutes / 1440)}d atrás`;
    } catch (error) {
      
      return 'agora';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NOVO_CHAMADO':
      case 'NEW_TICKET':
        return <InfoIcon fontSize="small" color="primary" />;
      case 'CHAMADO_EM_ATENDIMENTO':
      case 'TICKET_EM_ATENDIMENTO':
        return <WarningIcon fontSize="small" color="warning" />;
      case 'CHAMADO_FECHADO':
      case 'TICKET_FECHADO':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'NOVA_MENSAGEM':
      case 'NEW_MESSAGE':
        return <MessageIcon fontSize="small" color="info" />;
      case 'TEST':
        return <FiberManualRecordIcon fontSize="small" color="secondary" />;
      default:
        return <InfoIcon fontSize="small" color="action" />;
    }
  };

  const handleAddTestNotification = (e) => {
    e.stopPropagation();
    addDummyNotification();
  };
  
  return (
    <>
      <Tooltip title="Notificações">
        <IconButton 
          color="inherit" 
          onClick={handleOpenMenu}
          sx={{ color: '#4966f2' }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            width: 360,
            maxWidth: '100%',
            maxHeight: 500,
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
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={wsConnected ? 'Online' : 'Offline'} 
              size="small"
              sx={{ 
                bgcolor: wsConnected ? '#e8f5e9' : '#ffebee', 
                color: wsConnected ? '#2e7d32' : '#c62828',
                fontSize: '0.7rem',
                height: '20px'
              }}
            />
            
            {unreadCount > 0 && (
              <Button 
                size="small"
                variant="text"
                sx={{ color: '#4966f2', textTransform: 'none', minWidth: 'auto', p: 0.5 }}
                onClick={handleClearAll}
              >
                Limpar
              </Button>
            )}
            
            <Tooltip title="Atualizar notificações">
              <IconButton 
                size="small" 
                onClick={refreshNotifications}
                disabled={loading}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length > 0 ? (
          <List disablePadding>
            {notifications.slice(0, 10).map((notification) => (
              <React.Fragment key={notification.id || Math.random()}>
                <ListItem 
                  button 
                  onClick={() => handleNotificationClick(notification)}
                  sx={{ 
                    bgcolor: notification.read ? 'transparent' : 'rgba(73, 102, 242, 0.08)',
                    py: 1.5,
                    '&:hover': {
                      bgcolor: notification.read ? 'rgba(0, 0, 0, 0.04)' : 'rgba(73, 102, 242, 0.12)'
                    }
                  }}
                >
                  <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
                    {getNotificationIcon(notification.type)}
                  </Box>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: notification.read ? 'normal' : 'medium',
                            flex: 1
                          }}
                        >
                          {notification.message}
                        </Typography>
                        {!notification.read && (
                          <FiberManualRecordIcon 
                            sx={{ 
                              fontSize: '8px', 
                              color: '#4966f2' 
                            }} 
                          />
                        )}
                      </Box>
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
            
            {notifications.length > 10 && (
              <ListItem sx={{ justifyContent: 'center', py: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Mostrando 10 de {notifications.length} notificações
                </Typography>
              </ListItem>
            )}
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