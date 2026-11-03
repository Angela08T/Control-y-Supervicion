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
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener una persona por ID
export const getLeadById = async (leadId) => {
  try {
    const response = await api.get(`/lead/${leadId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Buscar personal por nombre
export const searchLead = async (searchTerm) => {
  try {
    const response = await api.get('/lead', {
      params: { search: searchTerm }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Crear una nueva persona
export const createLead = async (leadData) => {
  try {
    const response = await api.post('/lead', leadData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Actualizar una persona existente
export const updateLead = async (leadId, leadData) => {
  try {
    const response = await api.patch(`/lead/${leadId}`, leadData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Cambiar estado de una persona (toggle: habilitar/deshabilitar)
export const deleteLead = async (leadId) => {
  try {
    const response = await api.delete(`/lead/${leadId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
