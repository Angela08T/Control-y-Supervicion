import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import useFetch from './useFetch';
import useFetchData from './useFetchData';
import { API_URL } from '@/helpers/Constants';
import { showSuccess, showError, showDeleteConfirm } from '@/helpers/swalConfig';
import { getModulePermissions } from '@/helpers/permissions';

/**
 * Hook personalizado para gestión de faltas
 *
 * @returns {Object} Estados y funciones para gestionar faltas
 */
export const useLacks = () => {
  const { role: userRole } = useSelector((state) => state.auth);
  const { postData, patchData, deleteData } = useFetch();
  const { fetchLacks: fetchLacksData } = useFetchData();

  const [lacks, setLacks] = useState([]);
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

  const permissions = getModulePermissions(userRole, 'faltas');

  const fetchLacks = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (filters.search) params.append('search', filters.search);

      const response = await fetchLacksData(params.toString(), false);

      if (response.status) {
        const data = response.data;
        setLacks(Array.isArray(data) ? data : data.data || []);

        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        showError('Error', 'No se pudieron cargar las faltas');
        setLacks([]);
      }
    } catch (error) {
      console.error('Error al cargar faltas:', error);
      showError('Error', 'Ocurrió un error al cargar las faltas');
      setLacks([]);
    } finally {
      setLoading(false);
    }
  }, [filters.search, fetchLacksData]);

  const crearLack = async (lackData) => {
    try {
      if (!permissions.canCreate) {
        showError('Sin permisos', 'No tienes permisos para crear faltas');
        return false;
      }

      const response = await postData(`${API_URL}/lacks`, lackData);

      if (response.status) {
        showSuccess('Falta creada', response.data?.message || 'La falta se creó correctamente');
        await fetchLacks(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join('\n')
          : response.message || 'Error al crear la falta';
        showError('Error', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error al crear falta:', error);
      showError('Error', error.message || 'Ocurrió un error al crear la falta');
      return false;
    }
  };

  const actualizarLack = async (lackId, lackData) => {
    try {
      if (!permissions.canEdit) {
        showError('Sin permisos', 'No tienes permisos para editar faltas');
        return false;
      }

      const response = await patchData(`${API_URL}/lacks/${lackId}`, lackData);

      if (response.status) {
        showSuccess('Falta actualizada', response.data?.message || 'La falta se actualizó correctamente');
        await fetchLacks(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join('\n')
          : response.message || 'Error al actualizar la falta';
        showError('Error', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error al actualizar falta:', error);
      showError('Error', error.message || 'Ocurrió un error al actualizar la falta');
      return false;
    }
  };

  const eliminarLack = async (lack) => {
    try {
      if (!permissions.canDelete) {
        showError('Sin permisos', 'No tienes permisos para eliminar faltas');
        return false;
      }

      const confirmed = await showDeleteConfirm('esta falta');
      if (!confirmed) return false;

      const response = await deleteData(`${API_URL}/lacks/${lack.id}`);

      if (response.status) {
        showSuccess('Falta eliminada', response.data?.message || 'La falta se eliminó correctamente');
        await fetchLacks(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        showError('Error', response.message || 'Error al eliminar la falta');
        return false;
      }
    } catch (error) {
      console.error('Error al eliminar falta:', error);
      showError('Error', error.message || 'Ocurrió un error al eliminar la falta');
      return false;
    }
  };

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    fetchLacks(pagination.currentPage, pagination.perPage);
  }, [fetchLacks]);

  return {
    lacks,
    loading,
    pagination,
    filters,
    permissions,
    fetchLacks,
    crearLack,
    actualizarLack,
    eliminarLack,
    updateFilters,
    setPagination
  };
};

export default useLacks;
