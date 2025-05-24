// Base API URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://helps-plataforms-frontend.vercel.app' 
    : 'http://localhost:8080');

// WebSocket URL
export const WS_BASE_URL = process.env.REACT_APP_WS_URL || 
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

// API timeout
export const API_TIMEOUT = 15000;

// API Endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/login',
  LOGOUT: '/logout',
  
  // Users
  USERS: '/admin/users',
  USER_BY_ID: (id) => `/admin/users/${id}`,
  USER_STATUS: (id) => `/admin/users/${id}/status`,
  
  // Tickets
  TICKETS: '/tickets',
  TICKET_BY_ID: (id) => `/tickets/${id}`,
  TICKET_ASSIGN: (id) => `/tickets/${id}/assign`,
  TICKET_CLOSE: (id) => `/tickets/${id}/close`,
  TICKET_WITH_IMAGE: '/tickets/with-image',
  TICKET_NEW: '/tickets/new',
  
  // Messages
  TICKET_MESSAGES: (id) => `/tickets/${id}/mensagens`,
  TICKET_MESSAGES_WITH_IMAGE: (id) => `/tickets/${id}/mensagens/with-image`,
  CHAT_HISTORY: (id) => `/tickets/${id}/mensagens/chat-history`,
  
  // Notifications
  NOTIFICATIONS_UNREAD: '/notifications/unread',
  NOTIFICATION_READ: (id) => `/notifications/${id}/read`,
  NOTIFICATIONS_MARK_ALL_READ: '/notifications/mark-all-read',
  NOTIFICATION_TEST: '/notifications/test',
  
  // Files
  FILE_UPLOAD: '/api/files/upload',
  FILE_DOWNLOAD: (fileName) => `/api/files/download/${fileName}`,
  
  // Activity Logs
  ACTIVITY_LOGS: '/admin/activity/logs',
  ACTIVITY_SESSIONS: '/admin/activity/sessions',
  ACTIVITY_STATS: '/admin/activity/stats'
};

// Response codes
export const API_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Default config function
export const getDefaultConfig = (token) => ({
  headers: {
    ...DEFAULT_HEADERS,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  },
  timeout: API_TIMEOUT
});

// Helper function to get image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

export default {
  API_BASE_URL,
  WS_BASE_URL,
  API_TIMEOUT,
  ENDPOINTS,
  API_CODES,
  DEFAULT_HEADERS,
  getDefaultConfig,
  getImageUrl
};