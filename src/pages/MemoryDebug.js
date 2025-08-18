import {
  Refresh as RefreshIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Alert,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Divider,
  Stack
} from '@mui/material';
import React, { useState } from 'react';

import MemoryChart from '../components/debug/MemoryChart';
import MemoryCleanupDialog from '../components/debug/MemoryCleanupDialog';
import { useMemoryDebug } from '../hooks/useMemoryDebug';

const MemoryDebug = () => {
  const {
    memoryStats,
    detailedInfo,
    loading,
    error,
    lastUpdate,
    executeCleanup,
    refreshAll
  } = useMemoryDebug();

  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);

  const handleCleanupClick = () => {
    setCleanupDialogOpen(true);
  };

  const handleCleanupConfirm = async () => {
    setCleanupDialogOpen(false);
    setCleanupLoading(true);
    try {
      await executeCleanup();
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleCleanupCancel = () => {
    setCleanupDialogOpen(false);
  };

  const getMemoryStatus = (usagePercentage) => {
    if (usagePercentage >= 90) return { color: 'error', icon: <ErrorIcon />, label: 'Crítico' };
    if (usagePercentage >= 75) return { color: 'warning', icon: <WarningIcon />, label: 'Alto' };
    if (usagePercentage >= 50) return { color: 'info', icon: <InfoIcon />, label: 'Moderado' };
    return { color: 'success', icon: <CheckCircleIcon />, label: 'Normal' };
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={refreshAll}
          startIcon={<RefreshIcon />}
        >
          Tentar novamente
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Debug de Memória
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitoramento e gerenciamento de memória da aplicação
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={refreshAll}
            disabled={loading}
            startIcon={<RefreshIcon />}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleCleanupClick}
            disabled={loading || cleanupLoading}
            startIcon={<StorageIcon />}
          >
            {cleanupLoading ? 'Executando...' : 'Limpar Memória'}
          </Button>
        </Stack>
      </Box>

      {lastUpdate && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Última atualização: {formatTimestamp(lastUpdate)}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      <Grid container spacing={3}>
        {/* Estatísticas de Memória Heap */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MemoryIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Memória Heap</Typography>
              </Box>
              
              {memoryStats ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Uso: {memoryStats.heapUsedMB?.toFixed(2)} MB</Typography>
                      <Typography variant="body2">Máximo: {memoryStats.heapMaxMB?.toFixed(2)} MB</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={memoryStats.heapUsagePercentage || 0}
                      color={getMemoryStatus(memoryStats.heapUsagePercentage || 0).color}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {memoryStats.heapUsagePercentage?.toFixed(1)}% utilizado
                      </Typography>
                      <Chip
                        size="small"
                        icon={getMemoryStatus(memoryStats.heapUsagePercentage || 0).icon}
                        label={getMemoryStatus(memoryStats.heapUsagePercentage || 0).label}
                        color={getMemoryStatus(memoryStats.heapUsagePercentage || 0).color}
                      />
                    </Box>
                  </Box>
                </>
              ) : (
                <Typography color="text.secondary">Carregando...</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Estatísticas de Memória Non-Heap */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Memória Non-Heap</Typography>
              </Box>
              
              {memoryStats ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Uso: {memoryStats.nonHeapUsedMB?.toFixed(2)} MB</Typography>
                      <Typography variant="body2">Máximo: {memoryStats.nonHeapMaxMB?.toFixed(2)} MB</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={memoryStats.nonHeapUsagePercentage || 0}
                      color={getMemoryStatus(memoryStats.nonHeapUsagePercentage || 0).color}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {memoryStats.nonHeapUsagePercentage?.toFixed(1)}% utilizado
                      </Typography>
                      <Chip
                        size="small"
                        icon={getMemoryStatus(memoryStats.nonHeapUsagePercentage || 0).icon}
                        label={getMemoryStatus(memoryStats.nonHeapUsagePercentage || 0).label}
                        color={getMemoryStatus(memoryStats.nonHeapUsagePercentage || 0).color}
                      />
                    </Box>
                  </Box>
                </>
              ) : (
                <Typography color="text.secondary">Carregando...</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Informações do Sistema */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Informações do Sistema</Typography>
              </Box>
              
              {detailedInfo ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Memória do Sistema</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell>Memória Total</TableCell>
                              <TableCell>{detailedInfo.totalMemoryMB?.toFixed(2)} MB</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Memória Livre</TableCell>
                              <TableCell>{detailedInfo.freeMemoryMB?.toFixed(2)} MB</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Memória Usada</TableCell>
                              <TableCell>{detailedInfo.usedMemoryMB?.toFixed(2)} MB</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Memória Máxima</TableCell>
                              <TableCell>{detailedInfo.maxMemoryMB?.toFixed(2)} MB</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Processadores</TableCell>
                              <TableCell>{detailedInfo.availableProcessors}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Propriedades Java/OS</Typography>
                      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {Object.entries(detailedInfo)
                          .filter(([key]) => key.startsWith('java.') || key.startsWith('os.'))
                          .map(([key, value]) => (
                            <Box key={key} sx={{ mb: 1, pb: 1, borderBottom: '1px solid #eee' }}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {key}
                              </Typography>
                              <Typography variant="body2">
                                {String(value)}
                              </Typography>
                            </Box>
                          ))}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary">Carregando...</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Informações Gerais */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Informações Gerais</Typography>
              
              {memoryStats ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="primary">
                        {memoryStats.uptimeSeconds ? Math.floor(memoryStats.uptimeSeconds / 3600) : 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Horas de Uptime
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="secondary">
                        {memoryStats.timestamp ? formatTimestamp(memoryStats.timestamp) : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Última Coleta
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="info.main">
                        {memoryStats.heapUsedMB ? (memoryStats.heapUsedMB + memoryStats.nonHeapUsedMB).toFixed(2) : 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Usado (MB)
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="success.main">
                        {memoryStats.heapMaxMB ? (memoryStats.heapMaxMB + memoryStats.nonHeapMaxMB).toFixed(2) : 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Máximo (MB)
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary">Carregando...</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de Memória */}
        <Grid item xs={12}>
          <MemoryChart memoryStats={memoryStats} detailedInfo={detailedInfo} />
        </Grid>
      </Grid>

      {/* Diálogo de confirmação */}
      <MemoryCleanupDialog
        open={cleanupDialogOpen}
        onClose={handleCleanupCancel}
        onConfirm={handleCleanupConfirm}
        loading={cleanupLoading}
      />
    </Box>
  );
};

export default MemoryDebug;
