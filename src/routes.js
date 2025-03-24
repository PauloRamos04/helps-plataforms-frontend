import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/common/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChamadosList from './pages/SolicitacoesList';
import ChamadoDetail from './pages/ChamadoDetail';
import ChamadoNew from './pages/NovoChamado';
import GerenciaUser from './pages/GerenciaUser';

import AuthContext from './context/AuthContext';
import PrivateRoute from './context/PrivateRoute';

const AppRoutes = () => {
  const { auth } = useContext(AuthContext);
  
  const isAdmin = () => {
    return auth.user?.roles?.some(role => 
      role === 'ADMIN' || 
      role === 'ROLE_ADMIN'
    );
  };
  
  const isHelper = () => {
    return auth.user?.roles?.some(role => 
      role === 'HELPER' || 
      role === 'ROLE_HELPER'
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chamados" element={<ChamadosList />} />
          <Route path="chamados/:id" element={<ChamadoDetail />} />
          <Route path="chamados/new" element={<ChamadoNew />} />
          <Route path="novo-chamado" element={<ChamadoNew />} />
          
          <Route path="admin/usuarios" element={
            isAdmin() ? <GerenciaUser /> : <Navigate to="/dashboard" replace />
          } />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;