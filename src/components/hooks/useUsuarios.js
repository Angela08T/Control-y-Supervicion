import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import useFetch from '@/Components/hooks/useFetch';
import useFetchData from '@/Components/hooks/useFetchData';
import { API_URL } from '@/helpers/Constants';
import { showSuccess, showError, showDeleteConfirm } from '@/helpers/swalConfig';

/**
 * Hook personalizado para gestión de usuarios
 *
 * ⭐ PATRÓN HÍBRIDO:
 * - useFetchData → Para obtener datos (con caché si es necesario)
 * - useFetch → Para operaciones CRUD (crear, actualizar, eliminar)
 *
 * Centraliza toda la lógica de negocio relacionada con usuarios:
 * - Obtener lista de usuarios
 * - Crear usuarios
 * - Actualizar usuarios
 * - Eliminar/Toggle estado de usuarios
 * - Gestión de permisos por rol
 * - Búsqueda y filtrado
 *
 * @returns {Object} Estados y funciones para gestionar usuarios
 */
export const useUsuarios = () => {
  const { role: userRole } = useSelector((state) => state.auth);

  // ⭐ useFetch para operaciones CRUD (POST, PATCH, DELETE)
  const { postData, patchData, deleteData } = useFetch();

  // ⭐ useFetchData para obtener datos (GET con caché opcional)
  const { fetchUsuarios: fetchUsuariosData, fetchRoles } = useFetchData();

  // Estados
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]); // ⭐ Roles para el formulario
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    roleFilter: 'all'
  });

  // Permisos según rol del usuario actual
  const permissions = {
    canCreateAdmin: userRole === 'admin',
    canCreateSupervisor: userRole === 'admin',
    canCreateValidator: userRole === 'admin',
    canCreateSentinel: userRole === 'admin' || userRole === 'supervisor',
    canCreate: userRole === 'admin' || userRole === 'supervisor',
    canEdit: userRole === 'admin' || userRole === 'supervisor',
    canDelete: userRole === 'admin' || userRole === 'supervisor'
  };

  /**
   * Obtiene la lista de usuarios desde el backend
   * ⭐ Usa useFetchData para aprovechar el sistema de caché si es necesario
   * Aplica filtros de búsqueda y rol
   */
  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const searchTerm = filters.search.trim();
      const selectedRole = filters.roleFilter !== 'all' ? filters.roleFilter : null;

      // Construir parámetros de URL
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '1000');
      if (selectedRole) params.append('role', selectedRole);
      if (searchTerm) params.append('search', searchTerm);

      // ⭐ Usar fetchUsuariosData de useFetchData (sin caché porque filtra)
      const response = await fetchUsuariosData(params.toString(), false);

      if (response.status) {
        const data = response.data;
        setUsuarios(Array.isArray(data) ? data : []);
      } else {
        showError('Error', response.message || 'No se pudieron cargar los usuarios');
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      showError('Error', 'Ocurrió un error al cargar los usuarios');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.roleFilter, fetchUsuariosData]);

  /**
   * Obtiene los roles disponibles
   * ⭐ Usa useFetchData CON caché porque los roles no cambian seguido
   */
  const cargarRoles = useCallback(async () => {
    try {
      // ⭐ Con caché = true (los roles se cachean por 8 horas)
      const response = await fetchRoles(true);

      if (response.status) {
        setRoles(response.data || []);
      }
    } catch (error) {
      console.error('Error al cargar roles:', error);
    }
  }, [fetchRoles]);

  /**
   * Crea un nuevo usuario
   * ⭐ Usa useFetch.postData para operaciones de escritura
   * @param {Object} userData - Datos del usuario a crear
   * @returns {Promise<boolean>} True si se creó correctamente
   */
  const crearUsuario = async (userData) => {
    try {
      // Validar permisos
      if (userData.rol === 'ADMIN' && !permissions.canCreateAdmin) {
        showError('Sin permisos', 'No tienes permisos para crear administradores');
        return false;
      }

      if (userData.rol === 'SUPERVISOR' && !permissions.canCreateSupervisor) {
        showError('Sin permisos', 'No tienes permisos para crear supervisores');
        return false;
      }

      if (userData.rol === 'VALIDATOR' && !permissions.canCreateValidator) {
        showError('Sin permisos', 'No tienes permisos para crear validadores');
        return false;
      }

      if (!permissions.canCreateSentinel) {
        showError('Sin permisos', 'No tienes permisos para crear usuarios');
        return false;
      }

      // ⭐ useFetch.postData para crear (operación de escritura)
      const response = await postData(`${API_URL}/users`, userData);

      if (response.status) {
        showSuccess(
          'Usuario creado',
          response.data?.message || 'El usuario se creó correctamente'
        );
        await fetchUsuarios(); // Recargar lista
        return true;
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join('\n')
          : response.message || 'Error al crear el usuario';
        showError('Error', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      showError('Error', error.message || 'Ocurrió un error al crear el usuario');
      return false;
    }
  };

  /**
   * Actualiza un usuario existente
   * ⭐ Usa useFetch.patchData para operaciones de actualización
   * @param {string|number} userId - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  const actualizarUsuario = async (userId, userData) => {
    try {
      if (!permissions.canEdit) {
        showError('Sin permisos', 'No tienes permisos para editar usuarios');
        return false;
      }

      // ⭐ useFetch.patchData para actualizar (operación de escritura)
      const response = await patchData(`${API_URL}/users/${userId}`, userData);

      if (response.status) {
        showSuccess(
          'Usuario actualizado',
          response.data?.message || 'El usuario se actualizó correctamente'
        );
        await fetchUsuarios(); // Recargar lista
        return true;
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join('\n')
          : response.message || 'Error al actualizar el usuario';
        showError('Error', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      showError('Error', error.message || 'Ocurrió un error al actualizar el usuario');
      return false;
    }
  };

  /**
   * Cambia el estado de un usuario (habilitar/deshabilitar)
   * ⭐ Usa useFetch.deleteData para operaciones de eliminación/toggle
   * @param {Object} usuario - Usuario a modificar
   * @returns {Promise<boolean>} True si se modificó correctamente
   */
  const toggleEstadoUsuario = async (usuario) => {
    try {
      if (!permissions.canDelete) {
        showError('Sin permisos', 'No tienes permisos para modificar el estado de usuarios');
        return false;
      }

      const isEnabled = !usuario.deleted_at;
      const action = isEnabled ? 'deshabilitar' : 'habilitar';
      const confirmMessage = isEnabled
        ? '¿Estás seguro de deshabilitar este usuario? Ya no podrá acceder al sistema.'
        : '¿Estás seguro de habilitar este usuario? Podrá volver a acceder al sistema.';

      const confirmed = await showDeleteConfirm('este usuario', confirmMessage);
      if (!confirmed) return false;

      // ⭐ useFetch.deleteData para eliminar/toggle (operación de escritura)
      const response = await deleteData(`${API_URL}/users/${usuario.id}`);

      if (response.status) {
        showSuccess(
          'Estado modificado',
          response.data?.message || `Usuario ${action === 'habilitar' ? 'habilitado' : 'deshabilitado'} correctamente`
        );
        await fetchUsuarios(); // Recargar lista
        return true;
      } else {
        showError('Error', response.message || `Error al ${action} el usuario`);
        return false;
      }
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      showError('Error', error.message || 'Ocurrió un error al cambiar el estado del usuario');
      return false;
    }
  };

  /**
   * Actualiza los filtros de búsqueda
   * @param {Object} newFilters - Nuevos filtros a aplicar
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Limpia todos los filtros
   */
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      roleFilter: 'all'
    });
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    fetchUsuarios();
    cargarRoles(); // ⭐ Cargar roles una vez (con caché)
  }, [fetchUsuarios, cargarRoles]);

  return {
    // Estados
    usuarios,
    roles, // ⭐ Roles disponibles (para formularios)
    loading,
    filters,
    permissions,

    // Funciones CRUD
    fetchUsuarios,
    crearUsuario,
    actualizarUsuario,
    toggleEstadoUsuario,

    // Funciones de filtros
    updateFilters,
    clearFilters,
  };
};

export default useUsuarios;
