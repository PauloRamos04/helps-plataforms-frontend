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
  
  // Estados de filtro e ordenação
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });
  
  const [sortConfig, setSortConfig] = useState({
    field: 'openingDate',
    direction: 'desc'
  });

  // Função para ordenar tickets de forma inteligente
  const sortTickets = useCallback((ticketsToSort) => {
    return [...ticketsToSort].sort((a, b) => {
      // Prioridade por status: EM_ATENDIMENTO > ABERTO > FECHADO
      const statusPriority = {
        'EM_ATENDIMENTO': 3,
        'IN_PROGRESS': 3,
        'ABERTO': 2,
        'OPEN': 2,
        'FECHADO': 1,
        'CLOSED': 1
      };
      
      const aPriority = statusPriority[a.status] || 0;
      const bPriority = statusPriority[b.status] || 0;
      
      // Se os status são diferentes, ordenar por prioridade
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Se os status são iguais, ordenar por data de abertura (mais recente primeiro)
      const aDate = new Date(a.openingDate || 0);
      const bDate = new Date(b.openingDate || 0);
      
      // Verificar se as datas são válidas
      if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0;
      if (isNaN(aDate.getTime())) return 1;
      if (isNaN(bDate.getTime())) return -1;
      
      return bDate - aDate;
    });
  }, []);

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
    
    // Filtro de busca (pesquisa em título, descrição, ID)
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      filtered = filtered.filter(ticket => 
        (ticket.title?.toLowerCase().includes(searchTerm)) || 
        (ticket.titulo?.toLowerCase().includes(searchTerm)) ||
        (ticket.description?.toLowerCase().includes(searchTerm)) ||
        (ticket.descricao?.toLowerCase().includes(searchTerm)) ||
        (ticket.id?.toString().includes(searchTerm)) ||
        (getUserDisplayName(ticket).toLowerCase().includes(searchTerm))
      );
    }
    
    // Aplicar ordenação inteligente
    const sortedTickets = sortTickets(filtered);
    setFilteredTickets(sortedTickets);
  }, [filters, sortTickets]);

  // Função auxiliar para obter nome do usuário
  const getUserDisplayName = (ticket) => {
    const user = ticket.user || ticket.usuario || ticket.solicitante;
    if (!user) return 'Usuário não identificado';
    
    return user.name || user.nome || user.username || 'Usuário';
  };

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

  // Função para atualizar ordenação
  const updateSort = useCallback((field, direction) => {
    setSortConfig({ field, direction });
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
    sortConfig,
    fetchTickets,
    updateFilters,
    clearFilters,
    updateSort,
    applyFilters
  };
};

export default useTickets;