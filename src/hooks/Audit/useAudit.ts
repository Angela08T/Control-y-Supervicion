import { useState, useEffect } from 'react';
import { getAllAudits } from '../../api/audit';
import type { Action, Audit, AuditFilters, Model, PaginatedResponse, PaginationMeta, Status } from '@/types';
import { PAGE_SIZE } from '@/hooks/usePagedList';

/** Estado de filtros de la tabla de auditoría ('' = sin filtro) */
export interface AuditFilterState {
  action: Action | '';
  model: Model | '';
  status: Status | '';
  search: string;
}

/** Forma mínima de un error de axios usada para leer el mensaje del backend */
interface AuditApiError {
  response?: { data?: { message?: string } };
}

export interface UseAuditResult {
  audits: Audit[];
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  filters: AuditFilterState;
  changePage: (newPage: number) => void;
  updateFilters: (newFilters: Partial<AuditFilterState>) => void;
  resetFilters: () => void;
}

const useAudit = (): UseAuditResult => {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = PAGE_SIZE;
  const [pagination, setPagination] = useState<PaginationMeta>({
    currentPage: 1,
    pageCount: PAGE_SIZE,
    totalCount: 0,
    totalPages: 1
  });

  // Filtros
  const [filters, setFilters] = useState<AuditFilterState>({
    action: '',
    model: '',
    status: '',
    search: ''
  });

  // Debounced search term
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Debounce effect para search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500); // 500ms de delay

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Cargar datos cuando cambien filtros o página
  useEffect(() => {
    const fetchAudits = async () => {
      setLoading(true);
      setError(null);

      try {
        // Preparar filtros solo con valores no vacíos
        const activeFilters: AuditFilters = {};
        if (filters.action) activeFilters.action = filters.action;
        if (filters.model) activeFilters.model = filters.model;
        if (filters.status) activeFilters.status = filters.status;
        if (debouncedSearch) activeFilters.search = debouncedSearch;

        const response: PaginatedResponse<Audit> = await getAllAudits(currentPage, itemsPerPage, activeFilters);

        // Estructura esperada: { message: "...", data: { data: [...], currentPage, pageCount, totalCount, totalPages } }
        if (response.data) {
          setAudits(response.data.data || []);
          setPagination({
            currentPage: response.data.currentPage || 1,
            pageCount: response.data.pageCount || PAGE_SIZE,
            totalCount: response.data.totalCount || 0,
            totalPages: response.data.totalPages || 1
          });
        }
      } catch (err) {
        const apiError = err as AuditApiError;
        setError(apiError.response?.data?.message || 'Error al obtener registros de auditoría');
        setAudits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAudits();
  }, [currentPage, itemsPerPage, filters.action, filters.model, filters.status, debouncedSearch]);

  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const updateFilters = (newFilters: Partial<AuditFilterState>) => {
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
    changePage,
    updateFilters,
    resetFilters
  };
};

export default useAudit;
