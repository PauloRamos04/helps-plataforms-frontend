// Check if a user has a specific role
export const hasRole = (user, role) => {
    if (!user || !user.roles) {
      return false;
    }
    
    const normalizeRole = (r) => {
      if (typeof r !== 'string') return '';
      return r.replace('ROLE_', '').toUpperCase();
    };
    
    const normalizedRole = normalizeRole(role);
    
    return user.roles.some(r => normalizeRole(r) === normalizedRole);
  };
  
  // Check if a user has admin role
  export const isAdmin = (user) => {
    return hasRole(user, 'ADMIN');
  };
  
  // Check if a user has helper role
  export const isHelper = (user) => {
    return hasRole(user, 'HELPER');
  };
  
  // Get user's primary role label
  export const getPrimaryRoleLabel = (user) => {
    if (!user || !user.roles || user.roles.length === 0) {
      return 'Usuário';
    }
    
    if (hasRole(user, 'ADMIN')) return 'Administrador';
    if (hasRole(user, 'HELPER')) return 'Helper';
    if (hasRole(user, 'OPERADOR')) return 'Operador';
    
    return 'Usuário';
  };
  
  // Get color scheme for a role
  export const getRoleColorScheme = (role) => {
    const normalizedRole = typeof role === 'string' 
      ? role.replace('ROLE_', '').toUpperCase() 
      : '';
    
    switch (normalizedRole) {
      case 'ADMIN':
        return { bg: '#d32f2f', color: 'white' };
      case 'HELPER':
        return { bg: '#388e3c', color: 'white' };
      case 'OPERADOR':
        return { bg: '#1976d2', color: 'white' };
      default:
        return { bg: '#757575', color: 'white' };
    }
  };