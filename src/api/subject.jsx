import api from './config';

/**
 * Obtener lista de subjects (asuntos) con sus lacks (faltas)
 * @returns {Promise} - Respuesta con lista de subjects
 */
export const getSubjects = async () => {
  try {
    const response = await api.get('/subject');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener asuntos: ' + error.message);
    }
  }
};
