import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import useFetch from './useFetch';
import useFetchData from './useFetchData';
import { API_URL } from '@/helpers/Constants';
import { showSuccess, showError, showDeleteConfirm } from '@/helpers/swalConfig';
import { getModulePermissions } from '@/helpers/permissions';

/**
 * Hook personalizado para gestión de personal
 *
 * @returns {Object} Estados y funciones para gestionar personal
 */
export const useLeads = () => {
  const { role: userRole } = useSelector((state) => state.auth);
  const { postData, patchData, deleteData } = useFetch();
  const { fetchLeads: fetchLeadsData } = useFetchData();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: ''
  });

  const permissions = getModulePermissions(userRole, 'personal');

  const fetchLeads = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (filters.search) params.append('search', filters.search);

      const response = await fetchLeadsData(params.toString(), false);

      if (response.status) {
        const data = response.data;
        setLeads(Array.isArray(data) ? data : data.data || []);

        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        showError('Error', 'No se pudo cargar el personal');
        setLeads([]);
      }
    } catch (error) {
      console.error('Error al cargar personal:', error);
      showError('Error', 'Ocurrió un error al cargar el personal');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [filters.search, fetchLeadsData]);

  const crearLead = async (leadData) => {
    try {
      if (!permissions.canCreate) {
        showError('Sin permisos', 'No tienes permisos para crear personal');
        return false;
      }

      const response = await postData(`${API_URL}/leads`, leadData);

      if (response.status) {
        showSuccess('Personal creado', response.data?.message || 'El personal se creó correctamente');
        await fetchLeads(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join('\n')
          : response.message || 'Error al crear el personal';
        showError('Error', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error al crear personal:', error);
      showError('Error', error.message || 'Ocurrió un error al crear el personal');
      return false;
    }
  };

  const actualizarLead = async (leadId, leadData) => {
    try {
      if (!permissions.canEdit) {
        showError('Sin permisos', 'No tienes permisos para editar personal');
        return false;
      }

      const response = await patchData(`${API_URL}/leads/${leadId}`, leadData);

      if (response.status) {
        showSuccess('Personal actualizado', response.data?.message || 'El personal se actualizó correctamente');
        await fetchLeads(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join('\n')
          : response.message || 'Error al actualizar el personal';
        showError('Error', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error al actualizar personal:', error);
      showError('Error', error.message || 'Ocurrió un error al actualizar el personal');
      return false;
    }
  };

  const eliminarLead = async (lead) => {
    try {
      if (!permissions.canDelete) {
        showError('Sin permisos', 'No tienes permisos para eliminar personal');
        return false;
      }

      const confirmed = await showDeleteConfirm('este personal');
      if (!confirmed) return false;

      const response = await deleteData(`${API_URL}/leads/${lead.id}`);

      if (response.status) {
        showSuccess('Personal eliminado', response.data?.message || 'El personal se eliminó correctamente');
        await fetchLeads(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        showError('Error', response.message || 'Error al eliminar el personal');
        return false;
      }
    } catch (error) {
      console.error('Error al eliminar personal:', error);
      showError('Error', error.message || 'Ocurrió un error al eliminar el personal');
      return false;
    }
  };

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    fetchLeads(pagination.currentPage, pagination.perPage);
  }, [fetchLeads]);

  return {
    leads,
    loading,
    pagination,
    filters,
    permissions,
    fetchLeads,
    crearLead,
    actualizarLead,
    eliminarLead,
    updateFilters,
    setPagination
  };
};

export default useLeads;
