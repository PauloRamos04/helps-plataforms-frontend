import React, { useState, useContext, useRef } from 'react';
import { 
  Box, Typography, TextField, Button, Paper, 
  FormControl, InputLabel, Select, MenuItem,
  Alert, Snackbar, IconButton, CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { chamadoService } from '../api/chamadoService';
import AuthContext from '../context/AuthContext';
import NotificationsContext from '../context/NotificationsContext';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';

function NovoChamado() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const notificationsContext = useContext(NotificationsContext);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    setor: 'SAC',
    tipoSolicitacao: 'CLIENTE SEM ACESSO A SVA',
    responsavel: 'HELPER 1',
    categoria: 'SUPORTE',
    tipo: 'NORMAL',
    descricao: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    console.log("File selected:", file.name, file.type, file.size);
    
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }
    
    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.onerror = () => {
      console.error("FileReader error:", reader.error);
      setError('Error reading the selected file');
    };
    reader.readAsDataURL(file);
  };
  
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted", { formData, selectedImage });
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (selectedImage) {
        console.log("Submitting with image:", selectedImage.name);
        
        // Create FormData for image upload
        const formDataToSend = new FormData();
        formDataToSend.append('titulo', formData.tipoSolicitacao);
        formDataToSend.append('descricao', formData.descricao);
        formDataToSend.append('categoria', formData.categoria);
        formDataToSend.append('tipo', formData.tipo);
        formDataToSend.append('image', selectedImage);
        
        // Log FormData contents (can't directly log FormData content)
        for (let [key, value] of formDataToSend.entries()) {
          console.log(`FormData field: ${key} = ${value instanceof File ? value.name : value}`);
        }
        
        try {
          response = await chamadoService.createChamadoWithImage(formDataToSend);
          console.log("Image upload response:", response);
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          throw new Error(`Image upload failed: ${uploadError.message || 'Unknown error'}`);
        }
      } else {
        console.log("Submitting without image");
        response = await chamadoService.createChamado({
          titulo: formData.tipoSolicitacao,
          descricao: formData.descricao,
          setor: formData.setor,
          responsavel: formData.responsavel,
          categoria: formData.categoria,
          tipo: formData.tipo
        });
        console.log("Normal submission response:", response);
      }
      
      console.log("Submission successful:", response);
      setOpenSnackbar(true);
      
      // Add notification
      if (notificationsContext && typeof notificationsContext.addNotification === 'function') {
        try {
          notificationsContext.addNotification({
            message: `New ticket created: ${formData.tipoSolicitacao}`,
            type: 'NOVO_CHAMADO',
            read: false,
            chamadoId: response.id || 1,
            createdAt: new Date().toISOString(),
            categoria: formData.categoria,
            prioridade: formData.tipo
          });
        } catch (notifError) {
          console.warn("Failed to add notification:", notifError);
        }
      }
      
      // Navigate after a brief delay
      setTimeout(() => {
        navigate('/chamados');
      }, 1500);
    } catch (error) {
      console.error('Error creating ticket:', error);
      setError(`Error creating ticket: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const CustomSelect = ({ name, label, value, options, onChange }) => (
    <Box sx={{ mb: 2 }}>
      <FormControl fullWidth size="small">
        <InputLabel id={`${name}-label`}>
          {label}
        </InputLabel>
        <Select
          labelId={`${name}-label`}
          name={name}
          value={value}
          label={label}
          onChange={onChange}
          sx={{ bgcolor: 'white', borderRadius: '4px' }}
        >
          {options.map(option => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: '8px',
          p: 3,
          mb: 3
        }}
      >
        <Typography variant="h6" component="h1" sx={{ mb: 3, fontWeight: 'medium' }}>
          New Ticket
        </Typography>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <CustomSelect 
            name="setor"
            label="Department"
            value={formData.setor}
            options={['SAC']}
            onChange={handleChange}
          />
          
          <CustomSelect 
            name="tipoSolicitacao"
            label="Request"
            value={formData.tipoSolicitacao}
            options={['CLIENTE SEM ACESSO A SVA']}
            onChange={handleChange}
          />
          
          <CustomSelect 
            name="responsavel"
            label="Responsible"
            value={formData.responsavel}
            options={['HELPER 1', 'HELPER 2']}
            onChange={handleChange}
          />
          
          <CustomSelect 
            name="categoria"
            label="Category"
            value={formData.categoria}
            options={['SUPORTE', 'FINANCEIRO', 'TÉCNICO']}
            onChange={handleChange}
          />
          
          <CustomSelect 
            name="tipo"
            label="Type"
            value={formData.tipo}
            options={['NORMAL', 'URGENTE', 'PRIORITÁRIO']}
            onChange={handleChange}
          />
          
          <Box 
            sx={{ 
              p: 3, 
              bgcolor: '#f5f5f5', 
              borderRadius: '4px',
              minHeight: '200px',
              mb: 3
            }}
          >
            <TextField
              fullWidth
              multiline
              rows={6}
              placeholder="Describe your request here..."
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              variant="outlined"
              sx={{ 
                '.MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: '4px'
                }
              }}
            />
            
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <input
                type="file"
                id="file-upload"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                ref={fileInputRef}
              />
              
              <Button
                variant="outlined"
                startIcon={<AttachFileIcon />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ 
                  textTransform: 'none',
                  borderColor: '#e0e0e0',
                  color: '#666'
                }}
              >
                Attach Image
              </Button>
              
              {imagePreview && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <Box sx={{ position: 'relative', mr: 2 }}>
                    <img 
                      src={imagePreview} 
                      alt="Selected" 
                      style={{ 
                        height: '40px', 
                        borderRadius: '4px' 
                      }} 
                    />
                    <IconButton 
                      size="small" 
                      onClick={handleRemoveImage}
                      sx={{ 
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="caption">
                    {selectedImage?.name}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              sx={{ 
                bgcolor: '#4966f2',
                borderRadius: '4px',
                textTransform: 'none',
                px: 3
              }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Send'
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Ticket created successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default NovoChamado;