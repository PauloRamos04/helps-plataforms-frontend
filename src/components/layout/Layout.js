import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import AuthContext from '../../context/AuthContext';

function Layout() {
  const { auth } = useContext(AuthContext);
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: '250px',
          mt: '64px',
          bgcolor: '#f5f5f5',
          overflow: 'auto',
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        <TopBar user={auth.user} />
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;