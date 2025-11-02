import api from './config';

/**
 * Obtener lista de cargos/puestos (jobs)
 * @returns {Promise} - Respuesta con lista de jobs
 */
export const getJobs = async () => {
  try {
    const response = await api.get('/job');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener cargos: ' + error.message);
    }
  }
};

/**
 * Obtener lista de líderes/personas según el cargo (job)
 * @param {string} jobId - ID del cargo/puesto
 * @returns {Promise} - Respuesta con lista de líderes
 */
export const getLeadsByJob = async (jobId) => {
  try {
    const response = await api.get('/lead', {
      params: { job: jobId }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener personas: ' + error.message);
    }
  }
};

/**
 * Obtener lista completa de líderes/personas (sin filtro)
 * @returns {Promise} - Respuesta con lista completa de líderes
 */
export const getAllLeads = async () => {
  try {
    const response = await api.get('/lead');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener lista de personas: ' + error.message);
    }
  }
};
