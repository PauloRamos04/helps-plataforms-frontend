import { useState, useEffect } from 'react';
import { userService } from '../services/userService';

export const useUserForm = (initialUser = null, onSuccess) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'OPERADOR'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});

  // If initialUser is provided, populate the form
  useEffect(() => {
    if (initialUser) {
      setFormData({
        username: initialUser.username || '',
        name: initialUser.name || '',
        password: '',
        role: initialUser.roles && initialUser.roles.length > 0 
          ? initialUser.roles[0].replace('ROLE_', '') 
          : 'OPERADOR'
      });
    }
  }, [initialUser]);

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

  const validatePassword = (value) => {
    if (!value && !initialUser) return 'Senha é obrigatória';
    if (!value && initialUser) return ''; // Password is optional when editing
    
    if (value && value.length < 6) {
      return 'Senha deve ter pelo menos 6 caracteres';
    }
    
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Username validation
    const usernameError = validateRequired(formData.username, 'Nome de usuário') || 
                        validateUsername(formData.username);
    if (usernameError) newErrors.username = usernameError;
    
    // Password validation (required for new users, optional for editing)
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;
    
    // Role validation
    if (!formData.role) {
      newErrors.role = 'Perfil é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    if (!validateForm()) {
      setLoading(false);
      return;
    }
    
    try {
      if (initialUser) {
        // Update existing user
        await userService.updateUser(initialUser.id, {
          name: formData.name,
          role: formData.role,
          password: formData.password || undefined
        });
        setSuccessMessage('Usuário atualizado com sucesso');
      } else {
        // Create new user
        await userService.createUser({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          role: formData.role
        });
        setSuccessMessage('Usuário criado com sucesso');
        
        // Clear form after successful creation
        setFormData({
          username: '',
          password: '',
          name: '',
          role: 'OPERADOR'
        });
      }
      
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    errors,
    loading,
    error,
    successMessage,
    handleChange,
    handleSubmit
  };
};