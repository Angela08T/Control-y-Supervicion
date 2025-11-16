import api from './config';

/**
 * API para gestión de Infractores (Offenders)
 */

// Obtener todos los infractores con paginación
export const getOffenders = async (page = 1, limit = 10) => {
  try {
    const response = await api.get('/offender', {
      params: { page, limit }
    });
    console.log('✅ Infractores obtenidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener infractores:', error);
    throw error;
  }
};

// Buscar infractor por DNI
export const getOffenderByDni = async (dni) => {
  try {
    const response = await api.get(`/offender/dni/${dni}`);
    console.log('✅ Infractor obtenido por DNI:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener infractor por DNI:', error);
    throw error;
  }
};

// Crear un nuevo infractor
export const createOffender = async (offenderData) => {
  try {
    const response = await api.post('/offender', offenderData);
    console.log('✅ Infractor creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al crear infractor:', error);
    throw error;
  }
};

// Actualizar un infractor existente
export const updateOffender = async (offenderId, offenderData) => {
  try {
    const response = await api.patch(`/offender/${offenderId}`, offenderData);
    console.log('✅ Infractor actualizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar infractor:', error);
    throw error;
  }
};

// Eliminar/Toggle estado de un infractor (soft delete)
export const deleteOffender = async (offenderId) => {
  try {
    const response = await api.delete(`/offender/${offenderId}`);
    console.log('🔄 Estado de infractor cambiado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al cambiar estado del infractor:', error);
    throw error;
  }
};
