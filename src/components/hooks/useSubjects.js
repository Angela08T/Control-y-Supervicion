import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import useFetch from './useFetch';
import useFetchData from './useFetchData';
import { API_URL } from '@/helpers/Constants';
import { showSuccess, showError, showDeleteConfirm } from '@/helpers/swalConfig';
import { getModulePermissions } from '@/helpers/permissions';

/**
 * Hook personalizado para gestión de asuntos
 *
 * @returns {Object} Estados y funciones para gestionar asuntos
 */
export const useSubjects = () => {
  const { role: userRole } = useSelector((state) => state.auth);
  const { postData, patchData, deleteData } = useFetch();
  const { fetchSubjects: fetchSubjectsData } = useFetchData();

  const [subjects, setSubjects] = useState([]);
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

  const permissions = getModulePermissions(userRole, 'asuntos');

  const fetchSubjects = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (filters.search) params.append('search', filters.search);

      const response = await fetchSubjectsData(params.toString(), false);

      if (response.status) {
        const data = response.data;
        setSubjects(Array.isArray(data) ? data : data.data || []);

        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        showError('Error', 'No se pudieron cargar los asuntos');
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error al cargar asuntos:', error);
      showError('Error', 'Ocurrió un error al cargar los asuntos');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [filters.search, fetchSubjectsData]);

  const crearSubject = async (subjectData) => {
    try {
      if (!permissions.canCreate) {
        showError('Sin permisos', 'No tienes permisos para crear asuntos');
        return false;
      }

      const response = await postData(`${API_URL}/subjects`, subjectData);

      if (response.status) {
        showSuccess('Asunto creado', response.data?.message || 'El asunto se creó correctamente');
        await fetchSubjects(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join('\n')
          : response.message || 'Error al crear el asunto';
        showError('Error', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error al crear asunto:', error);
      showError('Error', error.message || 'Ocurrió un error al crear el asunto');
      return false;
    }
  };

  const actualizarSubject = async (subjectId, subjectData) => {
    try {
      if (!permissions.canEdit) {
        showError('Sin permisos', 'No tienes permisos para editar asuntos');
        return false;
      }

      const response = await patchData(`${API_URL}/subjects/${subjectId}`, subjectData);

      if (response.status) {
        showSuccess('Asunto actualizado', response.data?.message || 'El asunto se actualizó correctamente');
        await fetchSubjects(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join('\n')
          : response.message || 'Error al actualizar el asunto';
        showError('Error', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error al actualizar asunto:', error);
      showError('Error', error.message || 'Ocurrió un error al actualizar el asunto');
      return false;
    }
  };

  const eliminarSubject = async (subject) => {
    try {
      if (!permissions.canDelete) {
        showError('Sin permisos', 'No tienes permisos para eliminar asuntos');
        return false;
      }

      const confirmed = await showDeleteConfirm('este asunto');
      if (!confirmed) return false;

      const response = await deleteData(`${API_URL}/subjects/${subject.id}`);

      if (response.status) {
        showSuccess('Asunto eliminado', response.data?.message || 'El asunto se eliminó correctamente');
        await fetchSubjects(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        showError('Error', response.message || 'Error al eliminar el asunto');
        return false;
      }
    } catch (error) {
      console.error('Error al eliminar asunto:', error);
      showError('Error', error.message || 'Ocurrió un error al eliminar el asunto');
      return false;
    }
  };

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    fetchSubjects(pagination.currentPage, pagination.perPage);
  }, [fetchSubjects]);

  return {
    subjects,
    loading,
    pagination,
    filters,
    permissions,
    fetchSubjects,
    crearSubject,
    actualizarSubject,
    eliminarSubject,
    updateFilters,
    setPagination
  };
};

export default useSubjects;
