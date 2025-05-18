import { useState, useEffect, useContext } from 'react';
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
  
  useEffect(() => {
    if (ticketId) {
      refreshMessages();
    }
  }, [ticketId]);
  
  const refreshMessages = async () => {
    if (!ticketId) return;
    
    try {
      setLoading(true);
      const data = await ticketService.getMensagens(ticketId);
      
      if (Array.isArray(data)) {
        setMessages(data.map(msg => ({
          id: msg.id,
          senderId: msg.remetente?.id,
          senderName: msg.remetente?.name || msg.remetente?.username || 'Usuário',
          content: msg.conteudo,
          timestamp: msg.dataEnvio,
          sender: msg.remetente,
          imagePath: msg.imagePath
        })));
      }
    } catch (error) {
      setError('Não foi possível carregar as mensagens');
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
    
    try {
      if (selectedImage) {
        const formData = new FormData();
        formData.append('conteudo', messageInput);
        formData.append('image', selectedImage);
        
        await ticketService.enviarMensagemComImagem(ticketId, formData);
      } else {
        await ticketService.enviarMensagem(ticketId, { conteudo: messageInput });
      }
      
      setMessageInput('');
      setSelectedImage(null);
      setImagePreview(null);
      
      // Refresh messages to show the new one
      refreshMessages();
    } catch (error) {
      setNotification({
        open: true,
        message: 'Erro ao enviar mensagem',
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