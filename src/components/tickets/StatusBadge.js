import React from 'react';
import { Chip } from '@mui/material';

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ABERTO':
        return { bg: '#e3f2fd', color: '#0d47a1' };
      case 'EM_ATENDIMENTO':
        return { bg: '#fff8e1', color: '#ff6f00' };
      case 'FECHADO':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      default:
        return { bg: '#f5f5f5', color: '#616161' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ABERTO':
        return 'ABERTO';
      case 'EM_ATENDIMENTO':
        return 'EM ATENDIMENTO';
      case 'FECHADO':
        return 'FECHADO';
      default:
        return status?.replace('_', ' ') || 'UNKNOWN';
    }
  };

  const { bg, color } = getStatusColor(status);

  return (
    <Chip
      label={getStatusLabel(status)}
      sx={{
        bgcolor: bg,
        color: color,
        fontWeight: 'medium',
        fontSize: '12px'
      }}
      size="small"
    />
  );
};

export default StatusBadge;