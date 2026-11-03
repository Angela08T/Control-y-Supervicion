import { useState, useEffect } from 'react';
import { getAllAudits } from '../../api/audit';

const useAudit = () => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageCount: 10,
    totalCount: 0,
    totalPages: 1
  });

  // Filtros
  const [filters, setFilters] = useState({
    action: '',
    model: '',
    status: '',
    search: ''
  });

  // Debounced search term
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce effect para search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500); // 500ms de delay

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Cargar datos cuando cambien filtros, página o items por página
  useEffect(() => {
    const fetchAudits = async () => {
      setLoading(true);
      setError(null);

      try {
        // Preparar filtros solo con valores no vacíos
        const activeFilters = {};
        if (filters.action) activeFilters.action = filters.action;
        if (filters.model) activeFilters.model = filters.model;
        if (filters.status) activeFilters.status = filters.status;
        if (debouncedSearch) activeFilters.search = debouncedSearch;

        const response = await getAllAudits(currentPage, itemsPerPage, activeFilters);

        // Estructura esperada: { message: "...", data: { data: [...], currentPage, pageCount, totalCount, totalPages } }
        if (response.data) {
          setAudits(response.data.data || []);
          setPagination({
            currentPage: response.data.currentPage || 1,
            pageCount: response.data.pageCount || 10,
            totalCount: response.data.totalCount || 0,
            totalPages: response.data.totalPages || 1
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error al obtener registros de auditoría');
        setAudits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAudits();
  }, [currentPage, itemsPerPage, filters.action, filters.model, filters.status, debouncedSearch]);

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const changeItemsPerPage = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Volver a la primera página al cambiar items por página
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Volver a la primera página al cambiar filtros
  };

  const resetFilters = () => {
    setFilters({
      action: '',
      model: '',
      status: '',
      search: ''
    });
    setCurrentPage(1);
  };

  return {
    audits,
    loading,
    error,
    pagination,
    filters,
    itemsPerPage,
    changePage,
    changeItemsPerPage,
    updateFilters,
    resetFilters
  };
};

export default useAudit;
