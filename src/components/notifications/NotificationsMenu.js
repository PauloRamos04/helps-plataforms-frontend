import React, { useState, useContext } from 'react';
import {
  Badge, IconButton, Menu, MenuItem, Typography, Box, 
  Divider, List, ListItem, ListItemText, CircularProgress,
  Button, Tooltip, Chip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import NotificationsContext from '../../context/NotificationsContext';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NOVO_CHAMADO':
        return <InfoIcon fontSize="small" color="primary" />;
      case 'CHAMADO_EM_ATENDIMENTO':
        return <WarningIcon fontSize="small" color="warning" />;
      case 'CHAMADO_FECHADO':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'NOVA_MENSAGEM':
        return <InfoIcon fontSize="small" color="info" />;
      default:
        return <InfoIcon fontSize="small" color="action" />;
    }
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
            width: 320,
            maxWidth: '100%',
            maxHeight: 450,
            overflowY: 'auto'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="medium">
            Notificações
            {wsConnected && (
              <Chip 
                size="small"
                label="Online" 
                color="success" 
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Typography>
          
          <Box>
            {unreadCount > 0 && (
              <Button 
                size="small"
                variant="text"
                sx={{ color: '#4966f2', textTransform: 'none', mr: 1 }}
                onClick={handleMarkAllAsRead}
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
            
            <Tooltip title="Teste: Adicionar notificação">
              <IconButton 
                size="small" 
                onClick={addDummyNotification}
                disabled={loading}
                color="primary"
              >
                <AddIcon fontSize="small" />
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
            {notifications.map((notification) => (
              <React.Fragment key={notification.id || Math.random()}>
                <ListItem 
                  button 
                  onClick={() => handleNotificationClick(notification)}
                  sx={{ 
                    bgcolor: notification.read ? 'transparent' : 'rgba(73, 102, 242, 0.1)',
                    py: 1.5
                  }}
                >
                  <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
                    {getNotificationIcon(notification.type)}
                  </Box>
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