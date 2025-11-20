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
    console.log('✅ Asuntos obtenidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener asuntos:', error);
    throw error;
  }
};

// Obtener un asunto por ID
export const getSubjectById = async (subjectId) => {
  try {
    const response = await api.get(`/subject/${subjectId}`);
    console.log('✅ Asunto obtenido por ID:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener asunto por ID:', error);
    throw error;
  }
};

// Buscar asuntos por nombre
export const searchSubject = async (searchTerm) => {
  try {
    const response = await api.get('/subject', {
      params: { search: searchTerm }
    });
    console.log('✅ Búsqueda de asuntos:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al buscar asuntos:', error);
    throw error;
  }
};

// Crear un nuevo asunto
export const createSubject = async (subjectData) => {
  try {
    const response = await api.post('/subject', subjectData);
    console.log('✅ Asunto creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al crear asunto:', error);
    throw error;
  }
};

// Actualizar un asunto existente
export const updateSubject = async (subjectId, subjectData) => {
  try {
    const response = await api.patch(`/subject/${subjectId}`, subjectData);
    console.log('✅ Asunto actualizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar asunto:', error);
    throw error;
  }
};

// Eliminar un asunto
export const deleteSubject = async (subjectId) => {
  try {
    const response = await api.delete(`/subject/${subjectId}`);
    console.log('🗑️ Asunto eliminado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al eliminar asunto:', error);
    throw error;
  }
};
