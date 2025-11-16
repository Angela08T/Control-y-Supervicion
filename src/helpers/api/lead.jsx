import api from './config';

/**
 * API para gestión de Personal (Leads)
 */

// Obtener todo el personal con paginación
export const getLeads = async (page = 1, limit = 10) => {
  try {
    const response = await api.get('/lead', {
      params: { page, limit }
    });
    console.log('✅ Personal obtenido:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener personal:', error);
    throw error;
  }
};

// Obtener una persona por ID
export const getLeadById = async (leadId) => {
  try {
    const response = await api.get(`/lead/${leadId}`);
    console.log('✅ Persona obtenida por ID:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener persona por ID:', error);
    throw error;
  }
};

// Buscar personal por nombre
export const searchLead = async (searchTerm) => {
  try {
    const response = await api.get('/lead', {
      params: { search: searchTerm }
    });
    console.log('✅ Búsqueda de personal:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al buscar personal:', error);
    throw error;
  }
};

// Crear una nueva persona
export const createLead = async (leadData) => {
  try {
    const response = await api.post('/lead', leadData);
    console.log('✅ Persona creada:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al crear persona:', error);
    throw error;
  }
};

// Actualizar una persona existente
export const updateLead = async (leadId, leadData) => {
  try {
    const response = await api.put(`/lead/${leadId}`, leadData);
    console.log('✅ Persona actualizada:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar persona:', error);
    throw error;
  }
};

// Cambiar estado de una persona (toggle: habilitar/deshabilitar)
export const deleteLead = async (leadId) => {
  try {
    const response = await api.delete(`/lead/${leadId}`);
    console.log('🔄 Estado de persona cambiado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al cambiar estado de persona:', error);
    throw error;
  }
};
