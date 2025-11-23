import api from './config';

/**
 * API para gestión de Asuntos (Subjects)
 */

// Obtener todos los asuntos con paginación
export const getSubjects = async (page = 1, limit = 10) => {
  try {
    const response = await api.get('/subject', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener un asunto por ID
export const getSubjectById = async (subjectId) => {
  try {
    const response = await api.get(`/subject/${subjectId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Buscar asuntos por nombre
export const searchSubject = async (searchTerm) => {
  try {
    const response = await api.get('/subject', {
      params: { search: searchTerm }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Crear un nuevo asunto
export const createSubject = async (subjectData) => {
  try {
    const response = await api.post('/subject', subjectData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Actualizar un asunto existente
export const updateSubject = async (subjectId, subjectData) => {
  try {
    const response = await api.patch(`/subject/${subjectId}`, subjectData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Eliminar un asunto
export const deleteSubject = async (subjectId) => {
  try {
    const response = await api.delete(`/subject/${subjectId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
