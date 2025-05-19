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
import ticketService from '../../services/ticketService';

const TicketChat = ({ ticketId, ticketStatus }) => {
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
  const refreshIntervalRef = useRef(null);
  const currentUserId = auth?.user?.id;
  
  // Manter um registro de mensagens enviadas por mim
  const myMessageIdsRef = useRef(new Set());

  // Efeito para configurar a atualização periódica
  useEffect(() => {
    if (!ticketId) return;
    
    fetchMessages();
    
    refreshIntervalRef.current = setInterval(() => {
      fetchMessages(true);
    }, 5000);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [ticketId]);

  // Scroll para o final das mensagens
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchMessages = async (silent = false) => {
    if (!ticketId) return;
    
    try {
      if (!silent) {
        setIsLoading(true);
      }
      
      const data = await ticketService.getTicketMessages(ticketId);
      
      if (data && Array.isArray(data)) {
        // Processamos cada mensagem para decidir sua origem (própria ou não)
        const processedMessages = data.map(msg => {
          // Extrai os IDs para comparação
          const msgId = msg.id?.toString();
          const senderId = msg.senderId || msg.sender?.id || msg.remetente?.id;
          
          // Uma mensagem é minha se:
          // 1. O ID do remetente é o meu OU
          // 2. O ID da mensagem está no meu registro de mensagens enviadas
          const isOwnMessage = 
            senderId === currentUserId || 
            (msgId && myMessageIdsRef.current.has(msgId));
            
          // Se é minha mensagem, adiciona ao registro
          if (isOwnMessage && msgId) {
            myMessageIdsRef.current.add(msgId);
          }
          
          return {
            ...msg,
            isOwnMessage: isOwnMessage, // Propriedade explícita
            // Normaliza os campos para garantir compatibilidade
            content: msg.content || msg.conteudo || '',
            sentDate: msg.sentDate || msg.dataEnvio
          };
        });
        
        // Verificar se há diferenças para evitar re-renders desnecessários
        const hasChanges = processedMessages.length !== messages.length ||
          JSON.stringify(processedMessages.map(m => m.id)) !== 
          JSON.stringify(messages.map(m => m.id));
        
        if (hasChanges) {
          setMessages(processedMessages);
        }
      }
      
      if (error) {
        setError(null);
      }
    } catch (err) {
      console.error("Erro ao buscar mensagens:", err);
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
    // Verifica se há texto ou imagem para enviar
    if ((!messageInput.trim() && !selectedImage) || isSending) return;
    
    setIsSending(true);
    const currentMessage = messageInput;
    setMessageInput('');
    
    // Mensagem otimista claramente marcada como própria
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      isOwnMessage: true,
      senderId: currentUserId,
      sender: auth.user,
      remetente: auth.user,
      content: currentMessage,
      conteudo: currentMessage,
      sentDate: new Date().toISOString(),
      dataEnvio: new Date().toISOString(),
      _isOptimistic: true,
      imagePath: selectedImage ? 'pending' : null
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      let response;
      
      if (selectedImage) {
        console.log("Enviando mensagem com imagem");
        
        const formData = new FormData();
        
        // Mesmo se estiver vazia, vamos enviar a string
        formData.append('content', currentMessage);
        console.log("Content adicionado ao FormData:", formData.get('content'));
        
        formData.append('image', selectedImage);
        console.log("Imagem adicionada:", selectedImage.name);
        
        response = await ticketService.sendMessageWithImage(ticketId, formData);
      } else {
        response = await ticketService.sendMessage(ticketId, {
          content: currentMessage
        });
      }
      
      // Processa a resposta
      const processedResponse = Array.isArray(response) ? response : [response];
      
      // Marca explicitamente a mensagem como própria
      const processedMessages = processedResponse.map(msg => {
        // Adiciona o ID da mensagem ao meu registro
        if (msg.id) {
          myMessageIdsRef.current.add(msg.id.toString());
        }
        
        return {
          ...msg,
          isOwnMessage: true,
          content: msg.content || msg.conteudo || currentMessage,
          sentDate: msg.sentDate || msg.dataEnvio || new Date().toISOString(),
          imagePath: msg.imagePath || null
        };
      });
      
      // Atualiza as mensagens mantendo a marcação "própria"
      setMessages(prev => 
        prev.filter(m => m.id !== optimisticId).concat(processedMessages)
      );
      
      setSelectedImage(null);
      setImagePreview(null);
      
      // Atualiza todas as mensagens após um pequeno delay
      setTimeout(() => {
        fetchMessages(true);
      }, 500);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
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
    
    if (roles.some(role => role === 'ADMIN' || role === 'ROLE_ADMIN')) {
      return "Admin";
    } else if (roles.some(role => role === 'HELPER' || role === 'ROLE_HELPER')) {
      return "Helper";
    }
    
    return null;
  };

  const isChatDisabled = ticketStatus !== 'EM_ATENDIMENTO' && ticketStatus !== 'IN_PROGRESS';

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
        </Typography>
        
        <Tooltip title="Atualizar mensagens">
          <IconButton 
            size="small" 
            onClick={() => fetchMessages()}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
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
              
              // Use diretamente a propriedade isOwnMessage
              const isCurrentUser = message.isOwnMessage;
              
              // Nome para exibição
              const displayName = message.remetente?.name || 
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
                    // Alinhamento baseado em quem enviou a mensagem
                    alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                    mb: 1.5,
                    width: '100%'
                  }}
                >
                  {/* Nome do remetente */}
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
                  </Typography>
                  
                  {/* Container da Mensagem */}
                  <Box
                    sx={{
                      display: 'flex',
                      // Direção baseada em quem enviou
                      flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      maxWidth: '80%'
                    }}
                  >
                    {/* Avatar - só mostra para mensagens de outros */}
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
                    
                    {/* Balão da Mensagem */}
                    <Box
                      sx={{
                        p: 1.5,
                        // Cores diferentes para usuário atual vs outros
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
                      {/* Conteúdo da mensagem */}
                      {content && (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {content}
                        </Typography>
                      )}
                      
                      {/* Imagem anexada (se houver) */}
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
                      
                      {/* Indicador de carregamento para imagem */}
                      {message.imagePath === 'pending' && (
                        <Box sx={{ mt: content ? 1 : 0, display: 'flex', justifyContent: 'center' }}>
                          <CircularProgress size={24} />
                        </Box>
                      )}
                      
                      {/* Horário da mensagem */}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          textAlign: 'right',
                          color: 'text.secondary',
                          mt: 0.5
                        }}
                      >
                        {formatTime(sentDate)}
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

export default TicketChat;