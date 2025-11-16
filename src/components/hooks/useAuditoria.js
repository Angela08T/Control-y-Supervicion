import { useState, useCallback, useEffect } from 'react';
import useFetch from './useFetch';
import { API_URL } from '@/helpers/Constants';

/**
 * Hook personalizado para gestión de auditoría
 * Reemplaza components/hooks/Audit/useAudit.js
 *
 * @returns {Object} Estados y funciones para gestionar auditoría
 */
export const useAuditoria = () => {
  const { getData } = useFetch();

  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });
  const [filters, setFilters] = useState({
    action: '',
    model: '',
    status: '',
    username: ''
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /**
   * Obtener logs de auditoría con filtros y paginación
   */
  const fetchAudits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.currentPage);
      params.append('limit', itemsPerPage);

      if (filters.action) params.append('action', filters.action);
      if (filters.model) params.append('model', filters.model);
      if (filters.status) params.append('status', filters.status);
      if (filters.username) params.append('username', filters.username);

      const response = await getData(`${API_URL}/audit?${params.toString()}`, false);

      if (response.status) {
        const data = response.data?.data || response.data || [];
        const auditsList = Array.isArray(data) ? data : (data.data || []);

        setAudits(auditsList);

        // Actualizar paginación
        const totalNum = data.totalCount || auditsList.length;
        const totalPagesNum = Math.ceil(totalNum / itemsPerPage);

        setPagination(prev => ({
          ...prev,
          totalPages: totalPagesNum,
          totalCount: totalNum
        }));
      } else {
        setError('Error al cargar registros de auditoría');
        setAudits([]);
      }
    } catch (err) {
      console.error('Error al obtener auditoría:', err);
      setError(err.message || 'Error al cargar registros de auditoría');
      setAudits([]);
    } finally {
      setLoading(false);
    }
  }, [getData, pagination.currentPage, itemsPerPage, filters]);

  /**
   * Cambiar página
   */
  const changePage = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  }, []);

  /**
   * Cambiar items por página
   */
  const changeItemsPerPage = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  /**
   * Actualizar filtros
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  /**
   * Resetear filtros
   */
  const resetFilters = useCallback(() => {
    setFilters({
      action: '',
      model: '',
      status: '',
      username: ''
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Cargar auditorías cuando cambian los parámetros
  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

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
    resetFilters,
    refetch: fetchAudits
  };
};

export default useAuditoria;
