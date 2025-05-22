import { useState, useEffect, useContext, useRef } from 'react';
import { ticketService } from '../services/ticketService';
import AuthContext from '../context/AuthContext';

export const useChat = (ticketId, ticketStatus) => {
  const { auth } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'info' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Extrair username do token JWT atual
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
    
    // Extrair informações do remetente da mensagem
    const senderUsername = message.sender?.username || message.remetente?.username;
    const senderId = message.sender?.id || message.remetente?.id || message.senderId;
    
    // Comparar por username (mais confiável)
    if (senderUsername && currentUser.username) {
      return senderUsername === currentUser.username;
    }
    
    // Fallback: comparar por ID
    if (senderId && currentUser.userId) {
      return senderId.toString() === currentUser.userId.toString();
    }
    
    return false;
  };
  
  useEffect(() => {
    if (ticketId) {
      refreshMessages();
    }
  }, [ticketId]);
  
  const refreshMessages = async () => {
    if (!ticketId) return;
    
    try {
      setLoading(true);
      const data = await ticketService.getTicketMessages(ticketId);
      
      if (Array.isArray(data)) {
        const processedMessages = data.map(msg => {
          const isOwn = isMyMessage(msg);
          
          return {
            ...msg,
            isOwnMessage: isOwn,
            content: msg.content || msg.conteudo || '',
            sentDate: msg.sentDate || msg.dataEnvio,
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
      console.error("Erro ao buscar mensagens:", err);
      setError('Não foi possível carregar as mensagens. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMessageChange = (e) => {
    setMessageInput(e.target.value);
  };
  
  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedImage) || isSending) return;
    
    setIsSending(true);
    const currentMessage = messageInput;
    setMessageInput('');
    
    const currentUser = getCurrentUserIdentifier();
    
    // Mensagem otimista com dados do usuário atual
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
        const formData = new FormData();
        formData.append('content', currentMessage);
        formData.append('image', selectedImage);
        response = await ticketService.sendMessageWithImage(ticketId, formData);
      } else {
        response = await ticketService.sendMessage(ticketId, {
          content: currentMessage
        });
      }
      
      // Processar resposta garantindo que seja marcada como própria
      const processedResponse = {
        ...response,
        isOwnMessage: true,
        content: response.content || response.conteudo || currentMessage,
        sentDate: response.sentDate || response.dataEnvio || new Date().toISOString(),
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
      
      // Remover mensagem otimista e adicionar a real
      setMessages(prev => 
        prev.filter(m => m.id !== optimisticId).concat([processedResponse])
      );
      
      setSelectedImage(null);
      setImagePreview(null);
      
      // Recarregar mensagens para garantir sincronização
      setTimeout(() => {
        refreshMessages();
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setNotification({
        open: true,
        message: 'Apenas imagens são permitidas',
        type: 'error'
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setNotification({
        open: true,
        message: 'O arquivo deve ter menos de 5MB',
        type: 'error'
      });
      return;
    }
    
    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };
  
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  return {
    messages,
    loading,
    error,
    isSending,
    messageInput,
    selectedImage,
    imagePreview,
    notification,
    refreshMessages,
    handleMessageChange,
    handleSendMessage,
    handleFileSelect,
    handleRemoveImage,
    handleCloseNotification
  };
};