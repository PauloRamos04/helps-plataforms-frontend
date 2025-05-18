import React, { useState, useContext, useRef } from 'react';
import {
  Box, Typography, TextField, Button, Paper,
  FormControl, InputLabel, Select, MenuItem,
  Alert, Snackbar, IconButton, CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import AuthContext from '../context/AuthContext';
import NotificationsContext from '../context/NotificationsContext';
import { ticketService } from '../services/ticketService';
import PageHeader from '../components/common/PageHeader';
import { validateRequired } from '../utils/validationUtils';

function NewTicket() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const notificationsContext = useContext(NotificationsContext);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  });

  const [errors, setErrors] = useState({});
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
    
    // Clear the error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Apenas arquivos de imagem são permitidos');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('O arquivo deve ter menos de 5MB');
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.onerror = () => {
      console.error("Erro ao ler o arquivo:", reader.error);
      setError('Erro ao ler o arquivo selecionado');
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

  const validateForm = () => {
    const newErrors = {};
    
    // Validate title
    const titleError = validateRequired(formData.title, 'Título');
    if (titleError) newErrors.title = titleError;
    
    // Check title length
    if (formData.title && (formData.title.length < 5 || formData.title.length > 100)) {
      newErrors.title = "O título deve ter entre 5 e 100 caracteres";
    }
    
    // Validate description
    const descriptionError = validateRequired(formData.description, 'Descrição');
    if (descriptionError) newErrors.description = descriptionError;
    
    // Check description length
    if (formData.description && (formData.description.length < 10 || formData.description.length > 1000)) {
      newErrors.description = "A descrição deve ter entre 10 e 1000 caracteres";
    }
    
    // Validate category
    const categoryError = validateRequired(formData.category, 'Categoria');
    if (categoryError) newErrors.category = categoryError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create FormData to match the expected backend format
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);

      // Only append image if one is selected
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      // Call the appropriate endpoint
      const response = await ticketService.createTicketWithImage(formDataToSend);

      setOpenSnackbar(true);

      // Add notification if context is available
      if (notificationsContext && typeof notificationsContext.addNotification === 'function') {
        try {
          notificationsContext.addNotification({
            message: `Novo chamado criado: ${formData.title}`,
            type: 'NOVO_CHAMADO',
            read: false,
            chamadoId: response.id,
            createdAt: new Date().toISOString(),
            categoria: formData.category
          });
        } catch (notifError) {
          console.warn("Falha ao adicionar notificação:", notifError);
        }
      }

      // Navigate after a brief delay
      setTimeout(() => {
        navigate('/tickets');
      }, 1500);
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      setError(`Erro ao criar chamado: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

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
        <PageHeader 
          title="Novo Chamado" 
          backUrl="/tickets"
        />

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
          {/* Title field */}
          <TextField
            fullWidth
            label="Título"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
            required
            inputProps={{ minLength: 5, maxLength: 100 }}
            helperText={errors.title || "O título deve ter entre 5-100 caracteres"}
            error={!!errors.title}
            sx={{ mb: 2, '.MuiOutlinedInput-root': { bgcolor: 'white' } }}
          />

          {/* Category field */}
          <FormControl fullWidth margin="normal" sx={{ mb: 2 }} error={!!errors.category}>
            <InputLabel id="category-label">Categoria *</InputLabel>
            <Select
              labelId="category-label"
              name="category"
              value={formData.category}
              onChange={handleChange}
              label="Categoria *"
              required
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="">Selecione uma categoria</MenuItem>
              <MenuItem value="SUPORTE">SUPORTE</MenuItem>
              <MenuItem value="FINANCEIRO">FINANCEIRO</MenuItem>
              <MenuItem value="TÉCNICO">TÉCNICO</MenuItem>
            </Select>
            {errors.category && (
              <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                {errors.category}
              </Typography>
            )}
          </FormControl>

          {/* Description field */}
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
              label="Descrição"
              placeholder="Descreva sua solicitação aqui..."
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              inputProps={{ minLength: 10, maxLength: 1000 }}
              helperText={errors.description || "A descrição deve ter entre 10-1000 caracteres"}
              error={!!errors.description}
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
                Anexar Imagem
              </Button>

              {imagePreview && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <Box sx={{ position: 'relative', mr: 2 }}>
                    <img
                      src={imagePreview}
                      alt="Selecionada"
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
                'Enviar Chamado'
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
          Chamado criado com sucesso!
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default NewTicket;