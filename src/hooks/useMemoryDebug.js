import { useState, useEffect, useCallback } from 'react';
import memoryService from '../services/memoryService';

export const useMemoryDebug = () => {
  const [memoryStats, setMemoryStats] = useState(null);
  const [detailedInfo, setDetailedInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchMemoryStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await memoryService.getMemoryStats();
      setMemoryStats(stats);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetailedInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await memoryService.getDetailedMemoryInfo();
      setDetailedInfo(info);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const executeCleanup = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await memoryService.forceCleanup();
      // Recarregar estatísticas após a limpeza
      await fetchMemoryStats();
      await fetchDetailedInfo();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchMemoryStats, fetchDetailedInfo]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchMemoryStats(), fetchDetailedInfo()]);
  }, [fetchMemoryStats, fetchDetailedInfo]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    memoryStats,
    detailedInfo,
    loading,
    error,
    lastUpdate,
    fetchMemoryStats,
    fetchDetailedInfo,
    executeCleanup,
    refreshAll
  };
};
