// src/routes.js - ATUALIZAR o arquivo existente
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import PrivateRoute from './components/auth/PrivateRoute';
import LoadingFallback from './components/common/LoadingFallback';

// Lazy loading de componentes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TicketsList = lazy(() => import('./pages/TicketsList'));
const TicketDetail = lazy(() => import('./pages/TicketDetail'));
const NewTicket = lazy(() => import('./pages/NewTicket'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs')); // NOVA IMPORTAÇÃO

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

          {/* NOVA ROTA - Logs de Atividade */}
          <Route path="admin/activity" element={
            <PrivateRoute requiredRole="ADMIN">
              <Suspense fallback={<LoadingFallback />}>
                <ActivityLogs />
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