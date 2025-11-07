import api from './config';

/**
 * Obtener lista de lacks (faltas)
 * @returns {Promise} - Respuesta con lista de lacks
 */
export const getLacks = async () => {
  try {
    const response = await api.get('/lack');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener faltas: ' + error.message);
    }
  }
};
