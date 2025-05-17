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
    title: '',
    description: '',
    category: '',
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

    // Validate required fields according to DTO constraints
    if (!formData.title || formData.title.length < 5 || formData.title.length > 100) {
      setError("Title is required and must be between 5-100 characters");
      return;
    }

    if (!formData.description || formData.description.length < 10 || formData.description.length > 1000) {
      setError("Description is required and must be between 10-1000 characters");
      return;
    }

    if (!formData.category) {
      setError("Category is required");
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
      formDataToSend.append('openingDate', new Date().toISOString());

      // Only append image if one is selected
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      // Call the appropriate endpoint based on whether an image is included
      const response = await chamadoService.createChamadoWithImage(formDataToSend);

      setOpenSnackbar(true);

      // Add notification
      if (notificationsContext && typeof notificationsContext.addNotification === 'function') {
        try {
          notificationsContext.addNotification({
            message: `New ticket created: ${formData.title}`,
            type: 'NOVO_CHAMADO',
            read: false,
            chamadoId: response.id || 1,
            createdAt: new Date().toISOString(),
            categoria: formData.category
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
          {/* Title field */}
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
            required
            inputProps={{ minLength: 5, maxLength: 100 }}
            helperText="Title must be between 5-100 characters"
            sx={{ mb: 2, '.MuiOutlinedInput-root': { bgcolor: 'white' } }}
          />

          {/* Category field */}
          <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
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
              label="Description"
              placeholder="Describe your request here..."
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              inputProps={{ minLength: 10, maxLength: 1000 }}
              helperText="Description must be between 10-1000 characters"
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
                'Submit Ticket'
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