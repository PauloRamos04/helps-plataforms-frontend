import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticketService';

/**
 * Custom hook para ações comuns de tickets como atribuição e fechamento
 */
const useTicketActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const assignTicket = async (ticketId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await ticketService.assignTicket(ticketId);
      setSuccess('Chamado atribuído com sucesso');
      return true;
    } catch (err) {
      setError(err.message || 'Falha ao atribuir chamado');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const closeTicket = async (ticketId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await ticketService.closeTicket(ticketId);
      setSuccess('Chamado finalizado com sucesso');
      return true;
    } catch (err) {
      setError(err.message || 'Falha ao finalizar chamado');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const goToTicketList = () => {
    navigate('/chamados');
  };

  const goToTicketDetail = (ticketId) => {
    navigate(`/chamados/${ticketId}`);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    loading,
    error,
    success,
    assignTicket,
    closeTicket,
    goToTicketList,
    goToTicketDetail,
    clearMessages
  };
};

export default useTicketActions;
export { useTicketActions };