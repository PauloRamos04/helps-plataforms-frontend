// src/routes.js
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout'; // Caminho atualizado
import Login from './pages/Login';
import PrivateRoute from './components/auth/PrivateRoute'; // Caminho atualizado
import LoadingFallback from './components/common/LoadingFallback';

// Lazy loading de componentes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TicketsList = lazy(() => import('./pages/TicketsList')); // Nome atualizado
const TicketDetail = lazy(() => import('./pages/TicketDetail')); // Nome atualizado
const NewTicket = lazy(() => import('./pages/NewTicket')); // Nome atualizado
const UserManagement = lazy(() => import('./pages/UserManagement')); // Nome atualizado

const AppRoutes = () => {
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
          
          <Route path="dashboard" element={
            <Suspense fallback={<LoadingFallback />}>
              <Dashboard />
            </Suspense>
          } />
          
          <Route path="tickets" element={
            <Suspense fallback={<LoadingFallback />}>
              <TicketsList />
            </Suspense>
          } />
          
          <Route path="tickets/:id" element={
            <Suspense fallback={<LoadingFallback />}>
              <TicketDetail />
            </Suspense>
          } />
          
          <Route path="tickets/new" element={
            <Suspense fallback={<LoadingFallback />}>
              <NewTicket />
            </Suspense>
          } />
          
          <Route path="admin/users" element={
            <PrivateRoute requiredRole="ADMIN">
              <Suspense fallback={<LoadingFallback />}>
                <UserManagement />
              </Suspense>
            </PrivateRoute>
          } />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;