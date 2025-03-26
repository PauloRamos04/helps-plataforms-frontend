import React, { useState, useContext, useEffect } from 'react';
import { 
  Box, Container, Typography, Paper, TextField, 
  Button, Link, Alert, CircularProgress 
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

// Define validation functions directly in this component
const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} é obrigatório`;
  }
  return '';
};

const validateUsername = (value) => {
  if (!value) return '';
  
  if (value.length < 3) {
    return 'Nome de usuário deve ter pelo menos 3 caracteres';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return 'Nome de usuário deve conter apenas letras, números e underscores';
  }
  
  return '';
};

function Login() {
  const navigate = useNavigate();
  const { auth, login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/dashboard');
    }
  }, [auth.isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear the error for this field when the user changes it
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Username validation
    const usernameError = validateRequired(formData.username, 'Nome de usuário') || 
                          validateUsername(formData.username);
    if (usernameError) newErrors.username = usernameError;
    
    // Password validation
    const passwordError = validateRequired(formData.password, 'Senha');
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    if (!validate()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Create login request object as expected by the backend
      const loginRequest = {
        username: formData.username,
        password: formData.password
      };
      
      // Send login request to backend
      const result = await login(loginRequest);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setLoginError(result.message || 'Credenciais inválidas');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Ocorreu um erro durante o login. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      bgcolor: '#1a1a1a' // Dark background as in screenshot
    }}>
      <Paper 
        elevation={3} 
        sx={{ 
          width: '100%', 
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 3
        }}
      >
        {/* Logo */}
        <Box 
          component="span"
          sx={{ 
            color: 'white', 
            fontWeight: 'bold', 
            fontSize: '18px',
            bgcolor: '#4966f2', 
            px: 1.5,
            py: 0.3,
            borderRadius: '4px',
            mb: 3
          }}
        >
          alares
          <Box component="span" sx={{ ml: 0.5, fontSize: '16px' }}>➚</Box>
        </Box>
        
        {/* Title "Ei, dá um Helps!" */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h5" component="h1" sx={{ color: '#333', fontWeight: 'bold' }}>
            Ei, dá um
          </Typography>
          <Typography variant="h5" component="h1" sx={{ color: '#4966f2', fontWeight: 'bold' }}>
            Helps!
          </Typography>
        </Box>
        
        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          {loginError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loginError}
            </Alert>
          )}
          
          {/* Username field */}
          <TextField
            fullWidth
            placeholder="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            variant="outlined"
            size="small"
            sx={{ mb: 2 }}
            error={!!errors.username}
            helperText={errors.username}
            InputProps={{
              sx: {
                borderRadius: '4px',
                bgcolor: '#f5f5f5'
              }
            }}
          />
          
          {/* Password field */}
          <TextField
            fullWidth
            placeholder="Senha"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            variant="outlined"
            size="small"
            sx={{ mb: 3 }}
            error={!!errors.password}
            helperText={errors.password}
            InputProps={{
              sx: {
                borderRadius: '4px',
                bgcolor: '#f5f5f5'
              }
            }}
          />
          
          {/* Login button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ 
              bgcolor: '#4966f2',
              borderRadius: '4px',
              textTransform: 'none',
              py: 1
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Entrar'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default Login;