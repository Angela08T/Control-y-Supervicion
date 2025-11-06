import api from './config';

/**
 * Crear un supervisor
 * @param {Object} userData - Datos del supervisor
 * @param {string} userData.name - Nombre
 * @param {string} userData.lastname - Apellido
 * @param {string} userData.username - Usuario
 * @param {string} userData.password - Contraseña
 * @param {string} userData.email - Email
 * @returns {Promise} - Respuesta con el supervisor creado
 */
export const createSupervisor = async (userData) => {
  try {
    const response = await api.post('/supervisor', userData);
    console.log(' Supervisor creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('L Error al crear supervisor:', error);
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al crear supervisor: ' + error.message);
    }
  }
};

/**
 * Buscar supervisores
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Promise} - Respuesta con supervisores encontrados
 */
export const searchSupervisor = async (searchTerm) => {
  try {
    const response = await api.get('/supervisor', {
      params: { search: searchTerm }
    });
    return response.data;
  } catch (error) {
    console.error('L Error al buscar supervisores:', error);
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al buscar supervisores: ' + error.message);
    }
  }
};

/**
 * Obtener todos los supervisores con paginación
 * @param {number} page - Número de página
 * @param {number} limit - Límite de registros por página
 * @returns {Promise} - Respuesta con supervisores
 */
export const getSupervisors = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/supervisor?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('L Error al obtener supervisores:', error);
    throw error;
  }
};

/**
 * Actualizar un supervisor
 * @param {string} supervisorId - ID del supervisor
 * @param {Object} userData - Datos a actualizar
 * @returns {Promise} - Respuesta con el supervisor actualizado
 */
export const updateSupervisor = async (supervisorId, userData) => {
  try {
    const response = await api.patch(`/supervisor/${supervisorId}`, userData);
    console.log(' Supervisor actualizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('L Error al actualizar supervisor:', error);
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al actualizar supervisor: ' + error.message);
    }
  }
};

/**
 * Eliminar un supervisor
 * @param {string} supervisorId - ID del supervisor
 * @returns {Promise} - Respuesta de eliminación
 */
export const deleteSupervisor = async (supervisorId) => {
  try {
    const response = await api.delete(`/supervisor/${supervisorId}`);
    console.log('=Ñ Supervisor eliminado:', response.data);
    return response.data;
  } catch (error) {
    console.error('L Error al eliminar supervisor:', error);
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al eliminar supervisor: ' + error.message);
    }
  }
};

// ==================== SENTINEL ====================

/**
 * Crear un sentinel
 * @param {Object} userData - Datos del sentinel
 * @param {string} userData.name - Nombre
 * @param {string} userData.lastname - Apellido
 * @param {string} userData.username - Usuario
 * @param {string} userData.password - Contraseña
 * @param {string} userData.email - Email
 * @returns {Promise} - Respuesta con el sentinel creado
 */
export const createSentinel = async (userData) => {
  try {
    const response = await api.post('/sentinel', userData);
    console.log(' Sentinel creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('L Error al crear sentinel:', error);
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al crear sentinel: ' + error.message);
    }
  }
};

/**
 * Buscar sentinels
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Promise} - Respuesta con sentinels encontrados
 */
export const searchSentinel = async (searchTerm) => {
  try {
    const response = await api.get('/sentinel', {
      params: { search: searchTerm }
    });
    return response.data;
  } catch (error) {
    console.error('L Error al buscar sentinels:', error);
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al buscar sentinels: ' + error.message);
    }
  }
};

/**
 * Obtener todos los sentinels con paginación
 * @param {number} page - Número de página
 * @param {number} limit - Límite de registros por página
 * @returns {Promise} - Respuesta con sentinels
 */
export const getSentinels = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/sentinel?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('L Error al obtener sentinels:', error);
    throw error;
  }
};

/**
 * Actualizar un sentinel
 * @param {string} sentinelId - ID del sentinel
 * @param {Object} userData - Datos a actualizar
 * @returns {Promise} - Respuesta con el sentinel actualizado
 */
export const updateSentinel = async (sentinelId, userData) => {
  try {
    const response = await api.patch(`/sentinel/${sentinelId}`, userData);
    console.log(' Sentinel actualizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('L Error al actualizar sentinel:', error);
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al actualizar sentinel: ' + error.message);
    }
  }
};

/**
 * Eliminar un sentinel
 * @param {string} sentinelId - ID del sentinel
 * @returns {Promise} - Respuesta de eliminación
 */
export const deleteSentinel = async (sentinelId) => {
  try {
    const response = await api.delete(`/sentinel/${sentinelId}`);
    console.log('=Ñ Sentinel eliminado:', response.data);
    return response.data;
  } catch (error) {
    console.error('L Error al eliminar sentinel:', error);
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al eliminar sentinel: ' + error.message);
    }
  }
};
