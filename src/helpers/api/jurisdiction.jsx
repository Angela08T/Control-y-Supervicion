import api from './config';

/**
 * API para gestión de Jurisdicciones
 */

// Obtener todas las jurisdicciones
export const getJurisdictions = async () => {
  try {
    const response = await api.get('/jurisdiction');
    console.log('✅ Jurisdicciones obtenidas:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener jurisdicciones:', error);
    throw error;
  }
};

// Obtener una jurisdicción por ID
export const getJurisdictionById = async (jurisdictionId) => {
  try {
    const response = await api.get(`/jurisdiction/${jurisdictionId}`);
    console.log('✅ Jurisdicción obtenida por ID:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener jurisdicción por ID:', error);
    throw error;
  }
};
