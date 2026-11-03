import api from './config';

/**
 * API para gestión de Faltas (Lacks)
 */

// Obtener todas las faltas con paginación y búsqueda opcional
export const getLacks = async (page = 1, limit = 10, search = null) => {
  try {
    const params = { page, limit };

    // Agregar búsqueda si existe
    if (search) {
      params.search = search;
    }

    const response = await api.get('/lack', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener una falta por ID
export const getLackById = async (lackId) => {
  try {
    const response = await api.get(`/lack/${lackId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Buscar faltas por nombre
export const searchLack = async (searchTerm) => {
  try {
    const response = await api.get('/lack', {
      params: { search: searchTerm }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Crear una nueva falta
export const createLack = async (lackData) => {
  try {
    const response = await api.post('/lack', lackData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Actualizar una falta existente
export const updateLack = async (lackId, lackData) => {
  try {
    const response = await api.patch(`/lack/${lackId}`, lackData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Eliminar una falta
export const deleteLack = async (lackId) => {
  try {
    const response = await api.delete(`/lack/${lackId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
