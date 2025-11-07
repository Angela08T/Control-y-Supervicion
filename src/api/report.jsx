import api from './config';

/**
 * Buscar reportes por término (DNI, nombre, etc.)
 * @param {string} searchTerm - Término de búsqueda
 * @param {number} page - Número de página (default: 1)
 * @param {number} limit - Cantidad de items por página (default: 10)
 * @returns {Promise} - Respuesta con datos de reportes
 */
export const searchReport = async (searchTerm, page = 1, limit = 10) => {
  try {
    console.log('🔎 searchReport - Parámetros recibidos:', { searchTerm, page, limit })
    console.log('🔎 Haciendo request a: /report con params:', { search: searchTerm, page, limit })

    const response = await api.get(`/report`, {
      params: { search: searchTerm, page, limit }
    });

    console.log('🔎 searchReport - Respuesta recibida:', response)
    console.log('🔎 searchReport - response.data:', response.data)

    return response.data;
  } catch (error) {
    console.error('🔎 searchReport - Error:', error)
    console.error('🔎 searchReport - error.response:', error.response)
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al buscar reporte: ' + error.message);
    }
  }
};

/**
 * Transformar datos del formulario al formato de la API
 * @param {Object} formData - Datos del formulario de incidencia
 * @param {Array} allLeads - Lista completa de leads para buscar cargos
 * @returns {Object} - Datos formateados para la API
 * @returns {Promise<Array>} - Lista de incidencias mapeadas al formato de tabla
 */
export function mapFormDataToAPI(form, allLeads) {
  console.log('🔍 mapFormDataToAPI - Iniciando mapeo...');
  console.log('📋 form recibido:', form);
  console.log('👥 allLeads:', allLeads);

  // Leaflet usa [latitude, longitude] - el orden ya es correcto
  const coords = form.ubicacion?.coordinates || [null, null];

  // Buscar el job del destinatario (dirigidoA)
  const to = {
    name: form.destinatario || '',
    job: form.dirigidoA || ''
  };

  // Mapeamos la lista CC a objetos con name y job
  let cc = (form.cc || []).map(nombre => {
    const lead = allLeads.find(l => `${l.name} ${l.lastname}`.trim() === nombre);
    return {
      name: nombre || '',
      job: lead?.job?.name || ''
    };
  });

  // Si no hay CC, agregar un array vacío (la API puede requerirlo)
  if (cc.length === 0) {
    console.warn('⚠️ No hay elementos en CC. La API requiere al menos 1.');
  }

  // Convertir fecha + hora en formato ISO (ejemplo: "2025-10-11T10:14:12.00Z")
  const dateString = `${form.fechaIncidente}T${form.horaIncidente}:00`;
  const date = new Date(dateString).toISOString();

  console.log('📍 Coordenadas recibidas:', coords);
  console.log('📍 Latitude (coords[0]):', coords[0]);
  console.log('📍 Longitude (coords[1]):', coords[1]);

  // Construir el payload base
  const payload = {
    header: { to, cc },
    address: form.ubicacion?.address || '',
    latitude: coords[0] !== null ? parseFloat(coords[0]) : null,  // coords[0] es latitude
    longitude: coords[1] !== null ? parseFloat(coords[1]) : null, // coords[1] es longitude
    date,
    offender_dni: form.dni || '',
    lack_id: form.lackId || null,
    subject_id: form.subjectId || null,
    jurisdiction_id: form.jurisdictionId || null
  };

  // Solo agregar campos de bodycam si NO es Inasistencia (es decir, si hay bodycamId)
  if (form.bodycamId) {
    payload.bodycam_id = form.bodycamId;
    payload.bodycam_dni = form.dni || '';
  }

  console.log('📤 Payload final a enviar:', JSON.stringify(payload, null, 2));

  return payload;
}

/**
 * Obtener reportes con paginación y filtros
 * @param {number} page - Número de página (default: 1)
 * @param {number} limit - Cantidad de items por página (default: 10)
 * @param {Object} filters - Filtros opcionales { lackId, subjectId, jurisdictionId }
 * @returns {Promise<Object>} - Objeto con data (reportes) y pagination (metadata)
 */
export const getReports = async (page = 1, limit = 10, filters = {}) => {
  try {
    // Construir parámetros de consulta
    const params = { page, limit }

    // Agregar filtros si existen
    if (filters.lackId) params.lack = filters.lackId
    if (filters.subjectId) params.subject = filters.subjectId
    if (filters.jurisdictionId) params.jurisdiction = filters.jurisdictionId

    console.log('📡 Parámetros de consulta:', params)

    const response = await api.get('/report', { params })
    console.log('📡 Respuesta completa de API:', response.data)

    const reports = response.data?.data?.data || []
    const paginationData = response.data?.data || {}

    console.log('📊 Estructura de paginación recibida:', {
      currentPage: paginationData.currentPage,
      pageCount: paginationData.pageCount,
      totalCount: paginationData.totalCount,
      totalPages: paginationData.totalPages
    })

    // Transformar al formato plano para la tabla
    const transformedReports = reports.map(r => {
      // Debug: mostrar todos los campos relacionados con bodycam
      console.log('🔍 Datos del reporte desde API:', {
        id: r.id,
        bodycam_supervisor: r.bodycam_supervisor,
        bodycamSupervisor: r.bodycamSupervisor,
        bodycam_user: r.bodycam_user,
        bodycamUser: r.bodycamUser,
        supervisor: r.supervisor,
        user: r.user,
        'Todos los campos del objeto r:': Object.keys(r)
      })

      // Intentar obtener el encargado de bodycam de múltiples posibles campos
      const encargadoBodycam =
        r.bodycam_supervisor ||
        r.bodycamSupervisor ||
        r.supervisor ||
        (r.user ? `${r.user.name} ${r.user.lastname}`.trim() : '')

      console.log('✅ encargadoBodycam final:', encargadoBodycam)

      return {
        id: r.id,
        dni: r.offender?.dni || '',
        asunto: r.subject?.name || '',
        falta: r.lack?.name || '',
        tipoInasistencia: r.subject?.name === 'Inasistencia' ? r.lack?.name : null,
        medio: r.bodycam ? 'Bodycam' : 'Otro',
        fechaIncidente: new Date(r.date).toLocaleDateString('es-PE'),
        horaIncidente: new Date(r.date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        turno: r.offender?.shift || '',
        cargo: r.offender?.job || '',
        regLab: r.offender?.regime || '',
        jurisdiccion: r.jurisdiction?.name || r.offender?.subgerencia || '',
        jurisdictionId: r.jurisdiction?.id || null,
        bodycamNumber: r.bodycam?.name || '',
        bodycamAsignadaA: r.bodycam_user || r.bodycamUser || '',
        encargadoBodycam: encargadoBodycam,
        dirigidoA: r.header?.to?.job || '',
        destinatario: r.header?.to?.name || '',
        cargoDestinatario: r.header?.to?.job || '',
        cc: (r.header?.cc || []).map(c => c.name),
        ubicacion: {
          address: r.address || '',
          coordinates: [r.latitude || null, r.longitude || null]
        },
        nombreCompleto: r.offender ? `${r.offender.name} ${r.offender.lastname}`.trim() : '',
        createdAt: r.lack?.created_at || r.date,
        updatedAt: r.lack?.updated_at || r.date
      }
    })

    // Calcular paginación correctamente
    // pageCount = items en la página ACTUAL (no es el límite por página)
    // limit = lo que enviamos en el request, es el límite real por página
    const currentPageNum = paginationData.currentPage || page
    const totalNum = paginationData.totalCount || transformedReports.length
    const perPageNum = limit // Usar el limit que enviamos, no pageCount
    const totalPagesNum = Math.ceil(totalNum / perPageNum)

    const from = totalNum === 0 ? 0 : ((currentPageNum - 1) * perPageNum) + 1
    const to = Math.min(currentPageNum * perPageNum, totalNum)

    console.log('📊 Paginación calculada:', {
      currentPage: currentPageNum,
      totalPages: totalPagesNum,
      perPage: perPageNum,
      total: totalNum,
      from: from,
      to: to
    })

    // Retornar data y metadata de paginación adaptada
    return {
      data: transformedReports,
      pagination: {
        currentPage: currentPageNum,
        totalPages: totalPagesNum,
        perPage: perPageNum,
        total: totalNum,
        from: from,
        to: to
      }
    }
  } catch (error) {
    console.error('❌ Error al obtener reportes:', error)
    throw new Error('No se pudieron obtener los reportes')
  }
}

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

/**
 * Obtener un reporte específico por ID
 * @param {string} reportId - ID del reporte (UUID)
 * @returns {Promise<Object>} - Objeto con el reporte encontrado
 */
export const getReportById = async (reportId) => {
  try {
    const response = await api.get(`/report/${reportId}`)
    console.log('📡 Respuesta de búsqueda por ID:', response.data)

    if (response.data?.data) {
      // Transformar al formato de la tabla
      const r = response.data.data
      const transformed = {
        id: r.id,
        dni: r.offender?.dni || '',
        asunto: r.subject?.name || '',
        falta: r.lack?.name || '',
        tipoInasistencia: r.subject?.name === 'Inasistencia' ? r.lack?.name : null,
        medio: r.bodycam ? 'Bodycam' : 'Otro',
        fechaIncidente: new Date(r.date).toLocaleDateString('es-PE'),
        horaIncidente: new Date(r.date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        turno: r.offender?.shift || '',
        cargo: r.offender?.job || '',
        regLab: r.offender?.regime || '',
        jurisdiccion: r.jurisdiction?.name || r.offender?.subgerencia || '',
        jurisdictionId: r.jurisdiction?.id || null,
        bodycamNumber: r.bodycam?.name || '',
        bodycamAsignadaA: r.bodycam_user || '',
        encargadoBodycam: r.bodycam_supervisor || (r.user ? `${r.user.name} ${r.user.lastname}` : ''),
        dirigidoA: r.header?.to?.job || '',
        destinatario: r.header?.to?.name || '',
        cargoDestinatario: r.header?.to?.job || '',
        cc: (r.header?.cc || []).map(c => c.name),
        ubicacion: {
          address: r.address || '',
          coordinates: [r.latitude || null, r.longitude || null]
        },
        nombreCompleto: r.offender ? `${r.offender.name} ${r.offender.lastname}`.trim() : '',
        createdAt: r.lack?.created_at || r.date,
        updatedAt: r.lack?.updated_at || r.date
      }

      return {
        data: [transformed], // Retornar como array de 1 elemento
        found: true
      }
    }

    return { data: [], found: false }
  } catch (error) {
    console.error('❌ Error al buscar reporte por ID:', error)
    if (error.response?.status === 404) {
      return { data: [], found: false }
    }
    throw new Error('Error al buscar reporte: ' + error.message)
  }
};

/**
 * Eliminar un reporte por ID
 * @param {string} reportId - ID del reporte (UUID)
 * @returns {Promise<Object>} - Objeto con el mensaje de confirmación
 */
export const deleteReport = async (reportId) => {
  try {
    const response = await api.delete(`/report/${reportId}`)
    console.log('🗑️ Reporte eliminado:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Error al eliminar reporte:', error)
    if (error.response) {
      throw error
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.')
    } else {
      throw new Error('Error al eliminar reporte: ' + error.message)
    }
  }
};

/**
 * Actualizar un reporte con evidencias (imágenes) y descripción adicional
 * @param {string} reportId - ID del reporte (UUID)
 * @param {Array<File>} files - Array de archivos de imagen
 * @param {Array<string>} descriptions - Array de descripciones (una por cada imagen)
 * @param {string} message - Descripción adicional del reporte
 * @returns {Promise<Object>} - Objeto con el reporte actualizado
 */
export const updateReportWithEvidences = async (reportId, files = [], descriptions = [], message = '') => {
  try {
    const formData = new FormData()

    // Agregar cada imagen al FormData
    files.forEach((file, index) => {
      formData.append('files', file)
    })

    // Agregar cada descripción al FormData
    descriptions.forEach((desc, index) => {
      formData.append('descriptions', desc)
    })

    // Agregar el mensaje (descripción adicional)
    if (message) {
      formData.append('message', message)
    }

    console.log('📤 Actualizando reporte con evidencias:', {
      reportId,
      filesCount: files.length,
      descriptionsCount: descriptions.length,
      hasMessage: !!message
    })

    const response = await api.patch(`/report/${reportId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    console.log('✅ Reporte actualizado:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Error al actualizar reporte:', error)
    if (error.response) {
      throw error
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.')
    } else {
      throw new Error('Error al actualizar reporte: ' + error.message)
    }
  }
};

/**
 * Obtener URL de imagen de evidencia
 * @param {string} evidencePath - Path de la evidencia (ej: evidence/2025-11-07/7d25c20e-5b8f-4318-885f-087442b2925a.jpeg)
 * @returns {string} - URL completa para acceder a la imagen
 */
export const getEvidenceImageUrl = (evidencePath) => {
  // Usar la URL base del API configurada (ej: http://192.168.137.217:3021/api)
  const baseURL = api.defaults.baseURL || 'http://localhost:3000'

  // Asegurarse de que no haya doble slash y que el path no empiece con /
  const cleanPath = evidencePath.startsWith('/') ? evidencePath.substring(1) : evidencePath

  // Construir URL: baseURL + cleanPath
  // Ejemplo: http://192.168.137.217:3021/api + / + evidence/2025-11-07/7d25c20e-5b8f-4318-885f-087442b2925a.jpeg
  const finalURL = `${baseURL}/${cleanPath}`
  console.log('🖼️ URL de evidencia construida:', finalURL)

  return finalURL
};

/**
 * Obtener los detalles completos de un reporte con evidencias
 * @param {string} reportId - ID del reporte (UUID)
 * @returns {Promise<Object>} - Objeto con el reporte completo incluyendo evidencias
 */
export const getReportWithEvidences = async (reportId) => {
  try {
    const response = await api.get(`/report/${reportId}`)
    console.log('📡 Reporte obtenido con evidencias:', response.data)

    if (response.data?.data) {
      const report = response.data.data

      // Mapear las evidencias a un formato más manejable
      const evidences = (report.evidences || []).map(ev => ({
        id: ev.id,
        description: ev.description,
        path: ev.path,
        imageUrl: getEvidenceImageUrl(ev.path), // Usar path en lugar de id
        mimetype: ev.mimetype,
        size: ev.size,
        createdAt: ev.created_at
      }))

      return {
        ...report,
        evidences,
        message: report.message || '' // Descripción adicional del reporte
      }
    }

    return null
  } catch (error) {
    console.error('❌ Error al obtener reporte con evidencias:', error)
    if (error.response?.status === 404) {
      return null
    }
    throw new Error('Error al obtener reporte: ' + error.message)
  }
};
