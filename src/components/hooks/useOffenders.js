import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import useFetch from './useFetch';
import useFetchData from './useFetchData';
import { API_URL } from '@/helpers/Constants';
import { showSuccess, showError, showDeleteConfirm } from '@/helpers/swalConfig';
import { getModulePermissions } from '@/helpers/permissions';

/**
 * Hook personalizado para gestión de infractores
 *
 * @returns {Object} Estados y funciones para gestionar infractores
 */
export const useOffenders = () => {
  const { role: userRole } = useSelector((state) => state.auth);
  const { postData, patchData, deleteData } = useFetch();
  const { fetchOffenders: fetchOffendersData } = useFetchData();

  const [offenders, setOffenders] = useState([]);
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

  const permissions = getModulePermissions(userRole, 'infractores');

  const fetchOffenders = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (filters.search) params.append('search', filters.search);

      const response = await fetchOffendersData(params.toString(), false);

      if (response.status) {
        const data = response.data;
        setOffenders(Array.isArray(data) ? data : data.data || []);

        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        showError('Error', 'No se pudieron cargar los infractores');
        setOffenders([]);
      }
    } catch (error) {
      console.error('Error al cargar infractores:', error);
      showError('Error', 'Ocurrió un error al cargar los infractores');
      setOffenders([]);
    } finally {
      setLoading(false);
    }
  }, [filters.search, fetchOffendersData]);

  const crearOffender = async (offenderData) => {
    try {
      if (!permissions.canCreate) {
        showError('Sin permisos', 'No tienes permisos para crear infractores');
        return false;
      }

      const response = await postData(`${API_URL}/offenders`, offenderData);

      if (response.status) {
        showSuccess('Infractor creado', response.data?.message || 'El infractor se creó correctamente');
        await fetchOffenders(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join('\n')
          : response.message || 'Error al crear el infractor';
        showError('Error', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error al crear infractor:', error);
      showError('Error', error.message || 'Ocurrió un error al crear el infractor');
      return false;
    }
  };

  const actualizarOffender = async (offenderId, offenderData) => {
    try {
      if (!permissions.canEdit) {
        showError('Sin permisos', 'No tienes permisos para editar infractores');
        return false;
      }

      const response = await patchData(`${API_URL}/offenders/${offenderId}`, offenderData);

      if (response.status) {
        showSuccess('Infractor actualizado', response.data?.message || 'El infractor se actualizó correctamente');
        await fetchOffenders(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join('\n')
          : response.message || 'Error al actualizar el infractor';
        showError('Error', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error al actualizar infractor:', error);
      showError('Error', error.message || 'Ocurrió un error al actualizar el infractor');
      return false;
    }
  };

  const eliminarOffender = async (offender) => {
    try {
      if (!permissions.canDelete) {
        showError('Sin permisos', 'No tienes permisos para eliminar infractores');
        return false;
      }

      const confirmed = await showDeleteConfirm('este infractor');
      if (!confirmed) return false;

      const response = await deleteData(`${API_URL}/offenders/${offender.id}`);

      if (response.status) {
        showSuccess('Infractor eliminado', response.data?.message || 'El infractor se eliminó correctamente');
        await fetchOffenders(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        showError('Error', response.message || 'Error al eliminar el infractor');
        return false;
      }
    } catch (error) {
      console.error('Error al eliminar infractor:', error);
      showError('Error', error.message || 'Ocurrió un error al eliminar el infractor');
      return false;
    }
  };

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    fetchOffenders(pagination.currentPage, pagination.perPage);
  }, [fetchOffenders]);

  return {
    offenders,
    loading,
    pagination,
    filters,
    permissions,
    fetchOffenders,
    crearOffender,
    actualizarOffender,
    eliminarOffender,
    updateFilters,
    setPagination
  };
};

export default useOffenders;
