import { offenderApi } from './config';
import axios from 'axios';

// CONFIGURACIÓN: Si el servidor de offender NO requiere token, cambia esto a false
const OFFENDER_REQUIRES_AUTH = true;

/**
 * Buscar offenders por DNI
 * @param {string} dni - DNI a buscar (ej: "12345678")
 * @returns {Promise} - Respuesta con datos del offender
 */
export const searchOffenderByDNI = async (dni) => {
  try {
    console.log('🔍 Buscando offender con DNI:', dni);

    let response;

    if (OFFENDER_REQUIRES_AUTH) {
      // Usar offenderApi con autenticación
      // El DNI va en la URL como parámetro de ruta: /offender/dni/75326418
      response = await offenderApi.get(`/offender/dni/${dni}`);
    } else {
      // Hacer petición directa SIN autenticación
      response = await axios.get(`${import.meta.env.VITE_API_OFFENDER_URL}/offender/dni/${dni}`);
    }

    console.log('✅ Respuesta exitosa:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error en searchOffenderByDNI:', error);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.response?.data?.message);

    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al buscar offender: ' + error.message);
    }
  }
};
