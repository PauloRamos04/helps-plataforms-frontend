import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Avatar,
  CircularProgress, IconButton, Tooltip, Snackbar, Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import AuthContext from '../../context/AuthContext';
import { chamadoService } from '../../api/chamadoService';
import websocketService from '../../api/websocketService';

const checkWebSocketService = () => {
  const requiredMethods = ['connect', 'subscribeToChamado', 'addUser', 'sendMessage', 'unsubscribeFromChamado'];
  const missingMethods = requiredMethods.filter(method => !websocketService[method] || typeof websocketService[method] !== 'function');
  
  if (missingMethods.length > 0) {
    console.error('Missing methods in websocketService:', missingMethods);
    return false;
  }
  return true;
};

const MessageImage = ({ imagePath }) => {
  if (!imagePath) return null;
  
  const imageUrl = chamadoService.getImageUrl(imagePath);
  
  return (
    <Box sx={{ mt: 1, mb: 1 }}>
      <img 
        src={imageUrl} 
        alt="Message attachment" 
        style={{ 
          maxWidth: '100%', 
          maxHeight: '200px', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        onClick={() => window.open(imageUrl, '_blank')}
      />
    </Box>
  );
};

const ChatComponent = ({ chamadoId, chamadoStatus }) => {
  const { auth } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'info' });
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const [isWebSocketEnabled, setIsWebSocketEnabled] = useState(checkWebSocketService());
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const isCurrentUserMessage = (message) => {
    const currentUserId = auth.user?.id;
    return message.senderId === currentUserId || message.remetente?.id === currentUserId;
  };

  const getUserColorScheme = (message) => {
    const isSentByCurrentUser = isCurrentUserMessage(message);
    
    if (isSentByCurrentUser) {
      return {
        avatar: '#4966f2',  
        avatarText: 'white',
        bubble: '#e3f2fd',     
        bubbleText: '#0d47a1'
      };
    } else {
      const isHelper = message.remetente?.roles?.some(
        role => role.name === 'HELPER' || role.name === 'ROLE_HELPER'
      );
      
      const isAdmin = message.remetente?.roles?.some(
        role => role.name === 'ADMIN' || role.name === 'ROLE_ADMIN'
      );
      
      if (isAdmin) {
        return {
          avatar: '#d32f2f',
          avatarText: 'white',
          bubble: '#ffebee',
          bubbleText: '#b71c1c'
        };
      } else if (isHelper) {
        return {
          avatar: '#2e7d32',
          avatarText: 'white',
          bubble: '#e8f5e9',
          bubbleText: '#1b5e20'
        };
      } else {
        return {
          avatar: '#757575',
          avatarText: 'white',
          bubble: '#f5f5f5',
          bubbleText: '#424242'
        };
      }
    }
  };

  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      
      const data = await chamadoService.getMensagens(chamadoId);
      
      if (data && Array.isArray(data)) {
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          type: 'CHAT',
          chamadoId: chamadoId,
          senderId: msg.remetente?.id,
          senderName: msg.remetente?.name || msg.remetente?.username || 'Usuário',
          content: msg.conteudo,
          timestamp: msg.dataEnvio,
          remetente: msg.remetente,
          conteudo: msg.conteudo,
          dataEnvio: msg.dataEnvio,
          imagePath: msg.imagePath
        }));
        
        setMessages(formattedMessages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      if (!silent) {
        setError('Não foi possível carregar as mensagens. Tente novamente.');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages(true);
    }, 5000);
  };

  const connectWebSocket = () => {
    if (!isWebSocketEnabled || !chamadoId) {
      console.log('WebSocket disabled or chamadoId not provided');
      startPolling();
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      websocketService.connect(
        () => {
          console.log('WebSocket connected successfully');
          try {
            const success = websocketService.subscribeToChamado(chamadoId, (message) => {
              console.log('Message received via WebSocket:', message);
              if (message.type === 'CHAT') {
                setMessages(prev => {
                  const exists = prev.some(m => m.id === message.id);
                  if (exists) return prev;
                  return [...prev, message];
                });
              }
            });
            
            if (success) {
              console.log('Subscription to chamado successful');
              try {
                websocketService.addUser(chamadoId, {
                  type: 'JOIN',
                  chamadoId: chamadoId,
                  senderId: auth.user?.id,
                  senderName: auth.user?.name || auth.user?.username || 'Usuário',
                  content: '',
                  timestamp: new Date().toISOString()
                });
                console.log('User added to chat');
              } catch (userError) {
                console.error('Error adding user to chat:', userError);
              }
              
              setIsConnecting(false);
              startPolling();
            } else {
              console.error('Failed to subscribe to chat channel');
              setError('Could not subscribe to chat channel');
              setIsConnecting(false);
              startPolling();
            }
          } catch (subError) {
            console.error('Error trying to subscribe to channel:', subError);
            setError('Error connecting to chat, using alternative mode.');
            setIsConnecting(false);
            startPolling();
          }
        },
        (error) => {
          console.error('WebSocket connection error:', error);
          setError('Using alternative mode to receive messages.');
          setIsConnecting(false);
          startPolling();
        }
      );
    } catch (error) {
      console.error('Error starting WebSocket connection:', error);
      setError('Connection failure, using alternative mode to receive messages.');
      setIsConnecting(false);
      startPolling();
    }
  };

  useEffect(() => {
    if (!chamadoId) return;
    
    fetchMessages();
    
    if (isWebSocketEnabled) {
      connectWebSocket();
    } else {
      startPolling();
    }
    
    return () => {
      if (isWebSocketEnabled && websocketService.isConnected) {
        try {
          websocketService.unsubscribeFromChamado(chamadoId);
        } catch (error) {
          console.error('Error unsubscribing from chat:', error);
        }
      }
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [chamadoId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedImage) || isSending) return;
    
    setIsSending(true);
    
    const messageObj = {
      type: 'CHAT',
      chamadoId: chamadoId,
      senderId: auth.user?.id,
      senderName: auth.user?.name || auth.user?.username || 'Usuário',
      content: messageInput,
      timestamp: new Date().toISOString()
    };
    
    const currentMessage = messageInput;
    setMessageInput('');
    
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      ...messageObj,
      id: optimisticId,
      _isOptimistic: true,
      imagePath: selectedImage ? 'pending' : null
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      let success = false;
      let response;
      
      if (selectedImage) {
        const formData = new FormData();
        formData.append('conteudo', currentMessage);
        formData.append('image', selectedImage);
        
        response = await chamadoService.enviarMensagemComImagem(chamadoId, formData);
        success = true;
      } else if (isWebSocketEnabled && websocketService.isConnected) {
        try {
          success = websocketService.sendMessage(chamadoId, messageObj);
          console.log('Message sent via WebSocket:', success);
        } catch (wsError) {
          console.error('Error sending message via WebSocket:', wsError);
          success = false;
        }
      }
      
      if (!success && !selectedImage) {
        console.log('Sending message via API');
        await chamadoService.enviarMensagem(chamadoId, { conteudo: currentMessage });
      }
      
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      
      fetchMessages(true);
      
      // Clear image selection
      setSelectedImage(null);
      setImagePreview(null);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      
      setMessageInput(currentMessage);
      
      setNotification({
        open: true,
        message: 'Could not send message. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setNotification({
        open: true,
        message: 'Only image files are allowed.',
        type: 'error'
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setNotification({
        open: true,
        message: 'File size should be less than 5MB.',
        type: 'error'
      });
      return;
    }
    
    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
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

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleRefreshMessages = () => {
    fetchMessages();

    if (isWebSocketEnabled && !websocketService.isConnected) {
      connectWebSocket();
    }
  };

  const isChatDisabled = chamadoStatus !== 'EM_ATENDIMENTO';
  
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getInitial = (name) => {
    return name?.charAt(0)?.toUpperCase() || 'U';
  };

  const getUserRole = (message) => {
    if (!message.remetente || !message.remetente.roles) return null;
    
    const roles = message.remetente.roles;
    
    if (roles.some(role => role.name === 'ADMIN' || role.name === 'ROLE_ADMIN')) {
      return "Admin";
    } else if (roles.some(role => role.name === 'HELPER' || role.name === 'ROLE_HELPER')) {
      return "Helper";
    }
    
    return null;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: 600,
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden'
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: '#f5f5f5', 
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="subtitle1" fontWeight="medium">
          Chat do Chamado #{chamadoId}
        </Typography>
        
        <span>
          <Tooltip title="Refresh messages">
            <span>
              <IconButton 
                size="small" 
                onClick={handleRefreshMessages}
                disabled={isConnecting}
              >
                {isConnecting ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </span>
      </Box>
      
      {error && (
        <Alert severity="info" sx={{ m: 1 }}>
          {error}
        </Alert>
      )}
      
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          bgcolor: '#fafafa'
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : messages.length > 0 ? (
          <>
            {messages.map((message, index) => {
              const isSentByCurrentUser = isCurrentUserMessage(message);
              
              const colorScheme = getUserColorScheme(message);
              
              const userRole = getUserRole(message);

              return (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isSentByCurrentUser ? 'flex-end' : 'flex-start',
                    mb: 1,
                    width: '100%'
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex',
                      flexDirection: isSentByCurrentUser ? 'row-reverse' : 'row',
                      alignItems: 'flex-end',
                      gap: 1,
                      maxWidth: '80%'
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: colorScheme.avatar,
                        color: colorScheme.avatarText,
                        fontSize: '0.875rem'
                      }}
                    >
                      {getInitial(message.senderName)}
                    </Avatar>
                    
                    <Box 
                      sx={{ 
                        p: 1.5,
                        bgcolor: colorScheme.bubble,
                        color: colorScheme.bubbleText,
                        borderRadius: '8px',
                        position: 'relative',
                        opacity: message._isOptimistic ? 0.7 : 1,
                        maxWidth: '100%',
                        wordBreak: 'break-word',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 0.5
                      }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: 'medium',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          {message.senderName}
                          {userRole && (
                            <Box 
                              component="span" 
                              sx={{ 
                                bgcolor: userRole === 'Admin' ? '#d32f2f' : '#2e7d32',
                                color: 'white',
                                fontSize: '0.6rem',
                                px: 0.5,
                                py: 0.2,
                                borderRadius: '4px',
                                ml: 0.5
                              }}
                            >
                              {userRole}
                            </Box>
                          )}
                        </Typography>
                      </Box>
                      
                      {message.content && (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.content || message.conteudo}
                        </Typography>
                      )}
                      
                      {message.imagePath && message.imagePath !== 'pending' && (
                        <MessageImage imagePath={message.imagePath} />
                      )}
                      
                      {message.imagePath === 'pending' && (
                        <Box sx={{ mt: 1, mb: 1 }}>
                          <CircularProgress size={24} />
                        </Box>
                      )}
                      
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          textAlign: 'right',
                          color: 'text.secondary',
                          mt: 0.5
                        }}
                      >
                        {formatTime(message.timestamp || message.dataEnvio)}
                        {message._isOptimistic && ' (sending...)'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100%'
            }}
          >
            <Typography color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        )}
      </Box>
      
      {imagePreview && (
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid #e0e0e0',
          bgcolor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Box sx={{ position: 'relative', mr: 2 }}>
            <img 
              src={imagePreview} 
              alt="Selected" 
              style={{ 
                height: '60px', 
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
      
      <Box 
        sx={{ 
          p: 2, 
          borderTop: '1px solid #e0e0e0',
          bgcolor: '#f5f5f5'
        }}
      >
        <Box 
          sx={{ 
            display: 'flex',
            gap: 1
          }}
        >
          <input
            type="file"
            id="file-upload"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            ref={fileInputRef}
          />
          
          <IconButton
            color="primary"
            onClick={() => fileInputRef.current.click()}
            disabled={isChatDisabled || isSending}
            sx={{ bgcolor: 'white', borderRadius: '4px' }}
          >
            <AttachFileIcon />
          </IconButton>
          
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder={isChatDisabled 
              ? "Chat only available for tickets in progress" 
              : "Type your message..."}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isChatDisabled || isSending}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'white',
                borderRadius: '4px'
              }
            }}
          />
          
          <Button
            variant="contained"
            color="primary"
            endIcon={isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            onClick={handleSendMessage}
            disabled={isChatDisabled || (!messageInput.trim() && !selectedImage) || isSending}
            sx={{ 
              borderRadius: '4px',
              textTransform: 'none',
              minWidth: '100px'
            }}
          >
            {isSending ? 'Sending' : 'Send'}
          </Button>
        </Box>
        
        {isChatDisabled && (
          <Typography 
            variant="caption" 
            color="error" 
            sx={{ 
              display: 'block',
              mt: 1
            }}
          >
            Chat is only available for tickets in progress
          </Typography>
        )}
      </Box>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ChatComponent;