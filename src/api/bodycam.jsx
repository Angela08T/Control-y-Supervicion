import api from './config';

/**
 * Buscar bodycams por código
 * @param {string} searchTerm - Término de búsqueda (ej: "SG004")
 * @returns {Promise} - Respuesta con datos de bodycam
 */
export const searchBodycam = async (searchTerm) => {
  try {
    const response = await api.get(`/bodycam`, {
      params: { search: searchTerm }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al buscar bodycam: ' + error.message);
    }
  }
};
