import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../api';

export const useDashboard = (refreshInterval = 30000) => {
  const { auth } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardStats = async () => {
    try {
      setError(null);
      const response = await api.get('/dashboard/stats');
      const data = response.data.success ? response.data.data : response.data;
      
      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError('Não foi possível carregar os dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchDashboardStats();

      const interval = setInterval(() => {
        fetchDashboardStats();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [auth.isAuthenticated, refreshInterval]);

  const refreshDashboard = () => {
    setLoading(true);
    fetchDashboardStats();
  };

  const getMetricVariation = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const isHelper = () => {
    return auth.user?.roles?.some(role => 
      role === 'HELPER' || role === 'ROLE_HELPER'
    );
  };

  const isAdmin = () => {
    return auth.user?.roles?.some(role => 
      role === 'ADMIN' || role === 'ROLE_ADMIN'
    );
  };

  const getRelevantStats = () => {
    if (!dashboardData) return null;

    if (isAdmin()) {
      return {
        showAll: true,
        generalStats: dashboardData.generalStats,
        timeStats: dashboardData.timeStats,
        statusDistribution: dashboardData.statusDistribution,
        categoryStats: dashboardData.categoryStats,
        priorityStats: dashboardData.priorityStats,
        weeklyTrends: dashboardData.weeklyTrends,
        helperPerformance: dashboardData.helperPerformance,
        slaStats: dashboardData.slaStats,
        workloadStats: dashboardData.workloadStats
      };
    }

    if (isHelper()) {
      return {
        showHelper: true,
        generalStats: dashboardData.generalStats,
        timeStats: dashboardData.timeStats,
        statusDistribution: dashboardData.statusDistribution,
        categoryStats: dashboardData.categoryStats,
        weeklyTrends: dashboardData.weeklyTrends,
        workloadStats: dashboardData.workloadStats
      };
    }

    return {
      showUser: true,
      generalStats: dashboardData.generalStats,
      timeStats: dashboardData.timeStats,
      workloadStats: dashboardData.workloadStats
    };
  };

  return {
    dashboardData: getRelevantStats(),
    rawData: dashboardData,
    loading,
    error,
    lastUpdated,
    refreshDashboard,
    getMetricVariation,
    isHelper: isHelper(),
    isAdmin: isAdmin()
  };
};