import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from './context/AuthContext';

// Layout
import Layout from './components/common/Layout';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChamadosList from './pages/SolicitacoesList';
import ChamadoDetail from './pages/ChamadoDetail';
import ChamadoNew from './pages/NovoChamado';

// Componente para rotas protegidas
const PrivateRoute = ({ children }) => {
  const { auth } = useContext(AuthContext);
  
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Componente para rotas específicas de helpers
const HelperRoute = ({ children }) => {
  const { auth } = useContext(AuthContext);
  
  if (!auth.isAuthenticated || !auth.user.roles.includes('ROLE_HELPER')) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

// Componente para rotas específicas de usuários comuns
const UserRoute = ({ children }) => {
  const { auth } = useContext(AuthContext);
  
  if (!auth.isAuthenticated || auth.user.roles.includes('ROLE_HELPER')) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rotas protegidas dentro do Layout */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="chamados" element={<ChamadosList />} />
          
          <Route path="chamados/:id" element={<ChamadoDetail />} />
          
          <Route path="chamados/new" element={
            <UserRoute>
              <ChamadoNew />
            </UserRoute>
          } />
        </Route>
        
        {/* Redirecionamento para dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;