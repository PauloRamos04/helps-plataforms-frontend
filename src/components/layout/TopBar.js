import React from 'react';
import { AppBar, Toolbar, Typography, Box, Avatar, Tooltip } from '@mui/material';
import NotificationsMenu from '../notifications/NotificationsMenu';

const TopBar = ({ user }) => {
  const getUserName = () => {
    return user?.name || user?.username || 'Usuário';
  };
  
  const getInitial = () => {
    const name = getUserName();
    return name.charAt(0).toUpperCase();
  };
  
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        width: `calc(100% - 250px)`, 
        ml: '250px',
        bgcolor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* User name on the left */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ color: '#333', fontWeight: 'medium' }}>
            Olá, {getUserName()}
          </Typography>
        </Box>
        
        {/* Notifications and Avatar on the right */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <NotificationsMenu />
          
          <Tooltip title={getUserName()}>
            <Avatar
              sx={{
                ml: 2,
                width: 32,
                height: 32,
                bgcolor: '#4966f2',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {getInitial()}
            </Avatar>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;