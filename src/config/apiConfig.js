/**
 * API configuration for the application
 * Uses environment variables with fallbacks
 */

// Base API URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || window.location.origin;

// WebSocket URL
export const WS_BASE_URL = process.env.REACT_APP_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

// API timeout in milliseconds
export const API_TIMEOUT = 15000;

// API Endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/login',
  
  // Users
  USERS: '/admin/users',
  USER_BY_ID: (id) => `/admin/users/${id}`,
  USER_STATUS: (id) => `/admin/users/${id}/status`,
  
  // Chamados
  CHAMADOS: '/chamados',
  CHAMADO_BY_ID: (id) => `/chamados/${id}`,
  CHAMADO_ADERIR: (id) => `/chamados/${id}/aderir`,
  CHAMADO_FINALIZAR: (id) => `/chamados/${id}/fechar`,
  
  // Mensagens
  MENSAGENS: (chamadoId) => `/chamados/${chamadoId}/mensagens`,
  CHAT_HISTORY: (chamadoId) => `/chamados/${chamadoId}/chat-history`,
  
  // Notifications
  NOTIFICATIONS_UNREAD: '/notifications/unread',
  NOTIFICATION_READ: (id) => `/notifications/${id}/read`,
  NOTIFICATIONS_MARK_ALL_READ: '/notifications/mark-all-read'
};

// API response codes
export const API_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};

// Number of retry attempts for API calls
export const API_RETRY_ATTEMPTS = 2;

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Default request configuration
export const getDefaultConfig = (token) => ({
  headers: {
    ...DEFAULT_HEADERS,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  },
  timeout: API_TIMEOUT
});

export default {
  API_BASE_URL,
  WS_BASE_URL,
  API_TIMEOUT,
  ENDPOINTS,
  API_CODES,
  API_RETRY_ATTEMPTS,
  DEFAULT_HEADERS,
  getDefaultConfig
};