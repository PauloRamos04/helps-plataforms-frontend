import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Avatar, IconButton, 
  CircularProgress, Tooltip, Snackbar, Alert, Badge, Menu, MenuItem
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import { throttle } from 'lodash';
import AuthContext from '../../context/AuthContext';
import { chamadoService } from '../../api/chamadoService';
import websocketService from '../../api/websocketService';
import AttachmentPreview from '../attachments/AttachmentPreview';

// Componente de mensagem individual - memoizado para melhorar performance
const ChatMessage = React.memo(({ message, formatTime, getInitial, getUserRole }) => {
  const isSentByCurrentUser = message.isSentByCurrentUser;
  const colorScheme = message.colorScheme;
  const userRole = getUserRole(message);
  
  return (
    <Box 
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
          
          {/* Renderizar anexos, se houver */}
          {message.attachments && message.attachments.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {message.attachments.map((attachment, idx) => (
                <AttachmentPreview 
                  key={`${message.id}-attachment-${idx}`}
                  attachment={attachment}
                  size="small"
                />
              ))}
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
});

// Componente principal do chat - com otimizações de performance
const MemoizedChatComponent = ({ chamadoId, chamadoStatus }) => {
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
  const [isWebSocketEnabled, setIsWebSocketEnabled] = useState(true);
  const fileInputRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [attachmentMenuAnchor, setAttachmentMenuAnchor] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Funções memoizadas para evitar re-renders desnecessários
  const isCurrentUserMessage = useCallback((message) => {
    const currentUserId = auth.user?.id;
    return message.senderId === currentUserId || message.remetente?.id === currentUserId;
  }, [auth.user?.id]);

  const getUserColorScheme = useCallback((message) => {
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
        role => role === 'HELPER' || role === 'ROLE_HELPER'
      );
      
      const isAdmin = message.remetente?.roles?.some(
        role => role === 'ADMIN' || role === 'ROLE_ADMIN'
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
  }, [isCurrentUserMessage]);

  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const getInitial = useCallback((name) => {
    return name?.charAt(0)?.toUpperCase() || 'U';
  }, []);

  const getUserRole = useCallback((message) => {
    if (!message.remetente || !message.remetente.roles) return null;
    
    const roles = message.remetente.roles;
    
    if (roles.some(role => role === 'ADMIN' || role === 'ROLE_ADMIN')) {
      return "Admin";
    } else if (roles.some(role => role === 'HELPER' || role === 'ROLE_HELPER')) {
      return "Helper";
    }
    
    return null;
  }, []);

  // Throttle para evitar múltiplas chamadas de fetch
  const throttledFetchMessages = useCallback(
    throttle(async (silent = false) => {
      if (!chamadoId) return;
      
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
            isSentByCurrentUser: msg.remetente?.id === auth.user?.id,
            attachments: msg.anexos || []
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
    }, 1000),
    [chamadoId, auth.user?.id]
  );

  // Usar startPolling com useCallback para evitar re-criações
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      throttledFetchMessages(true);
    }, 10000);
  }, [throttledFetchMessages]);

  // Criar connectWebSocket com useCallback
  const connectWebSocket = useCallback(() => {
    if (!isWebSocketEnabled || !chamadoId) {
      console.log('WebSocket desabilitado ou chamadoId não fornecido');
      startPolling(); // Fallback para polling
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      websocketService.connect(
        () => {
          console.log('WebSocket conectado com sucesso');
          try {
            const success = websocketService.subscribeToChamado(chamadoId, (message) => {
              console.log('Mensagem recebida via WebSocket:', message);
              if (message.type === 'CHAT') {
                setMessages(prev => {
                  const exists = prev.some(m => m.id === message.id);
                  if (exists) return prev;
                  
                  const newMessage = {
                    ...message,
                    isSentByCurrentUser: message.senderId === auth.user?.id,
                    colorScheme: getUserColorScheme({
                      ...message,
                      remetente: { id: message.senderId }
                    })
                  };
                  
                  return [...prev, newMessage];
                });
              }
            });
            
            if (success) {
              console.log('Assinatura ao chamado bem-sucedida');
              try {
                websocketService.addUser(chamadoId, {
                  type: 'JOIN',
                  chamadoId: chamadoId,
                  senderId: auth.user?.id,
                  senderName: auth.user?.name || auth.user?.username || 'Usuário',
                  content: '',
                  timestamp: new Date().toISOString()
                });
                console.log('Usuário adicionado ao chat');
              } catch (userError) {
                console.error('Erro ao adicionar usuário ao chat:', userError);
              }
              
              setIsConnecting(false);
              startPolling();
            } else {
              console.error('Falha ao assinar o canal do chat');
              setError('Não foi possível se inscrever no canal do chat');
              setIsConnecting(false);
              startPolling();
            }
          } catch (subError) {
            console.error('Erro ao tentar assinar o canal:', subError);
            setError('Erro ao conectar ao chat, usando modo alternativo.');
            setIsConnecting(false);
            startPolling();
          }
        },
        (error) => {
          console.error('Erro na conexão WebSocket:', error);
          setError('Usando modo alternativo para receber mensagens.');
          setIsConnecting(false);
          startPolling();
        }
      );
    } catch (error) {
      console.error('Erro ao iniciar conexão WebSocket:', error);
      setError('Falha na conexão, usando modo alternativo para receber mensagens.');
      setIsConnecting(false);
      startPolling();
    }
  }, [chamadoId, auth.user?.id, auth.user?.name, auth.user?.username, isWebSocketEnabled, startPolling, getUserColorScheme]);

  // Setup inicial com useEffect
  useEffect(() => {
    if (!chamadoId) return;
    
    throttledFetchMessages();
    
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
          console.error('Erro ao cancelar assinatura do chat:', error);
        }
      }
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [chamadoId, throttledFetchMessages, connectWebSocket, startPolling, isWebSocketEnabled]);

  // Scroll para a última mensagem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Memoizar mensagens processadas com dados de visualização
  const processedMessages = useMemo(() => {
    return messages.map(message => ({
      ...message,
      isSentByCurrentUser: isCurrentUserMessage(message),
      colorScheme: getUserColorScheme(message)
    }));
  }, [messages, isCurrentUserMessage, getUserColorScheme]);

  // Gerenciamento de anexos
  const handleAttachmentClick = (event) => {
    setAttachmentMenuAnchor(event.currentTarget);
  };

  const handleAttachmentMenuClose = () => {
    setAttachmentMenuAnchor(null);
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Verificar tamanho dos arquivos (limite de 5MB por arquivo)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setNotification({
        open: true,
        message: `Arquivos muito grandes (limite de 5MB): ${oversizedFiles.map(f => f.name).join(', ')}`,
        type: 'error'
      });
      return;
    }
    
    // Adicionar aos anexos atuais
    setAttachments(prev => [...prev, ...files]);
    
    // Resetar input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Função de envio de mensagem otimizada com useCallback
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() && attachments.length === 0) return;
    
    setIsSending(true);
    
    // Criar ID temporário para mensagem otimista
    const optimisticId = `temp-${Date.now()}`;
    
    // Texto da mensagem atual
    const currentMessage = messageInput;
    setMessageInput('');
    
    // Criar objeto de mensagem
    const messageObj = {
      type: 'CHAT',
      chamadoId: chamadoId,
      senderId: auth.user?.id,
      senderName: auth.user?.name || auth.user?.username || 'Usuário',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };
    
    // Criar cópias dos anexos para a mensagem otimista
    const currentAttachments = [...attachments];
    
    // Mostrar anexos na mensagem otimista
    const optimisticAttachments = currentAttachments.map((file, index) => ({
      id: `temp-attachment-${index}`,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      isImage: file.type.startsWith('image/'),
      url: URL.createObjectURL(file)
    }));
    
    // Limpar anexos atuais
    setAttachments([]);
    
    // Criar mensagem otimista para mostrar imediatamente
    const optimisticMessage = {
      ...messageObj,
      id: optimisticId,
      _isOptimistic: true,
      isSentByCurrentUser: true,
      attachments: optimisticAttachments
    };
    
    // Adicionar mensagem otimista à lista
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      let success = false;
      
      // Tentar enviar via WebSocket (apenas mensagem de texto, sem anexos)
      if (isWebSocketEnabled && websocketService.isConnected && currentAttachments.length === 0) {
        try {
          success = websocketService.sendMessage(chamadoId, messageObj);
          console.log('Mensagem enviada via WebSocket:', success);
        } catch (wsError) {
          console.error('Erro ao enviar mensagem via WebSocket:', wsError);
          success = false;
        }
      }
      
      // Se falhar ou tiver anexos, enviar via API
      if (!success || currentAttachments.length > 0) {
        console.log('Enviando mensagem via API');
        
        // Criar FormData para envio da mensagem com anexos
        const formData = new FormData();
        formData.append('conteudo', currentMessage);
        
        // Adicionar anexos ao FormData
        currentAttachments.forEach(file => {
          formData.append('anexos', file);
        });
        
        // Enviar para a API
        await chamadoService.enviarMensagemComAnexos(chamadoId, formData);
        
        // Remover mensagem otimista
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        
        // Atualizar mensagens
        throttledFetchMessages(true);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Remover mensagem otimista em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      
      // Restaurar input e anexos
      setMessageInput(currentMessage);
      setAttachments(currentAttachments);
      
      // Exibir notificação de erro
      setNotification({
        open: true,
        message: 'Não foi possível enviar a mensagem. Tente novamente.',
        type: 'error'
      });
    } finally {
      setIsSending(false);
    }
  }, [messageInput, chamadoId, auth.user?.id, auth.user?.name, auth.user?.username, throttledFetchMessages, isWebSocketEnabled, attachments]);

  // Handler para tecla Enter otimizado
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Handler para fechamento de notificação
  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // Handler para atualizar mensagens
  const handleRefreshMessages = useCallback(() => {
    throttledFetchMessages();

    if (isWebSocketEnabled && !websocketService.isConnected) {
      connectWebSocket();
    }
  }, [throttledFetchMessages, connectWebSocket, isWebSocketEnabled]);

  // Verificar se o chat está desativado
  const isChatDisabled = chamadoStatus !== 'EM_ATENDIMENTO';

  // Iniciar upload de diferentes tipos
  const handleUploadPhoto = useCallback(() => {
    fileInputRef.current.accept = 'image/*';
    fileInputRef.current.click();
    handleAttachmentMenuClose();
  }, []);

  const handleUploadDocument = useCallback(() => {
    fileInputRef.current.accept = '.pdf,.doc,.docx,.txt,.xlsx,.xls';
    fileInputRef.current.click();
    handleAttachmentMenuClose();
  }, []);

  const handleUploadAny = useCallback(() => {
    fileInputRef.current.accept = '*/*';
    fileInputRef.current.click();
    handleAttachmentMenuClose();
  }, []);

  // Helper para determinar o ícone correto para o anexo
  const getAttachmentIcon = useCallback((file) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon />;
    } else if (file.type === 'application/pdf') {
      return <PictureAsPdfIcon />;
    } else {
      return <InsertDriveFileIcon />;
    }
  }, []);

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
        ) : processedMessages.length > 0 ? (
          <>
            {processedMessages.map((message) => (
              <ChatMessage
                key={message.id || `msg-${message.timestamp}`}
                message={message}
                formatTime={formatTime}
                getInitial={getInitial}
                getUserRole={getUserRole}
              />
            ))}
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
      
      {/* Seção de anexos selecionados */}
      {attachments.length > 0 && (
        <Box 
          sx={{ 
            p: 1, 
            borderTop: '1px solid #e0e0e0',
            bgcolor: '#f0f0f0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          {attachments.map((file, index) => (
            <Box 
              key={index}
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                p: 0.5,
                pl: 1,
                maxWidth: '200px'
              }}
            >
              {getAttachmentIcon(file)}
              <Typography variant="caption" sx={{ ml: 0.5, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => handleRemoveAttachment(index)}
                sx={{ p: 0.5, ml: 0.5 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
      
      {/* Área de input do chat */}
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
          
          {/* Botão de anexo */}
          <Tooltip title="Anexar arquivo">
            <span>
              <IconButton
                color="primary"
                onClick={handleAttachmentClick}
                disabled={isChatDisabled || isSending}
                sx={{ bgcolor: 'white', border: '1px solid #e0e0e0' }}
              >
                <Badge badgeContent={attachments.length} color="primary" invisible={attachments.length === 0}>
                  <AttachFileIcon />
                </Badge>
              </IconButton>
            </span>
          </Tooltip>
          
          {/* Menu de tipos de anexo */}
          <Menu
            anchorEl={attachmentMenuAnchor}
            open={Boolean(attachmentMenuAnchor)}
            onClose={handleAttachmentMenuClose}
          >
            <MenuItem onClick={handleUploadPhoto}>
              <ImageIcon sx={{ mr: 1 }} /> Imagem
            </MenuItem>
            <MenuItem onClick={handleUploadDocument}>
              <PictureAsPdfIcon sx={{ mr: 1 }} /> Documento
            </MenuItem>
            <MenuItem onClick={handleUploadAny}>
              <InsertDriveFileIcon sx={{ mr: 1 }} /> Qualquer arquivo
            </MenuItem>
          </Menu>
          
          {/* Input file oculto */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            multiple
          />
          
          <Button
            variant="contained"
            color="primary"
            endIcon={isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            onClick={handleSendMessage}
            disabled={isChatDisabled || (!messageInput.trim() && attachments.length === 0) || isSending}
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

export default React.memo(MemoizedChatComponent);