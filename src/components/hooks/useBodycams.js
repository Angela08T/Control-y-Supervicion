import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import useFetch from './useFetch';
import useFetchData from './useFetchData';
import { API_URL } from '@/helpers/Constants';
import { showSuccess, showError, showDeleteConfirm } from '@/helpers/swalConfig';
import { getModulePermissions } from '@/helpers/permissions';

/**
 * Hook personalizado para gestión de bodycams
 *
 * @returns {Object} Estados y funciones para gestionar bodycams
 */
export const useBodycams = () => {
  const { role: userRole } = useSelector((state) => state.auth);
  const { postData, patchData, deleteData } = useFetch();
  const { fetchBodycams: fetchBodycamsData } = useFetchData();

  const [bodycams, setBodycams] = useState([]);
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

  const permissions = getModulePermissions(userRole, 'bodycam');

  const fetchBodycams = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (filters.search) params.append('search', filters.search);

      const response = await fetchBodycamsData(params.toString(), false);

      if (response.status) {
        const data = response.data;
        setBodycams(Array.isArray(data) ? data : data.data || []);

        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        showError('Error', 'No se pudieron cargar las bodycams');
        setBodycams([]);
      }
    } catch (error) {
      console.error('Error al cargar bodycams:', error);
      showError('Error', 'Ocurrió un error al cargar las bodycams');
      setBodycams([]);
    } finally {
      setLoading(false);
    }
  }, [filters.search, fetchBodycamsData]);

  const crearBodycam = async (bodycamData) => {
    try {
      if (!permissions.canCreate) {
        showError('Sin permisos', 'No tienes permisos para crear bodycams');
        return false;
      }

      const response = await postData(`${API_URL}/bodycams`, bodycamData);

      if (response.status) {
        showSuccess('Bodycam creada', response.data?.message || 'La bodycam se creó correctamente');
        await fetchBodycams(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join('\n')
          : response.message || 'Error al crear la bodycam';
        showError('Error', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error al crear bodycam:', error);
      showError('Error', error.message || 'Ocurrió un error al crear la bodycam');
      return false;
    }
  };

  const actualizarBodycam = async (bodycamId, bodycamData) => {
    try {
      if (!permissions.canEdit) {
        showError('Sin permisos', 'No tienes permisos para editar bodycams');
        return false;
      }

      const response = await patchData(`${API_URL}/bodycams/${bodycamId}`, bodycamData);

      if (response.status) {
        showSuccess('Bodycam actualizada', response.data?.message || 'La bodycam se actualizó correctamente');
        await fetchBodycams(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join('\n')
          : response.message || 'Error al actualizar la bodycam';
        showError('Error', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error al actualizar bodycam:', error);
      showError('Error', error.message || 'Ocurrió un error al actualizar la bodycam');
      return false;
    }
  };

  const eliminarBodycam = async (bodycam) => {
    try {
      if (!permissions.canDelete) {
        showError('Sin permisos', 'No tienes permisos para eliminar bodycams');
        return false;
      }

      const confirmed = await showDeleteConfirm('esta bodycam');
      if (!confirmed) return false;

      const response = await deleteData(`${API_URL}/bodycams/${bodycam.id}`);

      if (response.status) {
        showSuccess('Bodycam eliminada', response.data?.message || 'La bodycam se eliminó correctamente');
        await fetchBodycams(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        showError('Error', response.message || 'Error al eliminar la bodycam');
        return false;
      }
    } catch (error) {
      console.error('Error al eliminar bodycam:', error);
      showError('Error', error.message || 'Ocurrió un error al eliminar la bodycam');
      return false;
    }
  };

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    fetchBodycams(pagination.currentPage, pagination.perPage);
  }, [fetchBodycams]);

  return {
    bodycams,
    loading,
    pagination,
    filters,
    permissions,
    fetchBodycams,
    crearBodycam,
    actualizarBodycam,
    eliminarBodycam,
    updateFilters,
    setPagination
  };
};

export default useBodycams;
