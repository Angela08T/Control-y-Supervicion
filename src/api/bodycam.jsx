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

/**
 * Obtener bodycams con paginación
 * @param {number} page - Número de página (default: 1)
 * @param {number} limit - Cantidad de items por página (default: 10)
 * @returns {Promise<Object>} - Objeto con data (bodycams) y pagination (metadata)
 */
export const getBodycams = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/bodycam?page=${page}&limit=${limit}`);
    console.log('📡 Respuesta completa de API Bodycam:', response.data);

    const bodycams = response.data?.data?.data || [];
    const paginationData = response.data?.data || {};

    console.log('📊 Estructura de paginación recibida:', {
      currentPage: paginationData.currentPage,
      pageCount: paginationData.pageCount,
      totalCount: paginationData.totalCount,
      totalPages: paginationData.totalPages
    });

    // Los datos ya vienen en el formato correcto
    const transformedBodycams = bodycams.map(b => ({
      id: b.id,
      name: b.name,
      serie: b.serie,
      deleted_at: b.deleted_at
    }));

    // Calcular paginación
    const currentPageNum = paginationData.currentPage || page;
    const totalNum = paginationData.totalCount || transformedBodycams.length;
    const perPageNum = limit;
    const totalPagesNum = Math.ceil(totalNum / perPageNum);

    const from = totalNum === 0 ? 0 : ((currentPageNum - 1) * perPageNum) + 1;
    const to = Math.min(currentPageNum * perPageNum, totalNum);

    console.log('📊 Paginación calculada:', {
      currentPage: currentPageNum,
      totalPages: totalPagesNum,
      perPage: perPageNum,
      total: totalNum,
      from: from,
      to: to
    });

    return {
      data: transformedBodycams,
      pagination: {
        currentPage: currentPageNum,
        totalPages: totalPagesNum,
        perPage: perPageNum,
        total: totalNum,
        from: from,
        to: to
      }
    };
  } catch (error) {
    console.error('❌ Error al obtener bodycams:', error);
    throw new Error('No se pudieron obtener las bodycams');
  }
};

/**
 * Obtener una bodycam específica por ID
 * @param {string} bodycamId - ID de la bodycam (UUID)
 * @returns {Promise<Object>} - Objeto con la bodycam encontrada
 */
export const getBodycamById = async (bodycamId) => {
  try {
    const response = await api.get(`/bodycam/${bodycamId}`);
    console.log('📡 Respuesta de búsqueda por ID:', response.data);

    if (response.data?.data) {
      const b = response.data.data;
      const transformed = {
        id: b.id,
        name: b.name,
        serie: b.serie,
        deleted_at: b.deleted_at
      };

      return {
        data: [transformed],
        found: true
      };
    }

    return { data: [], found: false };
  } catch (error) {
    console.error('❌ Error al buscar bodycam por ID:', error);
    if (error.response?.status === 404) {
      return { data: [], found: false };
    }
    throw new Error('Error al buscar bodycam: ' + error.message);
  }
};

/**
 * Crear una nueva bodycam
 * @param {Object} bodycamData - Datos de la bodycam a crear
 * @param {string} bodycamData.name - Nombre de la bodycam
 * @param {string} bodycamData.serie - Serie de la bodycam
 * @returns {Promise} - Respuesta con la bodycam creada
 */
export const createBodycam = async (bodycamData) => {
  try {
    const response = await api.post('/bodycam', bodycamData);
    console.log('✅ Bodycam creada:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al crear bodycam:', error);
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al crear bodycam: ' + error.message);
    }
  }
};

/**
 * Actualizar una bodycam existente
 * @param {string} bodycamId - ID de la bodycam (UUID)
 * @param {Object} bodycamData - Datos a actualizar
 * @param {string} bodycamData.name - Nombre de la bodycam
 * @param {string} bodycamData.serie - Serie de la bodycam
 * @returns {Promise} - Respuesta con la bodycam actualizada
 */
export const updateBodycam = async (bodycamId, bodycamData) => {
  try {
    const response = await api.patch(`/bodycam/${bodycamId}`, bodycamData);
    console.log('✅ Bodycam actualizada:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar bodycam:', error);
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al actualizar bodycam: ' + error.message);
    }
  }
};

/**
 * Eliminar una bodycam por ID
 * @param {string} bodycamId - ID de la bodycam (UUID)
 * @returns {Promise<Object>} - Objeto con el mensaje de confirmación
 */
export const deleteBodycam = async (bodycamId) => {
  try {
    const response = await api.delete(`/bodycam/${bodycamId}`);
    console.log('🗑️ Bodycam eliminada:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al eliminar bodycam:', error);
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al eliminar bodycam: ' + error.message);
    }
  }
};
