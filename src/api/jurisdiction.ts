import api from './config';

/**
 * API para gestión de Jurisdicciones
 */

// Obtener todas las jurisdicciones
export const getJurisdictions = async () => {
  try {
    const response = await api.get('/jurisdiction');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener una jurisdicción por ID
export const getJurisdictionById = async (jurisdictionId) => {
  try {
    const response = await api.get(`/jurisdiction/${jurisdictionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
