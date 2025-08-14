import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import {
  Box, Typography, TextField, Button, Avatar,
  CircularProgress, IconButton, Tooltip, Snackbar, Alert
} from '@mui/material';
import React, { useState, useEffect, useRef, useContext } from 'react';

import AuthContext from '../../context/AuthContext';
import notificationWebSocketService from '../../services/notificationWebSocketService';
import ticketService from '../../services/ticketService';
import { formatTime, toISOString, isValidDate } from '../../utils/dateUtils';

const TicketChat = ({ ticketId, ticketStatus, onTicketStatusChange }) => {
  const { auth } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'info' });
  const messagesEndRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const wsConnectedRef = useRef(false);
  const [wsStatus, setWsStatus] = useState('disconnected'); // 'connected', 'disconnected', 'connecting'
  const [currentTicketStatus, setCurrentTicketStatus] = useState(ticketStatus);
  
  const focusInput = () => {
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }, 100);
  };
  
  const getCurrentUserIdentifier = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        username: payload.username || payload.sub,
        userId: payload.sub,
        name: payload.name
      };
    } catch {
      return {
        username: auth?.user?.username,
        userId: auth?.user?.id,
        name: auth?.user?.name
      };
    }
  };
  
  const isMyMessage = (message) => {
    const currentUser = getCurrentUserIdentifier();
    if (!currentUser) return false;
    
    const senderUsername = message.sender?.username || message.remetente?.username;
    const senderId = message.sender?.id || message.remetente?.id || message.senderId;
    
    if (senderUsername && currentUser.username) {
      return senderUsername === currentUser.username;
    }
    
    if (senderId && currentUser.userId) {
      return senderId.toString() === currentUser.userId.toString();
    }
    
    return false;
  };

    const handleNewWebSocketMessage = (wsMessage) => {
    // Processar atualizações de status do ticket
    if (wsMessage.type === 'STATUS' && wsMessage.ticketId === parseInt(ticketId)) {
      const newStatus = wsMessage.status || wsMessage.newStatus;
      if (newStatus && newStatus !== currentTicketStatus) {
        setCurrentTicketStatus(newStatus);
        
        // Notificar componente pai sobre mudança de status
        if (onTicketStatusChange) {
          onTicketStatusChange(newStatus);
        }
        
        // Mostrar notificação se o ticket foi finalizado
        if (newStatus === 'FECHADO') {
          setNotification({
            open: true,
            message: 'Este chamado foi finalizado. Não é mais possível enviar mensagens.',
            type: 'warning'
          });
        }
      }
      return;
    }
    
    // Processar mensagens de chat
    if (wsMessage.type === 'CHAT' && wsMessage.ticketId === parseInt(ticketId)) {
      const currentUser = getCurrentUserIdentifier();
      
      // Não processar mensagens próprias via WebSocket (já foram adicionadas otimisticamente)
      if (wsMessage.senderId?.toString() === currentUser?.userId?.toString()) {
        return;
      }

      // Tratar timestamp corretamente usando a função utilitária
      let sentDate = wsMessage.timestamp || wsMessage.sentDate;
      sentDate = toISOString(sentDate);

      const newMessage = {
        id: wsMessage.id || Date.now() + Math.random(),
        isOwnMessage: false,
        senderId: wsMessage.senderId,
        senderName: wsMessage.senderName || wsMessage.sender?.name,
        senderUsername: wsMessage.senderUsername || wsMessage.sender?.username,
        sender: {
          id: wsMessage.senderId,
          username: wsMessage.senderUsername || wsMessage.sender?.username,
          name: wsMessage.senderName || wsMessage.sender?.name
        },
        content: wsMessage.content,
        sentDate: sentDate,
        _isWebSocket: true
      };

      setMessages(prev => {
        // Verificar se a mensagem já existe (evitar duplicatas)
        const exists = prev.some(m => 
          (m.id && m.id === newMessage.id) ||
          (m.content === newMessage.content && 
           m.senderId === newMessage.senderId &&
           Math.abs(new Date(m.sentDate) - new Date(newMessage.sentDate)) < 5000)
        );
        
        if (exists) {
          return prev;
        }
        
        return [...prev, newMessage];
      });
    }
  };

  // Atualizar status do ticket quando mudar
  useEffect(() => {
    setCurrentTicketStatus(ticketStatus);
  }, [ticketStatus]);

  // Polling automático para sincronizar mensagens quando WebSocket não está funcionando
  useEffect(() => {
    if (!ticketId || wsStatus === 'connected') return;

    const pollingInterval = setInterval(() => {
      fetchMessages(true);
    }, 10000); // Polling a cada 10 segundos

    return () => clearInterval(pollingInterval);
  }, [ticketId, wsStatus]);

  const handleManualRefresh = async () => {
    try {
      await fetchMessages(false);
      
      // Tentar reconectar o WebSocket se estiver desconectado
      if (wsStatus === 'disconnected') {
        wsConnectedRef.current = false;
        setTimeout(() => {
          setupWebSocket();
        }, 1000);
      }
      
      setNotification({
        open: true,
        message: 'Mensagens atualizadas com sucesso!',
        type: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: 'Erro ao atualizar mensagens. Tente novamente.',
        type: 'error'
      });
    }
  };

  const handleReconnectWebSocket = () => {
    // Desconectar se estiver conectado
    if (wsConnectedRef.current) {
      notificationWebSocketService.unsubscribe(`/topic/ticket/${ticketId}`);
      wsConnectedRef.current = false;
    }
    
    // Resetar estado
    setWsStatus('disconnected');
    
    // Aguardar um pouco antes de tentar reconectar
    setTimeout(() => {
      setupWebSocket();
    }, 2000);
  };

  const setupWebSocket = () => {
    if (!ticketId) return;
    
    // Verificar estado atual do WebSocket service
    const connectionState = notificationWebSocketService.getConnectionState();
    
    // Se já está conectado, apenas inscrever no tópico
    if (connectionState.isConnected) {
      wsConnectedRef.current = true;
      setWsStatus('connected');
      
      const success = notificationWebSocketService.subscribe(
        `/topic/ticket/${ticketId}`, 
        handleNewWebSocketMessage
      );
      
      if (!success) {
        // Falha ao inscrever no WebSocket
      }
      return;
    }
    
    // Se já está conectado localmente, não tentar conectar novamente
    if (wsConnectedRef.current) {
      return;
    }

    // Se está tentando conectar, não tentar novamente
    if (wsStatus === 'connecting') {
      return;
    }

    setWsStatus('connecting');
    
    notificationWebSocketService.connect(
      () => {
        wsConnectedRef.current = true;
        setWsStatus('connected');
        
        const success = notificationWebSocketService.subscribe(
          `/topic/ticket/${ticketId}`, 
          handleNewWebSocketMessage
        );
        
        if (!success) {
          // Falha ao inscrever no WebSocket
        }
      },
      (error) => {
        wsConnectedRef.current = false;
        setWsStatus('disconnected');
        
        // Não tentar reconectar automaticamente - deixar o usuário usar o botão de refresh
        setNotification({
          open: true,
          message: 'Conexão perdida. Use o botão de atualizar para ver novas mensagens.',
          type: 'warning'
        });
      }
    );
  };

  // Verificar estado do WebSocket periodicamente para sincronizar
  useEffect(() => {
    if (!ticketId) return;

    let connectingTimeout = null;

    const checkWebSocketStatus = () => {
      const connectionState = notificationWebSocketService.getConnectionState();
      
      // Se o WebSocket está conectado mas o estado local não reflete isso
      if (connectionState.isConnected && wsStatus !== 'connected') {
        wsConnectedRef.current = true;
        setWsStatus('connected');
        
        // Limpar timeout de connecting se existir
        if (connectingTimeout) {
          clearTimeout(connectingTimeout);
          connectingTimeout = null;
        }
        
        // Tentar inscrever no tópico se ainda não estiver inscrito
        const success = notificationWebSocketService.subscribe(
          `/topic/ticket/${ticketId}`, 
          handleNewWebSocketMessage
        );
      } 
      // Se o WebSocket não está conectado mas o estado local indica que está
      else if (!connectionState.isConnected && wsStatus === 'connected') {
        wsConnectedRef.current = false;
        setWsStatus('disconnected');
      }
      // Se está tentando conectar há muito tempo, verificar se realmente está conectado
      else if (wsStatus === 'connecting') {
        if (connectionState.isConnected) {
          wsConnectedRef.current = true;
          setWsStatus('connected');
          
          // Limpar timeout de connecting
          if (connectingTimeout) {
            clearTimeout(connectingTimeout);
            connectingTimeout = null;
          }
        }
      }
    };

    // Verificar imediatamente
    checkWebSocketStatus();

    // Se estiver conectando, definir timeout para resetar após 20 segundos
    if (wsStatus === 'connecting') {
      connectingTimeout = setTimeout(() => {
        setWsStatus('disconnected');
        wsConnectedRef.current = false;
      }, 20000);
    }

    // Verificar a cada 2 segundos
    const statusInterval = setInterval(checkWebSocketStatus, 2000);

    return () => {
      clearInterval(statusInterval);
      if (connectingTimeout) {
        clearTimeout(connectingTimeout);
      }
    };
  }, [ticketId, wsStatus]);

  useEffect(() => {
    if (!ticketId) return;
    
    // Limpar estado anterior
    setMessages([]);
    setError(null);
    setIsLoading(true);
    
    // Desconectar WebSocket anterior se existir
    if (wsConnectedRef.current) {
      notificationWebSocketService.unsubscribe(`/topic/ticket/${ticketId}`);
      wsConnectedRef.current = false;
      setWsStatus('disconnected');
    }
    
    // Verificar se o WebSocket já está conectado
    const connectionState = notificationWebSocketService.getConnectionState();
    if (connectionState.isConnected) {
      wsConnectedRef.current = true;
      setWsStatus('connected');
    }
    
    // Carregar mensagens e configurar WebSocket
    fetchMessages();
    setupWebSocket();
    focusInput();

    return () => {
      if (wsConnectedRef.current) {
        notificationWebSocketService.unsubscribe(`/topic/ticket/${ticketId}`);
        wsConnectedRef.current = false;
        setWsStatus('disconnected');
      }
    };
  }, [ticketId]);

  useEffect(() => {
    if (messagesEndRef.current && messages.length > lastMessageCountRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      lastMessageCountRef.current = messages.length;
    }
  }, [messages]);

  // Remover o useEffect que notifica sobre WebSocket offline - já está sendo tratado no setupWebSocket

  const fetchMessages = async (silent = false) => {
    if (!ticketId) return;
    
    try {
      if (!silent) {
        setIsLoading(true);
      }
      
      const data = await ticketService.getTicketMessages(ticketId);
      
      if (data && Array.isArray(data)) {
        const processedMessages = data.map(msg => {
          const isOwn = isMyMessage(msg);
          
          // Tratar timestamp corretamente usando a função utilitária
          let sentDate = msg.sentDate || msg.dataEnvio;
          if (sentDate) {
            sentDate = toISOString(sentDate);
          }
          
          return {
            ...msg,
            isOwnMessage: isOwn,
            content: msg.content || msg.conteudo || '',
            sentDate: sentDate,
            senderId: msg.senderId || msg.sender?.id || msg.remetente?.id,
            senderName: msg.senderName || msg.sender?.name || msg.remetente?.name || msg.sender?.username || msg.remetente?.username || 'Usuário',
            senderUsername: msg.sender?.username || msg.remetente?.username
          };
        });
        
        setMessages(processedMessages);
      }
      
      if (error) {
        setError(null);
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

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedImage) || isSending) return;
    
    // Verificar se o ticket está finalizado
    if (currentTicketStatus === 'FECHADO') {
      setNotification({
        open: true,
        message: 'Este chamado foi finalizado. Não é mais possível enviar mensagens.',
        type: 'error'
      });
      return;
    }
    
    setIsSending(true);
    const currentMessage = messageInput;
    setMessageInput('');
    
    const currentUser = getCurrentUserIdentifier();
    
    // Mensagem otimista
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      isOwnMessage: true,
      senderId: currentUser?.userId,
      senderName: currentUser?.name || currentUser?.username,
      senderUsername: currentUser?.username,
      sender: {
        id: currentUser?.userId,
        username: currentUser?.username,
        name: currentUser?.name
      },
      remetente: {
        id: currentUser?.userId,
        username: currentUser?.username,
        name: currentUser?.name
      },
      content: currentMessage,
      sentDate: new Date().toISOString(),
      _isOptimistic: true
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      let response;
      
      if (selectedImage) {
        const formData = new FormData();
        formData.append('content', currentMessage);
        formData.append('image', selectedImage);
        response = await ticketService.sendMessageWithImage(ticketId, formData);
      } else {
        response = await ticketService.sendMessage(ticketId, {
          content: currentMessage
        });
      }
      
      // Verificar se a resposta é válida
      if (!response) {
        throw new Error('Resposta inválida do servidor');
      }
      
      const processedResponse = {
        ...response,
        isOwnMessage: true,
        content: response.content || response.conteudo || currentMessage,
        sentDate: toISOString(response.sentDate || response.dataEnvio),
        senderId: currentUser?.userId,
        senderName: currentUser?.name || currentUser?.username,
        senderUsername: currentUser?.username,
        sender: {
          ...response.sender,
          username: currentUser?.username,
          name: currentUser?.name
        },
        remetente: {
          ...response.remetente,
          username: currentUser?.username,
          name: currentUser?.name
        }
      };
      
      // Substituir mensagem otimista pela real
      setMessages(prev => 
        prev.filter(m => m.id !== optimisticId).concat([processedResponse])
      );
      
      setSelectedImage(null);
      setImagePreview(null);
      
      // Mostrar sucesso
      setNotification({
        open: true,
        message: 'Mensagem enviada com sucesso!',
        type: 'success'
      });
      
         } catch (error) {
       // Remover mensagem otimista em caso de erro
       setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
       setMessageInput(currentMessage);
      
      // Mostrar erro mais específico
      let errorMessage = 'Não foi possível enviar a mensagem. Tente novamente.';
      if (error.message.includes('Erro interno do servidor')) {
        errorMessage = 'Erro no servidor. A mensagem pode ter sido enviada. Verifique se apareceu no chat.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Tempo limite excedido. Verifique sua conexão e tente novamente.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Este chamado foi finalizado. Não é mais possível enviar mensagens.';
      }
      
      setNotification({
        open: true,
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setIsSending(false);
      focusInput();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setNotification({
        open: true,
        message: 'Apenas arquivos de imagem são permitidos.',
        type: 'error'
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setNotification({
        open: true,
        message: 'O tamanho do arquivo deve ser menor que 5MB.',
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
    
    focusInput();
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    focusInput();
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };



  const getInitial = (name) => {
    return name?.charAt(0)?.toUpperCase() || 'U';
  };

  const getUserRole = (message) => {
    const roles = message.remetente?.roles || message.sender?.roles || [];
    
    if (roles.some(role => role === 'ADMIN' || role === 'ROLE_ADMIN')) {
      return "Admin";
    } else if (roles.some(role => role === 'HELPER' || role === 'ROLE_HELPER')) {
      return "Helper";
    }
    
    return null;
  };

  const isChatDisabled = currentTicketStatus !== 'EM_ATENDIMENTO' && currentTicketStatus !== 'IN_PROGRESS';

  return (
    <Box
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
          Chat do Chamado #{ticketId}
          <Box component="span" sx={{ ml: 1, fontSize: '0.8rem' }}>
            {wsStatus === 'connected' && (
              <Box component="span" sx={{ color: '#4caf50' }}>
                ● Online
              </Box>
            )}
            {wsStatus === 'connecting' && (
              <Box component="span" sx={{ color: '#ff9800' }}>
                ● Conectando...
              </Box>
            )}
            {wsStatus === 'disconnected' && (
              <Box component="span" sx={{ color: '#f44336' }}>
                ● Offline
              </Box>
            )}
          </Box>
          {currentTicketStatus === 'FECHADO' && (
            <Box 
              component="span" 
              sx={{ 
                ml: 1, 
                fontSize: '0.8rem',
                color: '#f44336',
                fontWeight: 'bold'
              }}
            >
              ● FINALIZADO
            </Box>
          )}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {wsStatus === 'disconnected' && (
            <Tooltip title="Reconectar WebSocket">
              <IconButton 
                size="small" 
                onClick={handleReconnectWebSocket}
                sx={{ color: '#f44336' }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Atualizar mensagens">
            <IconButton 
              size="small" 
              onClick={handleManualRefresh}
              disabled={isLoading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ m: 1 }}>
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
            {messages.map((message) => {
              const userRole = getUserRole(message);
              const content = message.content || message.conteudo || '';
              const sentDate = message.sentDate || message.dataEnvio;
              
              const isCurrentUser = message.isOwnMessage === true;
              
              const displayName = message.senderName || 
                                  message.remetente?.name || 
                                  message.sender?.name || 
                                  message.remetente?.username || 
                                  message.sender?.username || 
                                  'Usuário';

              return (
                <Box
                  key={message.id || Math.random()}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                    mb: 1.5,
                    width: '100%'
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mb: 0.5, 
                      color: 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      ml: isCurrentUser ? 0 : 1,
                      mr: isCurrentUser ? 1 : 0
                    }}
                  >
                    {displayName}
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
                    {message._isWebSocket && (
                      <Box 
                        component="span" 
                        sx={{ 
                          bgcolor: '#4caf50',
                          color: 'white',
                          fontSize: '0.6rem',
                          px: 0.5,
                          py: 0.2,
                          borderRadius: '4px',
                          ml: 0.5
                        }}
                      >
                        ●
                      </Box>
                    )}
                  </Typography>
                  
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      maxWidth: '80%'
                    }}
                  >
                    {!isCurrentUser && (
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: userRole === 'Admin' ? '#d32f2f' : 
                                  userRole === 'Helper' ? '#2e7d32' : '#757575',
                          color: 'white',
                          fontSize: '0.875rem',
                          mr: 1
                        }}
                      >
                        {getInitial(displayName)}
                      </Avatar>
                    )}
                    
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: isCurrentUser ? '#e3f2fd' : '#f5f5f5',
                        color: isCurrentUser ? '#0d47a1' : '#424242',
                        borderRadius: '12px',
                        position: 'relative',
                        opacity: message._isOptimistic ? 0.7 : 1,
                        maxWidth: '100%',
                        wordBreak: 'break-word',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      {content && (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {content}
                        </Typography>
                      )}
                      
                      {message.imagePath && message.imagePath !== 'pending' && (
                        <Box sx={{ mt: content ? 1 : 0 }}>
                          <img
                            src={ticketService.getImageUrl(message.imagePath)}
                            alt="Anexo"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '200px',
                              borderRadius: '4px'
                            }}
                          />
                        </Box>
                      )}
                      
                      {message.imagePath === 'pending' && (
                        <Box sx={{ mt: content ? 1 : 0, display: 'flex', justifyContent: 'center' }}>
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
                        {sentDate ? formatTime(sentDate) : ''}
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
              alt="Selecionada"
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
            placeholder={
              currentTicketStatus === 'FECHADO'
                ? "Este chamado foi finalizado"
                : isChatDisabled
                ? "Chat disponível apenas para chamados em atendimento"
                : "Digite sua mensagem..."
            }
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isChatDisabled || isSending}
            variant="outlined"
            size="small"
            inputRef={messageInputRef}
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
            {currentTicketStatus === 'FECHADO'
              ? 'Este chamado foi finalizado e não pode mais receber mensagens'
              : 'O chat só está disponível para chamados em atendimento'
            }
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
    </Box>
  );
};

export default TicketChat;