import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Box, Divider, Typography, 
  IconButton 
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import AuthContext from '../../context/AuthContext';
import alaresLogo from '../../assets/alares.png';

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

const Logo = () => (
  <Box
    sx={{
      mb: 4,
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
    }}
  >
    <Box
      component="img"
      src={alaresLogo}
      alt="Alares Logo"
      sx={{
        height: 70, 
        width: 'auto',
        borderRadius: '8px',
      }}
    />
  </Box>
);

function Sidebar() {
  const { auth, logout } = useContext(AuthContext);
  const location = useLocation();
  
  const isAdmin = auth?.user?.roles?.includes('ADMIN') || 
                  auth?.user?.roles?.includes('ROLE_ADMIN');
  
  const handleLogout = (e) => {
    e.preventDefault();
    logout();
  };

  const pathname = location.pathname;
  
  return (
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
      <Logo />
      
      <Box sx={{ flex: 1 }}>
        <MenuItem 
          to="/dashboard" 
          active={pathname === '/dashboard'}
          icon={<HomeIcon fontSize="small" />}
        >
          Página inicial
        </MenuItem>
        
        <MenuItem 
          to="/tickets/new" 
          active={pathname === '/tickets/new'}
          icon={<AddIcon fontSize="small" />}
        >
          Novo chamado
        </MenuItem>
        
        <MenuItem 
          to="/tickets" 
          active={pathname === '/tickets' || (pathname.startsWith('/tickets/') && pathname !== '/tickets/new')}
          icon={<ListIcon fontSize="small" />}
        >
          Meus chamados
        </MenuItem>
        
        <MenuItem 
          to="/metrics" 
          active={pathname === '/metrics'}
          icon={<BarChartIcon fontSize="small" />}
        >
          Minhas métricas
        </MenuItem>
        
        {isAdmin && (
          <>
            <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <Box sx={{ px: 2, py: 1, fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Administração
            </Box>
            
            <MenuItem 
              to="/admin/users" 
              active={pathname === '/admin/users'}
              icon={<PersonAddIcon fontSize="small" />}
            >
              Gerenciar Usuários
            </MenuItem>

            <MenuItem 
              to="/admin/activity" 
              active={pathname === '/admin/activity'}
              icon={<AssessmentIcon fontSize="small" />}
            >
              Logs de Atividade
            </MenuItem>

            <MenuItem 
              to="/admin/audit" 
              active={pathname === '/admin/audit'}
              icon={<SearchIcon fontSize="small" />}
            >
              Auditoria
            </MenuItem>
          </>
        )}
      </Box>
      
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
            borderRadius: '4px',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
          Sair
        </Box>
      </Box>
    </Box>
  );
}

export default Sidebar;