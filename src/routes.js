import React, { useContext, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/common/Layout';
import Login from './pages/Login';
import AuthContext from './context/AuthContext';
import PrivateRoute from './context/PrivateRoute';

// Loading component para mostrar durante o carregamento lazy
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 'calc(100vh - 64px)'
  }}>
    <div className="loading-spinner"></div>
  </div>
);

// Lazy loading de componentes para melhorar performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ChamadosList = lazy(() => import('./pages/SolicitacoesList'));
const ChamadoDetail = lazy(() => import('./pages/ChamadoDetail'));
const ChamadoNew = lazy(() => import('./pages/NovoChamado'));
const GerenciaUser = lazy(() => import('./pages/GerenciaUser'));

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
          
          {/* Rotas com Lazy Loading */}
          <Route path="dashboard" element={
            <Suspense fallback={<LoadingFallback />}>
              <Dashboard />
            </Suspense>
          } />
          
          <Route path="chamados" element={
            <Suspense fallback={<LoadingFallback />}>
              <ChamadosList />
            </Suspense>
          } />
          
          <Route path="chamados/:id" element={
            <Suspense fallback={<LoadingFallback />}>
              <ChamadoDetail />
            </Suspense>
          } />
          
          <Route path="chamados/new" element={
            <Suspense fallback={<LoadingFallback />}>
              <ChamadoNew />
            </Suspense>
          } />
          
          <Route path="novo-chamado" element={
            <Suspense fallback={<LoadingFallback />}>
              <ChamadoNew />
            </Suspense>
          } />
          
          <Route path="admin/usuarios" element={
            isAdmin() ? (
              <Suspense fallback={<LoadingFallback />}>
                <GerenciaUser />
              </Suspense>
            ) : <Navigate to="/dashboard" replace />
          } />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;