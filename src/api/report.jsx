import api from './config';

/**
 * Transformar datos del formulario al formato de la API
 * @param {Object} formData - Datos del formulario de incidencia
 * @param {Array} allLeads - Lista completa de leads para buscar cargos
 * @returns {Object} - Datos formateados para la API
 */
export const mapFormDataToAPI = (formData, allLeads = []) => {
  // Construir el objeto "to" (destinatario)
  const toObject = {
    name: `Sr. ${formData.destinatario?.toUpperCase() || ''}`,
    job: formData.cargoDestinatario || formData.dirigidoA || ''
  };

  // Construir el array "cc" (con copia)
  const ccArray = (formData.cc || []).map(personaCC => {
    // Buscar el cargo de la persona en allLeads
    const lead = allLeads.find(l => {
      const nombreCompleto = `${l.name} ${l.lastname}`.trim();
      return nombreCompleto === personaCC;
    });

    return {
      name: `Sr. ${personaCC.toUpperCase()}`,
      job: lead?.job?.name || ''
    };
  });

  // Construir el objeto para la API
  const apiData = {
    header: {
      to: toObject,
      cc: ccArray
    },
    address: formData.ubicacion?.address || '',
    latitude: formData.ubicacion?.coordinates?.[0] || null,
    longitude: formData.ubicacion?.coordinates?.[1] || null,
    date: formData.fechaIncidente && formData.horaIncidente
      ? new Date(`${formData.fechaIncidente}T${formData.horaIncidente}:00.00Z`).toISOString()
      : new Date().toISOString(),
    bodycam_dni: formData.dni || '',
    bodycam_supervisor: formData.encargadoBodycam || '', // Supervisor/encargado de la bodycam
    offender_dni: formData.dni || '',
    bodycam_id: formData.bodycamId || null,  // ID de la bodycam seleccionada
    lack_id: formData.lackId || null,        // ID de la falta seleccionada
    subject_id: formData.subjectId || null   // ID del asunto seleccionado
  };

  return apiData;
};

/**
 * Crear un nuevo reporte/incidencia
 * @param {Object} reportData - Datos del reporte a crear (ya formateados)
 * @returns {Promise} - Respuesta con el reporte creado
 */
export const createReport = async (reportData) => {
  try {
    const response = await api.post('/report', reportData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al crear reporte: ' + error.message);
    }
  }
};
