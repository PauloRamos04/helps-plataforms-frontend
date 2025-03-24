// src/components/common/Layout.js
import React, { useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, Avatar, Tooltip, Divider, AppBar, Toolbar, 
  Typography, IconButton 
} from '@mui/material';
import AuthContext from '../../context/AuthContext';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsMenu from '../notifications/NotificationsMenu';

const Logo = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
    <Box 
      component="span"
      sx={{ 
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: '18px',
        bgcolor: '#4966f2', 
        px: 1.5,
        py: 0.3,
        borderRadius: '4px',
        mb: 1
      }}
    >
      alares
      <Box component="span" sx={{ ml: 0.5, fontSize: '16px' }}>➚</Box>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box component="span" sx={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
        Ei, dá um
      </Box>
      <Box component="span" sx={{ color: 'white', fontWeight: 'bold', fontSize: '18px', ml: 1 }}>
        Helps!
      </Box>
      <Box component="span" sx={{ color: 'white', ml: 0.5, fontSize: '16px' }}>➚</Box>
    </Box>
  </Box>
);

const MenuItem = ({ to, active, icon, children }) => (
  <Box
    component={Link}
    to={to}
    sx={{
      display: 'flex',
      alignItems: 'center',
      textDecoration: 'none',
      color: 'white',
      py: 1.5,
      px: 2,
      fontSize: '14px',
      borderRadius: '4px',
      mb: 1,
      bgcolor: active ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
      '&:hover': {
        bgcolor: 'rgba(255, 255, 255, 0.1)',
      }
    }}
  >
    {icon && (
      <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
        {icon}
      </Box>
    )}
    {children}
  </Box>
);

function Layout() {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const isAdmin = auth?.user?.roles?.includes('ADMIN') || 
                  auth?.roles?.includes('ADMIN');

  const getUserName = () => {
    return auth?.user?.name || 
           auth?.user?.username || 
           auth?.user?.nome || 
           auth?.username || 
           auth?.nome ||
           'Usuário';
  };
  
  const getInitial = () => {
    const name = getUserName();
    return name.charAt(0).toUpperCase();
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pathname = location.pathname;
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 250,
          bgcolor: '#4966f2',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100
        }}
      >
        {/* Logo no topo */}
        <Logo />
        
        {/* Menu Items */}
        <Box sx={{ flex: 1 }}>
          <MenuItem 
            to="/dashboard" 
            active={pathname === '/dashboard'}
            icon={<HomeIcon fontSize="small" />}
          >
            Página inicial
          </MenuItem>
          
          <MenuItem 
            to="/chamados/new" 
            active={pathname === '/chamados/new' || pathname === '/novo-chamado'}
            icon={<AddIcon fontSize="small" />}
          >
            Novo chamado
          </MenuItem>
          
          <MenuItem 
            to="/chamados" 
            active={pathname === '/chamados' || (pathname.startsWith('/chamados/') && pathname !== '/chamados/new')}
            icon={<ListIcon fontSize="small" />}
          >
            Meus chamados
          </MenuItem>
          
          <MenuItem 
            to="/metricas" 
            active={pathname === '/metricas'}
            icon={<BarChartIcon fontSize="small" />}
          >
            Minhas métricas
          </MenuItem>
          
          {/* Opção de Gerenciamento de Usuários - apenas para administradores */}
          {isAdmin && (
            <>
              <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
              
              <Box sx={{ px: 2, py: 1, fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Administração
              </Box>
              
              <MenuItem 
                to="/admin/usuarios" 
                active={pathname === '/admin/usuarios' || pathname === '/admin/usuarios/new'}
                icon={<PersonAddIcon fontSize="small" />}
              >
                Gerenciar Usuários
              </MenuItem>
            </>
          )}
        </Box>
        
        {/* Logout at bottom */}
        <Box sx={{ mt: 'auto' }}>
          <Box
            component="button"
            onClick={handleLogout}
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              border: 'none',
              bgcolor: 'transparent',
              color: 'white',
              textAlign: 'left',
              p: 1,
              cursor: 'pointer',
              fontSize: '14px',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            Sair
          </Box>
        </Box>
      </Box>

      {/* Top AppBar */}
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
          {/* Nome do usuário à esquerda */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ color: '#333', fontWeight: 'medium' }}>
              Olá, {getUserName()}
            </Typography>
          </Box>
          
          {/* Notificações e Avatar à direita */}
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

      {/* Content */}
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
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;