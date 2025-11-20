import api from './config';

/**
 * API para gestión de Infractores (Offenders)
 */

// Obtener todos los infractores con paginación
export const getOffenders = async (page = 1, limit = 10) => {
  try {
    const response = await api.get('/offender', {
      params: { page, limit }
    });
    console.log('✅ Infractores obtenidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener infractores:', error);
    throw error;
  }
};

// Buscar infractor por DNI
export const getOffenderByDni = async (dni) => {
  try {
    const response = await api.get(`/offender/dni/${dni}`);
    console.log('✅ Infractor obtenido por DNI:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener infractor por DNI:', error);
    throw error;
  }
};

// Crear un nuevo infractor
export const createOffender = async (offenderData) => {
  try {
    const response = await api.post('/offender', offenderData);
    console.log('✅ Infractor creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al crear infractor:', error);
    throw error;
  }
};

// Actualizar un infractor existente
export const updateOffender = async (offenderId, offenderData) => {
  try {
    const response = await api.patch(`/offender/${offenderId}`, offenderData);
    console.log('✅ Infractor actualizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar infractor:', error);
    throw error;
  }
};

// Eliminar/Toggle estado de un infractor (soft delete)
export const deleteOffender = async (offenderId) => {
  try {
    const response = await api.delete(`/offender/${offenderId}`);
    console.log('🔄 Estado de infractor cambiado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al cambiar estado del infractor:', error);
    throw error;
  }
};

/**
 * Mapear datos del formulario de inasistencia al formato de la API de offender
 * @param {Object} form - Datos del formulario de incidencia
 * @returns {Object} - Datos formateados para la API de offender
 */
export function mapFormDataToOffenderAPI(form) {
  console.log('🔍 mapFormDataToOffenderAPI - Iniciando mapeo...');
  console.log('📋 form recibido:', form);

  // Convertir el turno completo a la inicial si viene completo
  let shiftInitial = form.turno;
  if (form.turno === 'Mañana') {
    shiftInitial = 'M';
  } else if (form.turno === 'Tarde') {
    shiftInitial = 'T';
  } else if (form.turno === 'Noche') {
    shiftInitial = 'N';
  }

  // Extraer nombre y apellido del nombreCompleto
  const nombreCompleto = form.nombreCompleto || '';
  const partes = nombreCompleto.trim().split(' ');
  const name = partes[0] || '';
  const lastname = partes.slice(1).join(' ') || '';

  const payload = {
    name: name,
    lastname: lastname,
    dni: form.dni || '',
    job: form.cargo || '',
    regime: form.regLab || '',
    shift: shiftInitial,
    attendance: false // Siempre false para inasistencias
  };

  console.log('📤 Payload final para offender API:', JSON.stringify(payload, null, 2));

  return payload;
}

/**
 * Crear inasistencias (attendances) para offenders
 * @param {Array} attendanceData - Array de items con offender_id y attendances
 * @returns {Promise} - Respuesta con el resultado de la creación
 *
 * Formato esperado:
 * {
 *   items: [
 *     {
 *       offender_id: "uuid",
 *       attendances: [
 *         { date: "2025-11-09", mode: "UNJUSTIFIED" }
 *       ]
 *     }
 *   ]
 * }
 */
export const createAttendances = async (attendanceData) => {
  try {
    console.log('📤 Enviando attendances a API:', attendanceData);
    const response = await api.post('/attendance', attendanceData);
    console.log('✅ Attendances creadas:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al crear attendances:', error);
    throw error;
  }
};

/**
 * Obtener inasistencias guardadas en un rango de fechas
 * @param {string} start - Fecha de inicio (YYYY-MM-DD)
 * @param {string} end - Fecha de fin (YYYY-MM-DD)
 * @returns {Promise} - Respuesta con las inasistencias guardadas
 */
export const getAttendances = async (start, end) => {
  try {
    console.log(`📥 Obteniendo attendances: ${start} a ${end}`);
    const response = await api.get('/attendance', {
      params: { start, end }
    });
    console.log('✅ Attendances obtenidas:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener attendances:', error);
    throw error;
  }
};

/**
 * Eliminar una inasistencia específica (soft delete)
 * @param {string} attendanceId - ID de la inasistencia a eliminar
 * @returns {Promise} - Respuesta de la eliminación
 */
export const deleteAttendance = async (attendanceId) => {
  try {
    console.log(`🗑️ Eliminando attendance: ${attendanceId}`);
    const response = await api.delete(`/attendance/${attendanceId}`);
    console.log('✅ Attendance eliminada:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al eliminar attendance:', error);
    throw error;
  }
};
