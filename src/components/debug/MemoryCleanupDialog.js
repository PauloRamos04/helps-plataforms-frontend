import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const MemoryCleanupDialog = ({ open, onClose, onConfirm, loading }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Confirmar Limpeza de Memória
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Atenção:</strong> Esta ação irá forçar a limpeza de memória da aplicação.
          </Typography>
          <Typography variant="body2">
            • A operação pode causar uma breve pausa no sistema<br/>
            • Objetos não utilizados serão removidos da memória<br/>
            • Esta ação é recomendada apenas quando necessário
          </Typography>
        </Alert>
        
        <Typography variant="body2" color="text.secondary">
          Deseja continuar com a limpeza de memória?
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="warning"
          disabled={loading}
        >
          {loading ? 'Executando...' : 'Confirmar Limpeza'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MemoryCleanupDialog;
