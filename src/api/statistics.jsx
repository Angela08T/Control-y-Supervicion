import api from './config';

/**
 * Obtener estadísticas generales del dashboard
 * @returns {Promise} - Respuesta con estadísticas generales
 */
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/statistics/dashboard');
    return response.data;
  } catch (error) {
    console.warn('Endpoint de estadísticas no disponible, usando datos locales');
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener estadísticas: ' + error.message);
    }
  }
};

/**
 * Obtener lista de personal/serenos activos
 * @returns {Promise} - Respuesta con lista de serenos
 */
export const getActivePersonnel = async () => {
  try {
    const response = await api.get('/personnel/active');
    return response.data;
  } catch (error) {
    console.warn('Endpoint de personal no disponible');
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener personal: ' + error.message);
    }
  }
};

/**
 * Obtener estadísticas de supervisión de campo
 * @returns {Promise} - Respuesta con datos de supervisión
 */
export const getFieldSupervisionStats = async () => {
  try {
    const response = await api.get('/statistics/field-supervision');
    return response.data;
  } catch (error) {
    console.warn('Endpoint de supervisión de campo no disponible');
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener supervisión de campo: ' + error.message);
    }
  }
};

/**
 * Obtener lista de todos los offenders (serenos) para la tabla de personal
 * Utiliza el endpoint de offender existente
 * @returns {Promise} - Respuesta con lista de offenders
 */
export const getAllOffenders = async () => {
  try {
    // Este endpoint debería existir en el backend para obtener todos los offenders
    const response = await api.get('/offender');
    return response.data;
  } catch (error) {
    console.warn('Endpoint de lista de offenders no disponible');
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener lista de offenders: ' + error.message);
    }
  }
};

/**
 * Obtener tendencias del dashboard (evolución de incidencias por fecha y asunto)
 * @param {string} startDate - Fecha de inicio en formato YYYY-MM-DD
 * @param {string} endDate - Fecha de fin en formato YYYY-MM-DD
 * @returns {Promise} - Respuesta con datos de tendencias por día y asunto
 */
export const getDashboardTrends = async (startDate, endDate) => {
  try {
    const response = await api.get('/dashboard/trends/', {
      params: {
        start: startDate,
        end: endDate
      }
    });
    return response.data;
  } catch (error) {
    console.warn('Endpoint de tendencias del dashboard no disponible');
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener tendencias del dashboard: ' + error.message);
    }
  }
};

/**
 * Obtener estadísticas generales del dashboard (incidencias críticas y zonas)
 * @param {string} startDate - Fecha de inicio en formato YYYY-MM-DD
 * @param {string} endDate - Fecha de fin en formato YYYY-MM-DD
 * @returns {Promise} - Respuesta con estadísticas generales
 */
export const getDashboardGeneral = async (startDate, endDate) => {
  try {
    const response = await api.get('/dashboard/general/', {
      params: {
        start: startDate,
        end: endDate
      }
    });
    return response.data;
  } catch (error) {
    console.warn('Endpoint de estadísticas generales del dashboard no disponible');
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener estadísticas generales: ' + error.message);
    }
  }
};
