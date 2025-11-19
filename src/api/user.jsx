import api from './config';

/**
 * API unificada para gestión de usuarios (Supervisores y Sentinels)
 * Todos los endpoints ahora usan /user
 */

// ==================== FUNCIONES PRINCIPALES ====================

/**
 * Crear un usuario (Supervisor o Sentinel)
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.name - Nombre
 * @param {string} userData.lastname - Apellido
 * @param {string} userData.username - Usuario
 * @param {string} userData.password - Contraseña
 * @param {string} userData.email - Email
 * @param {string} userData.rol - Rol: "SUPERVISOR" o "SENTINEL"
 * @returns {Promise} - Respuesta con el usuario creado
 */
export const createUser = async (userData) => {
  try {
    console.log('📤 Datos enviados al backend:', JSON.stringify(userData, null, 2));
    const response = await api.post('/user', userData);
    console.log('✅ Usuario creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    console.error('📥 Respuesta del servidor:', error.response?.data);
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al crear usuario: ' + error.message);
    }
  }
};

/**
 * Obtener todos los usuarios con paginación y filtros
 * @param {number} page - Número de página
 * @param {number} limit - Límite de registros por página
 * @param {string} rol - Filtro por rol (opcional): ADMINISTRATOR, SUPERVISOR, SENTINEL, VALIDATOR
 * @param {string} search - Término de búsqueda (opcional)
 * @returns {Promise} - Respuesta con usuarios
 */
export const getUsers = async (page = 1, limit = 10, rol = null, search = null) => {
  try {
    const params = { page, limit };

    // Agregar filtro de rol si existe
    if (rol) {
      params.rol = rol;
    }

    // Agregar búsqueda si existe
    if (search) {
      params.search = search;
    }

    const response = await api.get('/user', { params });
    console.log('✅ Usuarios obtenidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    throw error;
  }
};

/**
 * Buscar usuarios
 * @param {string} searchTerm - Término de búsqueda
 * @param {string} rol - Filtro por rol (opcional)
 * @returns {Promise} - Respuesta con usuarios encontrados
 */
export const searchUser = async (searchTerm, rol = null) => {
  try {
    const params = { search: searchTerm };

    // Agregar filtro de rol si existe
    if (rol) {
      params.rol = rol;
    }

    const response = await api.get('/user', { params });
    console.log('✅ Búsqueda de usuarios:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al buscar usuarios:', error);
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al buscar usuarios: ' + error.message);
    }
  }
};

/**
 * Filtrar usuarios por rol
 * @param {string} rol - Rol a filtrar: ADMINISTRATOR, SUPERVISOR, SENTINEL, VALIDATOR
 * @param {number} page - Número de página
 * @param {number} limit - Límite de registros por página
 * @returns {Promise} - Respuesta con usuarios filtrados
 */
export const getUsersByRole = async (rol, page = 1, limit = 10) => {
  try {
    const response = await api.get('/user', {
      params: { rol, page, limit }
    });
    console.log(`✅ Usuarios con rol ${rol} obtenidos:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error al obtener usuarios con rol ${rol}:`, error);
    throw error;
  }
};

/**
 * Actualizar un usuario
 * @param {string} userId - ID del usuario
 * @param {Object} userData - Datos a actualizar
 * @returns {Promise} - Respuesta con el usuario actualizado
 */
export const updateUser = async (userId, userData) => {
  try {
    const response = await api.patch(`/user/${userId}`, userData);
    console.log('✅ Usuario actualizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al actualizar usuario: ' + error.message);
    }
  }
};

/**
 * Eliminar un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise} - Respuesta de eliminación
 */
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/user/${userId}`);
    console.log('🗑️ Usuario eliminado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al eliminar usuario: ' + error.message);
    }
  }
};

// ==================== FUNCIONES DE COMPATIBILIDAD ====================
// Estas funciones mantienen la interfaz antigua pero usan el nuevo endpoint

/**
 * Crear un supervisor (compatibilidad)
 */
export const createSupervisor = async (userData) => {
  return createUser({ ...userData, rol: 'SUPERVISOR' });
};

/**
 * Crear un sentinel (compatibilidad)
 */
export const createSentinel = async (userData) => {
  return createUser({ ...userData, rol: 'SENTINEL' });
};

/**
 * Buscar supervisores (compatibilidad)
 */
export const searchSupervisor = async (searchTerm) => {
  return searchUser(searchTerm);
};

/**
 * Buscar sentinels (compatibilidad)
 */
export const searchSentinel = async (searchTerm) => {
  return searchUser(searchTerm);
};

/**
 * Obtener supervisores (compatibilidad)
 */
export const getSupervisors = async (page = 1, limit = 10) => {
  return getUsers(page, limit);
};

/**
 * Obtener sentinels (compatibilidad)
 */
export const getSentinels = async (page = 1, limit = 10) => {
  return getUsers(page, limit);
};

/**
 * Actualizar supervisor (compatibilidad)
 */
export const updateSupervisor = async (supervisorId, userData) => {
  return updateUser(supervisorId, userData);
};

/**
 * Actualizar sentinel (compatibilidad)
 */
export const updateSentinel = async (sentinelId, userData) => {
  return updateUser(sentinelId, userData);
};

/**
 * Eliminar supervisor (compatibilidad)
 */
export const deleteSupervisor = async (supervisorId) => {
  return deleteUser(supervisorId);
};

/**
 * Eliminar sentinel (compatibilidad)
 */
export const deleteSentinel = async (sentinelId) => {
  return deleteUser(sentinelId);
};
