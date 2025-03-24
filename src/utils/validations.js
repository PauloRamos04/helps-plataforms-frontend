// Save this file exactly as: src/utils/validation.js
/**
 * Validates that a value is not empty
 * @param {any} value - The value to validate
 * @param {string} fieldName - The field name for the error message
 * @returns {string} Error message or empty string if valid
 */
export const validateRequired = (value, fieldName) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} é obrigatório`;
    }
    return '';
  };
  
  /**
   * Validates that a value meets minimum length requirements
   * @param {string} value - The value to validate
   * @param {number} minLength - The minimum length required
   * @param {string} fieldName - The field name for the error message
   * @returns {string} Error message or empty string if valid
   */
  export const validateMinLength = (value, minLength, fieldName) => {
    if (value && value.length < minLength) {
      return `${fieldName} deve ter pelo menos ${minLength} caracteres`;
    }
    return '';
  };
  
  /**
   * Validates a username format
   * @param {string} value - The username to validate
   * @returns {string} Error message or empty string if valid
   */
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
  
  /**
   * Validates a password for security requirements
   * @param {string} value - The password to validate
   * @returns {string} Error message or empty string if valid
   */
  export const validatePassword = (value) => {
    if (!value) return '';
    
    const errors = [];
    if (value.length < 6) {
      errors.push('Senha deve ter pelo menos 6 caracteres');
    }
    
    return errors.join('. ');
  };
  
  /**
   * Validates an email format
   * @param {string} value - The email to validate
   * @returns {string} Error message or empty string if valid
   */
  export const validateEmail = (value) => {
    if (!value) return '';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Email inválido';
    }
    return '';
  };