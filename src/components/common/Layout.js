import React, { useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import AuthContext from '../../context/AuthContext';

// Logo da Alares com o "Helps!"
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

// Sidebar Menu Item
const MenuItem = ({ to, active, children }) => (
  <Box
    component={Link}
    to={to}
    sx={{
      display: 'block',
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
    {children}
  </Box>
);

// Componente principal de Layout
function Layout() {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determinar qual página está ativa baseado na URL atual
  const pathname = window.location.pathname;
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 250,
          bgcolor: '#4966f2', // Cor azul do sidebar como nas screenshots
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          p: 2,
        }}
      >
        {/* User Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, mt: 1 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              bgcolor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              color: '#4966f2',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            {auth?.user?.name?.charAt(0) || 'P'}
          </Box>
          <Box component="span" sx={{ fontSize: '14px', fontWeight: 'medium' }}>
            {auth?.user?.name || 'PAULOFR'}
          </Box>
        </Box>
        
        {/* Menu Items */}
        <Box sx={{ flex: 1 }}>
          <MenuItem to="/dashboard" active={pathname === '/dashboard'}>
            Página inicial
          </MenuItem>
          <MenuItem to="/chamados/new" active={pathname === '/chamados/new'}>
            Novo chamado
          </MenuItem>
          <MenuItem to="/chamados" active={pathname === '/chamados'}>
            Meus chamados
          </MenuItem>
          <MenuItem to="/metricas" active={pathname === '/metricas'}>
            Minhas métricas
          </MenuItem>
        </Box>
        
        {/* Logo and Logout at bottom */}
        <Box sx={{ mt: 'auto' }}>
          <Logo />
          <Box
            component="button"
            onClick={handleLogout}
            sx={{
              display: 'block',
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
            Sair
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          bgcolor: '#f5f5f5',
          overflow: 'auto'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;