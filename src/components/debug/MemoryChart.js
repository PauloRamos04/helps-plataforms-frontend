import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid
} from '@mui/material';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';

const MemoryChart = ({ memoryStats, detailedInfo }) => {
  if (!memoryStats || !detailedInfo) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">Carregando dados...</Typography>
        </CardContent>
      </Card>
    );
  }

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return '#d32f2f';
    if (percentage >= 75) return '#ed6c02';
    if (percentage >= 50) return '#1976d2';
    return '#2e7d32';
  };

  const formatMB = (value) => `${value?.toFixed(2) || '0'} MB`;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TrendingUpIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Análise de Uso de Memória</Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Heap Memory */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Memória Heap
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  {formatMB(memoryStats.heapUsedMB)} / {formatMB(memoryStats.heapMaxMB)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {memoryStats.heapUsagePercentage?.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={memoryStats.heapUsagePercentage || 0}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getUsageColor(memoryStats.heapUsagePercentage || 0),
                    borderRadius: 5
                  }
                }}
              />
            </Box>
          </Grid>

          {/* Non-Heap Memory */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Memória Non-Heap
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  {formatMB(memoryStats.nonHeapUsedMB)} / {formatMB(memoryStats.nonHeapMaxMB)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {memoryStats.nonHeapUsagePercentage?.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={memoryStats.nonHeapUsagePercentage || 0}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getUsageColor(memoryStats.nonHeapUsagePercentage || 0),
                    borderRadius: 5
                  }
                }}
              />
            </Box>
          </Grid>

          {/* System Memory */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Memória do Sistema
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  {formatMB(detailedInfo.usedMemoryMB)} / {formatMB(detailedInfo.totalMemoryMB)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {((detailedInfo.usedMemoryMB / detailedInfo.totalMemoryMB) * 100).toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(detailedInfo.usedMemoryMB / detailedInfo.totalMemoryMB) * 100 || 0}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getUsageColor((detailedInfo.usedMemoryMB / detailedInfo.totalMemoryMB) * 100 || 0),
                    borderRadius: 5
                  }
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Memory Summary */}
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Resumo de Memória
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" display="block">
                Total Disponível
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatMB(detailedInfo.maxMemoryMB)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" display="block">
                Total Alocado
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatMB(detailedInfo.totalMemoryMB)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" display="block">
                Total Usado
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatMB(detailedInfo.usedMemoryMB)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" display="block">
                Livre
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatMB(detailedInfo.freeMemoryMB)}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MemoryChart;
