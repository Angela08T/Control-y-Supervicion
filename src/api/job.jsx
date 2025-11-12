import api from './config';

/**
 * API para gestión de Cargos (Jobs)
 */

// Obtener todos los cargos con paginación
export const getJobs = async (page = 1, limit = 10) => {
  try {
    const response = await api.get('/job', {
      params: { page, limit }
    });
    console.log('✅ Cargos obtenidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener cargos:', error);
    throw error;
  }
};

// Obtener un cargo por ID
export const getJobById = async (jobId) => {
  try {
    const response = await api.get(`/job/${jobId}`);
    console.log('✅ Cargo obtenido por ID:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener cargo por ID:', error);
    throw error;
  }
};

// Buscar cargos por nombre
export const searchJob = async (searchTerm) => {
  try {
    const response = await api.get('/job', {
      params: { search: searchTerm }
    });
    console.log('✅ Búsqueda de cargos:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al buscar cargos:', error);
    throw error;
  }
};

// Crear un nuevo cargo
export const createJob = async (jobData) => {
  try {
    const response = await api.post('/job', jobData);
    console.log('✅ Cargo creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al crear cargo:', error);
    throw error;
  }
};

// Actualizar un cargo existente
export const updateJob = async (jobId, jobData) => {
  try {
    const response = await api.put(`/job/${jobId}`, jobData);
    console.log('✅ Cargo actualizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar cargo:', error);
    throw error;
  }
};

// Cambiar estado de un cargo (toggle: habilitar/deshabilitar)
export const deleteJob = async (jobId) => {
  try {
    const response = await api.delete(`/job/${jobId}`);
    console.log('🔄 Estado de cargo cambiado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al cambiar estado de cargo:', error);
    throw error;
  }
};

/**
 * Funciones heredadas para compatibilidad con código existente
 */

// Obtener lista de líderes/personas según el cargo (job)
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

// Obtener lista completa de líderes/personas (sin filtro)
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
