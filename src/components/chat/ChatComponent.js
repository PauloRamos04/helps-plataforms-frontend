import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Box, Typography, TextField, Button, Avatar,
  CircularProgress, IconButton, Tooltip, Snackbar, Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import AuthContext from '../../context/AuthContext';
import { chamadoService } from '../../api/chamadoService';
import notificationService from '../../api/notificationService';

const isWebSocketAvailable = () => {
  try {
    const websocketService = require('../../api/websocketService').default;

    if (websocketService &&
      typeof websocketService.connect === 'function' &&
      typeof websocketService.subscribeToChamado === 'function') {
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
};

let websocketService = null;
if (isWebSocketAvailable()) {
  websocketService = require('../../api/websocketService').default;
}

const MessageImage = ({ imagePath }) => {
  if (!imagePath) return null;

  const imageUrl = chamadoService.getImageUrl(imagePath);

  return (
    <Box sx={{ mt: 1, mb: 1 }}>
      <img
        src={imageUrl}
        alt="Anexo da mensagem"
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

const ChatComponent = ({ chamadoId, chamadoStatus, alignUserMessages = "right" }) => {
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
  const [isWebSocketEnabled, setIsWebSocketEnabled] = useState(!!websocketService);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const currentUserIdRef = useRef(auth?.user?.id);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);

  // Função mais robusta para verificar se a mensagem é do usuário atual
  const isCurrentUserMessage = (message) => {
    const currentUserId = currentUserIdRef.current;

    if (!currentUserId) return false;

    // Verificar todos os possíveis lugares onde o ID do remetente pode estar
    return (
      message.senderId === currentUserId ||
      message.sender?.id === currentUserId ||
      message.remetente?.id === currentUserId ||
      // Comparação específica por username também (caso o id não seja confiável)
      (auth?.user?.username &&
        (message.sender?.username === auth.user.username ||
          message.remetente?.username === auth.user.username))
    );
  };

  // Atualizar a referência quando o usuário autenticado mudar
  useEffect(() => {
    currentUserIdRef.current = auth?.user?.id;
  }, [auth?.user?.id]);

  // Efeito para scroll automaticamente para baixo apenas quando o usuário envia uma mensagem
  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldScrollToBottom(false);
    }
  }, [shouldScrollToBottom, messages]);

  // Scroll automático quando as mensagens são carregadas inicialmente
  useEffect(() => {
    if (!isLoading && messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [isLoading, messages.length]);

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
      const roles = message.remetente?.roles || message.sender?.roles || [];

      const isHelper = Array.isArray(roles) ?
        roles.some(role =>
          (typeof role === 'string' && (role === 'HELPER' || role === 'ROLE_HELPER')) ||
          (role?.name && (role.name === 'HELPER' || role.name === 'ROLE_HELPER'))
        ) : false;

      const isAdmin = Array.isArray(roles) ?
        roles.some(role =>
          (typeof role === 'string' && (role === 'ADMIN' || role === 'ROLE_ADMIN')) ||
          (role?.name && (role.name === 'ADMIN' || role.name === 'ROLE_ADMIN'))
        ) : false;

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
        const formattedMessages = data.map(msg => {
          // Processe cada mensagem e determine definitivamente se é do usuário atual
          const senderId = msg.remetente?.id || msg.sender?.id;
          const isFromCurrentUser = senderId === currentUserIdRef.current;

          return {
            id: msg.id,
            type: 'CHAT',
            chamadoId: chamadoId,
            senderId: senderId,
            senderName: (msg.remetente || msg.sender)?.name ||
              (msg.remetente || msg.sender)?.username || 'Usuário',
            content: msg.conteudo || msg.content,
            timestamp: msg.dataEnvio || msg.sentDate,
            remetente: msg.remetente || msg.sender,
            conteudo: msg.conteudo || msg.content,
            dataEnvio: msg.dataEnvio || msg.sentDate,
            imagePath: msg.imagePath || msg.image_path,
            _isFromCurrentUser: isFromCurrentUser // Salvar esta informação na mensagem
          };
        });

        setMessages(formattedMessages);
        
        // Ativar scroll para baixo quando mensagens são carregadas
        if (!silent) {
          setShouldScrollToBottom(true);
        }
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

    // Aumentar o intervalo de polling para reduzir atualizações frequentes
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages(true);
    }, 30000); // 30 segundos
  };

  const connectWebSocket = () => {
    if (!isWebSocketEnabled || !websocketService || !chamadoId) {
      startPolling();
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      websocketService.connect(
        () => {
          try {
            const success = websocketService.subscribeToChamado(chamadoId, (message) => {
              if (message.type === 'CHAT') {
                setMessages(prev => {
                  const exists = prev.some(m => m.id === message.id);
                  if (exists) return prev;

                  // Determinar se a mensagem recebida é do usuário atual
                  const isFromCurrentUser = message.senderId === currentUserIdRef.current;
                  
                  // Nova mensagem recebida, scroll para baixo
                  setShouldScrollToBottom(true);

                  return [...prev, {
                    ...message,
                    _isFromCurrentUser: isFromCurrentUser
                  }];
                });
              }
            });

            if (success) {
              try {
                websocketService.addUser(chamadoId, {
                  type: 'JOIN',
                  chamadoId: chamadoId,
                  senderId: auth.user?.id,
                  senderName: auth.user?.name || auth.user?.username || 'Usuário',
                  content: '',
                  timestamp: new Date().toISOString()
                });
              } catch (userError) {
                // Falha silenciosa
              }

              setIsConnecting(false);
              startPolling();
            } else {
              setError('Não foi possível conectar ao canal de chat');
              setIsConnecting(false);
              startPolling();
            }
          } catch (subError) {
            setError('Erro ao conectar ao chat, usando modo alternativo.');
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
    } catch (error) {
      setError('Falha na conexão, usando modo alternativo para receber mensagens.');
      setIsConnecting(false);
      startPolling();
    }
  };

  useEffect(() => {
    if (!chamadoId) return;

    fetchMessages();

    if (isWebSocketEnabled && websocketService) {
      connectWebSocket();
    } else {
      startPolling();
    }

    return () => {
      if (isWebSocketEnabled && websocketService && websocketService.isConnected) {
        try {
          websocketService.unsubscribeFromChamado(chamadoId);
        } catch (error) {
          // Falha silenciosa
        }
      }

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [chamadoId]);

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
      _isFromCurrentUser: true, // Marcar explicitamente como do usuário atual
      imagePath: selectedImage ? 'pending' : null
    };

    setMessages(prev => [...prev, optimisticMessage]);
    
    // Ativa o scroll para a parte inferior quando o usuário envia uma mensagem
    setShouldScrollToBottom(true);

    try {
      let success = false;
      let response;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('conteudo', currentMessage);
        formData.append('image', selectedImage);

        try {
          response = await chamadoService.enviarMensagemComImagem(chamadoId, formData);
          success = true;
        } catch (imageUploadError) {
          try {
            const alternativeFormData = new FormData();
            alternativeFormData.append('content', currentMessage);
            alternativeFormData.append('image', selectedImage);

            response = await chamadoService.enviarMensagemComAnexos(chamadoId, alternativeFormData);
            success = true;
          } catch (alternativeError) {
            throw imageUploadError;
          }
        }
      } else if (isWebSocketEnabled && websocketService && websocketService.isConnected) {
        try {
          success = websocketService.sendMessage(chamadoId, messageObj);
        } catch (wsError) {
          success = false;
        }
      }

      if (!success && !selectedImage) {
        await chamadoService.enviarMensagem(chamadoId, {
          conteudo: currentMessage,
          content: currentMessage
        });
      }

      setMessages(prev => prev.filter(m => m.id !== optimisticId));

      fetchMessages(true);
      
      // Ativa o scroll novamente após o envio ser concluído
      setShouldScrollToBottom(true);

      setSelectedImage(null);
      setImagePreview(null);

      try {
        if (notificationService && typeof notificationService.createTestNotification === 'function') {
          await notificationService.createTestNotification(
            `Nova mensagem no chamado #${chamadoId}`,
            'NOVA_MENSAGEM',
            chamadoId
          );
        }
      } catch (notifError) {
        // Falha silenciosa
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

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
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

    if (isWebSocketEnabled && websocketService && !websocketService.isConnected) {
      connectWebSocket();
    }
  };

  const isChatDisabled =
    chamadoStatus !== 'EM_ATENDIMENTO' &&
    chamadoStatus !== 'IN_PROGRESS';

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getInitial = (name) => {
    return name?.charAt(0)?.toUpperCase() || 'U';
  };

  const getUserRole = (message) => {
    const roles = message.remetente?.roles || message.sender?.roles || [];

    if (!roles || !Array.isArray(roles)) {
      return null;
    }

    // Verificar se é um Admin
    const isAdmin = roles.some(role => {
      if (typeof role === 'string') {
        return role === 'ADMIN' || role === 'ROLE_ADMIN';
      }
      return role?.name === 'ADMIN' || role?.name === 'ROLE_ADMIN';
    });

    if (isAdmin) return "Admin";

    // Verificar se é um Helper
    const isHelper = roles.some(role => {
      if (typeof role === 'string') {
        return role === 'HELPER' || role === 'ROLE_HELPER';
      }
      return role?.name === 'HELPER' || role?.name === 'ROLE_HELPER';
    });

    if (isHelper) return "Helper"; // Corrigido de "Atendente" para "Helper"

    // Verificar se é um Operador (usuário normal)
    const isOperator = roles.some(role => {
      if (typeof role === 'string') {
        return role === 'USER' || role === 'ROLE_USER' || role === 'OPERATOR' || role === 'ROLE_OPERATOR';
      }
      return role?.name === 'USER' || role?.name === 'ROLE_USER' || role?.name === 'OPERATOR' || role?.name === 'ROLE_OPERATOR';
    });

    if (isOperator) return "Usuário"; // Alterado de "Operador" para "Usuário"

    return null; // Sem tag para outros tipos de usuário
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        bgcolor: '#ffffff',
        borderRadius: 'inherit',
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
          <Tooltip title="Atualizar mensagens">
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

      {/* Área de mensagens com scroll interno */}
      <Box
        sx={{
          flexGrow: 1,
          height: '350px', // Altura fixa para o componente
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          bgcolor: '#fafafa',
          overflowX: 'hidden'
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : messages.length > 0 ? (
          <>
            {messages.map((message, index) => {
              // Usar a propriedade armazenada em vez de recalcular a cada renderização
              const isSentByCurrentUser = message._isFromCurrentUser || isCurrentUserMessage(message);

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
                                bgcolor: userRole === 'Admin' ? '#d32f2f' :
                                  userRole === 'Helper' ? '#2e7d32' :
                                    '#757575', // Cor para Usuário
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

                      {(message.content || message.conteudo) && (
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
          bgcolor: '#f5f5f5',
          mt: 'auto' // Garante que fique no final
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
    </Box>
  );
};

export default ChatComponent;