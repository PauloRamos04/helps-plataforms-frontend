import { useState, useEffect, useCallback, useRef } from 'react';
import { ticketService } from '../services/ticketService';

/**
 * Custom hook para buscar e gerenciar tickets
 */
const useTickets = (initialFetch = true) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredTickets, setFilteredTickets] = useState([]);
  
  // Use useRef para armazenar o estado atual dos tickets e evitar problemas de referência
  const ticketsRef = useRef([]);
  
  // Estados de filtro
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });
  
  // Função para aplicar filtros aos tickets
  const applyFiltersInternal = useCallback(() => {
    const currentTickets = ticketsRef.current;
    const currentFilters = filters;
    
    let filtered = [...currentTickets];
    
    // Filtro de status
    if (currentFilters.status) {
      filtered = filtered.filter(ticket => 
        ticket.status === currentFilters.status
      );
    }
    
    // Filtro de categoria
    if (currentFilters.category) {
      filtered = filtered.filter(ticket => 
        ticket.category === currentFilters.category || 
        ticket.categoria === currentFilters.category
      );
    }
    
    // Filtro de busca (pesquisa em título, descrição)
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      filtered = filtered.filter(ticket => 
        (ticket.title?.toLowerCase().includes(searchTerm)) || 
        (ticket.titulo?.toLowerCase().includes(searchTerm)) ||
        (ticket.description?.toLowerCase().includes(searchTerm)) ||
        (ticket.descricao?.toLowerCase().includes(searchTerm)) ||
        (ticket.id?.toString().includes(searchTerm))
      );
    }
    
    setFilteredTickets(filtered);
  }, [filters]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await ticketService.getTickets();
      setTickets(data);
      ticketsRef.current = data;
      applyFiltersInternal();
    } catch (err) {
      console.error('Erro ao buscar chamados:', err);
      setError(err.message || 'Erro ao buscar chamados');
      setTickets([]);
      setFilteredTickets([]);
      ticketsRef.current = [];
    } finally {
      setLoading(false);
    }
  }, [applyFiltersInternal]);

  // Função para atualizar filtros
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({...prev, ...newFilters}));
  }, []);

  // Função para limpar filtros
  const clearFilters = useCallback(() => {
    setFilters({
      status: '',
      category: '',
      search: ''
    });
  }, []);

  // Função compatível com o código existente
  const applyFilters = useCallback((searchParam, statusParam, categoryParam) => {
    const newFilters = {};
    
    if (searchParam !== undefined) newFilters.search = searchParam || '';
    if (statusParam !== undefined) newFilters.status = statusParam || '';
    if (categoryParam !== undefined) newFilters.category = categoryParam || '';
    
    updateFilters(newFilters);
  }, [updateFilters]);

  // Efeito para busca inicial
  useEffect(() => {
    if (initialFetch) {
      fetchTickets();
    }
  }, [initialFetch, fetchTickets]);

  // Efeito para aplicar filtros quando eles mudarem
  useEffect(() => {
    applyFiltersInternal();
  }, [filters, applyFiltersInternal]);

  return {
    tickets,
    filteredTickets,
    loading,
    error,
    filters,
    fetchTickets,
    updateFilters,
    clearFilters,
    applyFilters
  };
};

export default useTickets;
export { useTickets };