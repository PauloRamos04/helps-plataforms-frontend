import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Avatar,
  CircularProgress, IconButton, Tooltip, Snackbar, Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import AuthContext from '../../context/AuthContext';
import websocketService from '../../api/websocketService';
import { chamadoService } from '../../api/chamadoService';

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
  const isWebSocketEnabled = true;

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
          dataEnvio: msg.dataEnvio
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
    if (!isWebSocketEnabled || !chamadoId) return;
    
    setIsConnecting(true);
    setError(null);
    
    websocketService.connect(
      () => {
        const success = websocketService.subscribeToChamado(chamadoId, (message) => {
          if (message.type === 'CHAT') {
            setMessages(prev => {
              const exists = prev.some(m => m.id === message.id);
              if (exists) return prev;
              return [...prev, message];
            });
          }
        });
        
        if (success) {
          websocketService.addUser(chamadoId, {
            type: 'JOIN',
            chamadoId: chamadoId,
            senderId: auth.user?.id,
            senderName: auth.user?.name || auth.user?.username || 'Usuário',
            content: '',
            timestamp: new Date().toISOString()
          });
          
          setIsConnecting(false);
          
          startPolling();
        } else {
          setError('Não foi possível se inscrever no canal do chat');
          setIsConnecting(false);
          startPolling();
        }
      },
      (error) => {
        setError('Usando modo alternativo para receber mensagens.');
        setIsConnecting(false);
        startPolling();
      }
    );
  };

  useEffect(() => {
    if (!chamadoId) return;
    
    fetchMessages();
    
    connectWebSocket();
    startPolling();
    
    return () => {
      if (websocketService.isConnected) {
        websocketService.unsubscribeFromChamado(chamadoId);
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
    if (!messageInput.trim()) return;
    
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
      _isOptimistic: true
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      let success = false;
      
      if (isWebSocketEnabled && websocketService.isConnected) {
        success = websocketService.sendMessage(chamadoId, messageObj);
      }
      
      if (!success) {
        await chamadoService.enviarMensagem(chamadoId, { conteudo: currentMessage });
        
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        
        fetchMessages(true);
      }
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      
      setMessageInput(currentMessage);
      
      setNotification({
        open: true,
        message: 'Não foi possível enviar a mensagem. Tente novamente.',
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

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleRefreshMessages = () => {
    fetchMessages();

    if (!websocketService.isConnected) {
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
        
        <Tooltip title="Atualizar mensagens">
          <IconButton 
            size="small" 
            onClick={handleRefreshMessages}
            disabled={isConnecting}
          >
            {isConnecting ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>
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
                      
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content || message.conteudo}
                      </Typography>
                      
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
                        {message._isOptimistic && ' (enviando...)'}
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
              Nenhuma mensagem ainda. Inicie a conversa!
            </Typography>
          </Box>
        )}
      </Box>
      
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
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder={isChatDisabled 
              ? "Chat disponível apenas para chamados em atendimento" 
              : "Digite sua mensagem..."}
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
            disabled={isChatDisabled || !messageInput.trim() || isSending}
            sx={{ 
              borderRadius: '4px',
              textTransform: 'none',
              minWidth: '100px'
            }}
          >
            {isSending ? 'Enviando' : 'Enviar'}
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
            O chat só está disponível para chamados em atendimento
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