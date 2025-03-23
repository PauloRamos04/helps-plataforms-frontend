// src/components/chat/ChatComponent.js
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

// Componente para exibir uma mensagem no chat
const ChatMessage = ({ message, isOwn }) => {
  // Extrair a data da mensagem, seja do formato de websocket ou do formato da API REST
  const timestamp = message.timestamp || message.dataEnvio;
  
  const messageTime = timestamp ? 
    new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }) : 
    '';

  // Extrair o nome do remetente, independente do formato da mensagem
  const senderName = message.senderName || 
                    message.remetente?.name || 
                    message.remetente?.username || 
                    'Usuário';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        mb: 2,
        maxWidth: '80%',
        alignSelf: isOwn ? 'flex-end' : 'flex-start'
      }}
    >
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: isOwn ? '#4966f2' : '#e0e0e0',
          color: isOwn ? 'white' : '#333',
          fontSize: '14px',
          mr: isOwn ? 0 : 1,
          ml: isOwn ? 1 : 0
        }}
      >
        {senderName.charAt(0).toUpperCase()}
      </Avatar>
      
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: '8px',
          bgcolor: isOwn ? '#e3f2fd' : '#f5f5f5',
          maxWidth: 'calc(100% - 40px)'
        }}
      >
        {!isOwn && (
          <Typography variant="subtitle2" sx={{ fontSize: '12px', fontWeight: 'medium', mb: 0.5 }}>
            {senderName}
          </Typography>
        )}
        
        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
          {message.content || message.conteudo}
        </Typography>
        
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
          {messageTime}
        </Typography>
      </Paper>
    </Box>
  );
};

// Componente para exibir mensagem de sistema (usuário entrou/saiu)
const SystemMessage = ({ message }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
      <Typography
        variant="caption"
        sx={{
          bgcolor: '#f0f0f0',
          px: 2,
          py: 0.5,
          borderRadius: '12px',
          color: '#666'
        }}
      >
        {message.content}
      </Typography>
    </Box>
  );
};

// Componente principal do chat
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
  const isWebSocketEnabled = true; // Pode ser configurado com base em preferências ou environment

  // Função para obter o histórico de mensagens
  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await chamadoService.getMensagens(chamadoId);
      
      if (data && Array.isArray(data)) {
        // Converter mensagens da API para o formato consistente
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          type: 'CHAT',
          chamadoId: chamadoId,
          senderId: msg.remetente?.id,
          senderName: msg.remetente?.name || msg.remetente?.username || 'Usuário',
          content: msg.conteudo,
          timestamp: msg.dataEnvio,
          // Manter as propriedades originais para compatibilidade
          remetente: msg.remetente,
          conteudo: msg.conteudo,
          dataEnvio: msg.dataEnvio
        }));
        
        setMessages(formattedMessages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError('Não foi possível carregar as mensagens. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para conectar ao WebSocket
  const connectWebSocket = () => {
    if (!isWebSocketEnabled || !chamadoId) return;
    
    setIsConnecting(true);
    
    // Conectar ao WebSocket
    websocketService.connect(
      // onConnected
      () => {
        console.log('Conectado ao WebSocket com sucesso');
        
        // Inscrever no tópico do chamado
        const success = websocketService.subscribeToChamado(chamadoId, (message) => {
          console.log('Mensagem recebida via WebSocket:', message);
          
          if (message.type === 'CHAT') {
            // Adicionar mensagem de chat à lista
            setMessages(prev => [...prev, message]);
          } else if (message.type === 'JOIN') {
            // Adicionar mensagem de sistema - alguém entrou
            setMessages(prev => [...prev, message]);
            setNotification({
              open: true,
              message: `${message.senderName} entrou no chat`,
              type: 'info'
            });
          } else if (message.type === 'LEAVE') {
            // Adicionar mensagem de sistema - alguém saiu
            setMessages(prev => [...prev, message]);
            setNotification({
              open: true,
              message: `${message.senderName} saiu do chat`,
              type: 'info'
            });
          }
        });
        
        if (success) {
          // Notificar que entrou no chat
          websocketService.addUser(chamadoId, {
            type: 'JOIN',
            chamadoId: chamadoId,
            senderId: auth.user?.id,
            senderName: auth.user?.name || auth.user?.username || 'Usuário',
            content: '',
            timestamp: new Date().toISOString()
          });
        } else {
          setNotification({
            open: true,
            message: 'Não foi possível se inscrever no chat em tempo real',
            type: 'warning'
          });
        }
        
        setIsConnecting(false);
      },
      // onError
      (error) => {
        console.error('Erro na conexão WebSocket:', error);
        setError('Erro na conexão com o chat em tempo real. Usando modo offline.');
        setIsConnecting(false);
        // Em caso de erro, usamos apenas o modo REST sem WebSocket
      }
    );
  };

  // Carregar mensagens iniciais e configurar WebSocket
  useEffect(() => {
    if (!chamadoId) return;
    
    // Primeiro carregar o histórico via REST API
    fetchMessages();
    
    // Depois conectar ao WebSocket se estiver habilitado
    if (isWebSocketEnabled) {
      connectWebSocket();
    }
    
    // Limpar ao desmontar
    return () => {
      if (isWebSocketEnabled && websocketService.isConnected) {
        websocketService.unsubscribeFromChamado(chamadoId);
      }
    };
  }, [chamadoId, auth.user]);

  // Rolar para a última mensagem quando as mensagens são atualizadas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Função para enviar uma mensagem
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    setIsSending(true);
    
    // Criar objeto de mensagem
    const messageObj = {
      type: 'CHAT',
      chamadoId: chamadoId,
      senderId: auth.user?.id,
      senderName: auth.user?.name || auth.user?.username || 'Usuário',
      content: messageInput,
      timestamp: new Date().toISOString()
    };
    
    try {
      if (isWebSocketEnabled && websocketService.isConnected) {
        // Enviar via WebSocket se conectado
        const success = websocketService.sendMessage(chamadoId, messageObj);
        
        if (!success) {
          // Se falhar o WebSocket, usar REST API como fallback
          await chamadoService.enviarMensagem(chamadoId, { conteudo: messageInput });
          // Recarregar mensagens para mostrar a nova mensagem
          fetchMessages();
        }
      } else {
        // Usar REST API se WebSocket não estiver habilitado ou conectado
        await chamadoService.enviarMensagem(chamadoId, { conteudo: messageInput });
        // Recarregar mensagens para mostrar a nova mensagem
        fetchMessages();
      }
      
      // Limpar o input após enviar
      setMessageInput('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
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

  const isChatDisabled = chamadoStatus !== 'EM_ATENDIMENTO';

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
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #e0e0e0',
          bgcolor: '#f9f9f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="subtitle1" fontWeight="medium">
          Conversa
          {isWebSocketEnabled && websocketService.isConnected && (
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#4CAF50',
                ml: 1
              }}
            />
          )}
        </Typography>
        
        <Tooltip title="Atualizar conversa">
          <IconButton size="small" onClick={fetchMessages} disabled={isLoading}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          p: 2,
          flexGrow: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={30} sx={{ color: '#4966f2' }} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Button 
              size="small" 
              onClick={fetchMessages} 
              sx={{ mt: 1, color: '#4966f2' }}
            >
              Tentar novamente
            </Button>
          </Box>
        ) : messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: '#999'
            }}
          >
            <Typography variant="body2">
              Nenhuma mensagem ainda. Inicie a conversa!
            </Typography>
          </Box>
        ) : (
          messages.map((message, index) => {
            if (message.type === 'JOIN' || message.type === 'LEAVE') {
              return <SystemMessage key={index} message={message} />;
            } else {
              const isOwn = 
                (message.senderId === auth.user?.id) || 
                (message.remetente?.id === auth.user?.id);
              
              return <ChatMessage key={index} message={message} isOwn={isOwn} />;
            }
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #e0e0e0',
          bgcolor: '#f9f9f9'
        }}
      >
        {isChatDisabled ? (
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              O chat está disponível apenas para chamados em atendimento.
            </Typography>
          </Box>
        ) : isConnecting ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
            <CircularProgress size={24} sx={{ color: '#4966f2', mr: 1 }} />
            <Typography variant="body2">Conectando ao chat...</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              placeholder="Digite sua mensagem..."
              multiline
              maxRows={4}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              size="small"
              disabled={isSending}
              sx={{
                '.MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: '4px'
                }
              }}
            />
            
            <Button
              variant="contained"
              endIcon={<SendIcon />}
              disabled={!messageInput.trim() || isSending}
              onClick={handleSendMessage}
              sx={{
                ml: 1,
                bgcolor: '#4966f2',
                color: 'white',
                '&:hover': {
                  bgcolor: '#3a51d6'
                }
              }}
            >
              {isSending ? 'Enviando...' : 'Enviar'}
            </Button>
          </Box>
        )}
      </Box>
      
      {/* Notificações */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.type} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ChatComponent;