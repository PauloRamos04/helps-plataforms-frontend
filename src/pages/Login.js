import React, { useState, useContext, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField,
  Button, Alert, CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import alaresLogo from '../assets/alares.png';
import { validateRequired, validateUsername, validatePassword } from '../utils/validationUtils';

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

      const result = await login(formData);

      if (result.success) {
        navigate('/dashboard');
      } else {
        setLoginError(result.message || 'Credenciais inválidas');
      }
    } catch (error) {
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
      bgcolor: '#121212',
      backgroundImage: 'radial-gradient(circle at 50% 70%, rgba(73, 102, 242, 0.1), transparent 75%)',
    }}>
      <Paper
        elevation={10}
        sx={{
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 5,
          py: 6,
          backgroundColor: 'rgba(255, 255, 255, 0.97)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '4px',
            background: 'linear-gradient(90deg, #4966f2 0%, #8C52FF 100%)',
          }
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <Box
            component="img"
            src={alaresLogo}
            alt="Alares Logo"
            sx={{
              height: 70, 
              width: 'auto',
              borderRadius: '8px',
            }}
          />
        </Box>

        {/* Title */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 900,
              color: '#303030',
              mb: 0.5,
              fontFamily: '"Poppins", "Roboto", sans-serif'
            }}
          >
            Ei, dá um
          </Typography>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 900,
              color: '#4966f2',
              background: 'linear-gradient(45deg, #4966f2, #8C52FF)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: '"Poppins", "Roboto", sans-serif'
            }}
          >
            Helps!
          </Typography>
        </Box>

        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          {loginError && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: '10px',
                '& .MuiAlert-icon': {
                  color: '#ff3d71'
                }
              }}
            >
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
            error={!!errors.username}
            helperText={errors.username}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 245, 245, 0.9)',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4966f2',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4966f2',
                  borderWidth: '2px',
                },
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
            error={!!errors.password}
            helperText={errors.password}
            sx={{
              mb: 4,
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 245, 245, 0.9)',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4966f2',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4966f2',
                  borderWidth: '2px',
                },
              }
            }}
          />

          {/* Login button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.5,
              background: 'linear-gradient(45deg, #4966f2, #8C52FF)',
              borderRadius: '10px',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(73, 102, 242, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(73, 102, 242, 0.4)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default Login;