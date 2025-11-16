import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import useFetch from './useFetch';
import useFetchData from './useFetchData';
import { API_URL } from '@/helpers/Constants';
import { showSuccess, showError, showDeleteConfirm } from '@/helpers/swalConfig';
import { getModulePermissions } from '@/helpers/permissions';

/**
 * Hook personalizado para gestión de cargos
 *
 * @returns {Object} Estados y funciones para gestionar cargos
 */
export const useJobs = () => {
  const { role: userRole } = useSelector((state) => state.auth);
  const { postData, patchData, deleteData } = useFetch();
  const { fetchJobs: fetchJobsData } = useFetchData();

  const [jobs, setJobs] = useState([]);
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

  const permissions = getModulePermissions(userRole, 'cargos');

  const fetchJobs = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (filters.search) params.append('search', filters.search);

      const response = await fetchJobsData(params.toString(), false);

      if (response.status) {
        const data = response.data;
        setJobs(Array.isArray(data) ? data : data.data || []);

        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        showError('Error', 'No se pudieron cargar los cargos');
        setJobs([]);
      }
    } catch (error) {
      console.error('Error al cargar cargos:', error);
      showError('Error', 'Ocurrió un error al cargar los cargos');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [filters.search, fetchJobsData]);

  const crearJob = async (jobData) => {
    try {
      if (!permissions.canCreate) {
        showError('Sin permisos', 'No tienes permisos para crear cargos');
        return false;
      }

      const response = await postData(`${API_URL}/jobs`, jobData);

      if (response.status) {
        showSuccess('Cargo creado', response.data?.message || 'El cargo se creó correctamente');
        await fetchJobs(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join('\n')
          : response.message || 'Error al crear el cargo';
        showError('Error', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error al crear cargo:', error);
      showError('Error', error.message || 'Ocurrió un error al crear el cargo');
      return false;
    }
  };

  const actualizarJob = async (jobId, jobData) => {
    try {
      if (!permissions.canEdit) {
        showError('Sin permisos', 'No tienes permisos para editar cargos');
        return false;
      }

      const response = await patchData(`${API_URL}/jobs/${jobId}`, jobData);

      if (response.status) {
        showSuccess('Cargo actualizado', response.data?.message || 'El cargo se actualizó correctamente');
        await fetchJobs(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join('\n')
          : response.message || 'Error al actualizar el cargo';
        showError('Error', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error al actualizar cargo:', error);
      showError('Error', error.message || 'Ocurrió un error al actualizar el cargo');
      return false;
    }
  };

  const eliminarJob = async (job) => {
    try {
      if (!permissions.canDelete) {
        showError('Sin permisos', 'No tienes permisos para eliminar cargos');
        return false;
      }

      const confirmed = await showDeleteConfirm('este cargo');
      if (!confirmed) return false;

      const response = await deleteData(`${API_URL}/jobs/${job.id}`);

      if (response.status) {
        showSuccess('Cargo eliminado', response.data?.message || 'El cargo se eliminó correctamente');
        await fetchJobs(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        showError('Error', response.message || 'Error al eliminar el cargo');
        return false;
      }
    } catch (error) {
      console.error('Error al eliminar cargo:', error);
      showError('Error', error.message || 'Ocurrió un error al eliminar el cargo');
      return false;
    }
  };

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    fetchJobs(pagination.currentPage, pagination.perPage);
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    pagination,
    filters,
    permissions,
    fetchJobs,
    crearJob,
    actualizarJob,
    eliminarJob,
    updateFilters,
    setPagination
  };
};

export default useJobs;
