import React, { useState, useContext } from 'react';
import { 
  Box, Container, Typography, Paper, TextField, 
  Button, Link, Alert, CircularProgress, FormControl,
  InputLabel, Select, MenuItem
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

function Register() {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: '',
    password: '', // Alterado de 'senha' para 'password' para corresponder ao back-end
    confirmarPassword: '', // Atualizado para manter consistência
    tipoRegistro: 'OPERADOR' // Adicionado para escolher o tipo de usuário
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpa o erro desse campo quando o usuário digita
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'O nome de usuário é obrigatório';
    } else if (formData.username.length < 3) {
      newErrors.username = 'O nome de usuário deve ter pelo menos 3 caracteres';
    }
    
    if (!formData.password) {
      newErrors.password = 'A senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }
    
    if (formData.password !== formData.confirmarPassword) {
      newErrors.confirmarPassword = 'As senhas não coincidem';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setSuccess(false);
    
    if (!validate()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Criando o objeto de requisição conforme esperado pelo back-end
      const userData = {
        username: formData.username,
        password: formData.password
      };
      
      // Determinando o endpoint correto com base no tipo de registro
      let result;
      if (formData.tipoRegistro === 'HELPER') {
        result = await register(userData, '/register/helper');
      } else {
        // Para usuários padrão (operadores)
        result = await register(userData, '/users');
      }
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setRegisterError(result.message || 'Erro ao registrar usuário');
      }
    } catch (error) {
      console.error('Erro de registro:', error);
      setRegisterError('Ocorreu um erro durante o registro. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
          Helps Platform
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h2" variant="h5" sx={{ mb: 2, textAlign: 'center' }}>
            Registro
          </Typography>
          
          {registerError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {registerError}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Registro realizado com sucesso! Redirecionando para o login...
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>            
            <TextField
              fullWidth
              label="Nome de Usuário"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              error={!!errors.username}
              helperText={errors.username}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="tipo-registro-label">Tipo de Usuário</InputLabel>
              <Select
                labelId="tipo-registro-label"
                id="tipoRegistro"
                name="tipoRegistro"
                value={formData.tipoRegistro}
                onChange={handleChange}
                label="Tipo de Usuário"
              >
                <MenuItem value="OPERADOR">Operador</MenuItem>
                <MenuItem value="HELPER">Helper</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Senha"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              error={!!errors.password}
              helperText={errors.password}
            />
            
            <TextField
              fullWidth
              label="Confirmar Senha"
              name="confirmarPassword"
              type="password"
              value={formData.confirmarPassword}
              onChange={handleChange}
              margin="normal"
              error={!!errors.confirmarPassword}
              helperText={errors.confirmarPassword}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Registrar'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Já tem uma conta? Faça login
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

export default Register;