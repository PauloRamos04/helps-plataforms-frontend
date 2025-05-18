// src/utils/validationUtils.js
// Adicione a função validateRequired que está faltando

// Validate required fields
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} é obrigatório`;
  }
  return '';
};

// Validate minimum length
export const validateMinLength = (value, minLength, fieldName) => {
  if (value && value.length < minLength) {
    return `${fieldName} deve ter pelo menos ${minLength} caracteres`;
  }
  return '';
};

// Validate username format
export const validateUsername = (value) => {
  if (!value) return '';
  
  if (value.length < 3) {
    return 'Nome de usuário deve ter pelo menos 3 caracteres';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return 'Nome de usuário deve conter apenas letras, números e underscores';
  }
  
  return '';
};

// Validate password requirements
export const validatePassword = (value) => {
  if (!value) return '';
  
  const errors = [];
  if (value.length < 6) {
    errors.push('Senha deve ter pelo menos 6 caracteres');
  }
  
  return errors.join('. ');
};

// Validate email format
export const validateEmail = (value) => {
  if (!value) return '';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Email inválido';
  }
  return '';
};