import { AxiosError } from 'axios';
import api from './config';
import type {
  ApiMessageResponse,
  ApiResponse,
  Bodycam,
  BodycamView,
  Cam,
  CreateBodycamDto,
  FilterBodycamParams,
  FoundResult,
  ID,
  PaginatedResponse,
  PaginationMeta,
  TableResult,
  UpdateBodycamDto,
} from '@/types';

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/**
 * Buscar bodycams por código
 * @param {string} searchTerm - Término de búsqueda (ej: "SG004")
 * @param {number} limit - Límite de resultados (default: 1000)
 * @param {string} cam - Tipo de cámara: 'BODYCAM' o 'CAMERA' (opcional)
 * @returns {Promise} - Respuesta con datos de bodycam
 */
export const searchBodycam = async (searchTerm: string, limit: number = 1000, cam: Cam | null = null): Promise<PaginatedResponse<Bodycam>> => {
  try {
    const params: FilterBodycamParams = { search: searchTerm, limit };

    // Agregar filtro por tipo de cámara si se especifica
    if (cam) {
      params.cam = cam;
    }

    const response = await api.get<PaginatedResponse<Bodycam>>(`/bodycam`, { params });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al buscar bodycam: ' + getErrorMessage(error));
    }
  }
};

/**
 * Obtener bodycams con paginación
 * @param {number} page - Número de página (default: 1)
 * @param {number} limit - Cantidad de items por página (default: 10)
 * @returns {Promise<Object>} - Objeto con data (bodycams) y pagination (metadata)
 */
export const getBodycams = async (page: number = 1, limit: number = 10): Promise<TableResult<BodycamView>> => {
  try {
    const response = await api.get<PaginatedResponse<Bodycam>>(`/bodycam?page=${page}&limit=${limit}`);

    const bodycams = response.data?.data?.data || [];
    const paginationData: Partial<PaginationMeta> = response.data?.data || {};

    // Los datos ya vienen en el formato correcto
    const transformedBodycams = bodycams.map(b => ({
      id: b.id,
      name: b.name,
      serie: b.serie,
      cam: b.cam || null, // Tipo de cámara: BODYCAM o CAMERA
      deleted_at: b.deleted_at
    }));

    // Calcular paginación
    const currentPageNum = paginationData.currentPage || page;
    const totalNum = paginationData.totalCount || transformedBodycams.length;
    const perPageNum = limit;
    const totalPagesNum = Math.ceil(totalNum / perPageNum);

    const from = totalNum === 0 ? 0 : ((currentPageNum - 1) * perPageNum) + 1;
    const to = Math.min(currentPageNum * perPageNum, totalNum);

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
    throw new Error('No se pudieron obtener las bodycams');
  }
};

/**
 * Obtener una bodycam específica por ID
 * @param {string} bodycamId - ID de la bodycam (UUID)
 * @returns {Promise<Object>} - Objeto con la bodycam encontrada
 */
export const getBodycamById = async (bodycamId: ID): Promise<FoundResult<BodycamView>> => {
  try {
    const response = await api.get<ApiResponse<Bodycam>>(`/bodycam/${bodycamId}`);

    if (response.data?.data) {
      const b = response.data.data;
      const transformed = {
        id: b.id,
        name: b.name,
        serie: b.serie,
        cam: b.cam || null, // Tipo de cámara: BODYCAM o CAMERA
        deleted_at: b.deleted_at
      };

      return {
        data: [transformed],
        found: true
      };
    }

    return { data: [], found: false };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return { data: [], found: false };
    }
    throw new Error('Error al buscar bodycam: ' + getErrorMessage(error));
  }
};

/**
 * Crear una nueva bodycam
 * @param {Object} bodycamData - Datos de la bodycam a crear
 * @param {string} bodycamData.name - Nombre de la bodycam
 * @param {string} bodycamData.serie - Serie de la bodycam
 * @returns {Promise} - Respuesta con la bodycam creada
 */
export const createBodycam = async (bodycamData: CreateBodycamDto): Promise<ApiResponse<Bodycam>> => {
  try {
    const response = await api.post<ApiResponse<Bodycam>>('/bodycam', bodycamData);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al crear bodycam: ' + getErrorMessage(error));
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
export const updateBodycam = async (bodycamId: ID, bodycamData: UpdateBodycamDto): Promise<ApiResponse<Bodycam>> => {
  try {
    const response = await api.patch<ApiResponse<Bodycam>>(`/bodycam/${bodycamId}`, bodycamData);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al actualizar bodycam: ' + getErrorMessage(error));
    }
  }
};

/**
 * Cambiar estado de una bodycam (toggle: habilitar/deshabilitar)
 * @param {string} bodycamId - ID de la bodycam (UUID)
 * @returns {Promise<Object>} - Objeto con el mensaje de confirmación
 */
export const deleteBodycam = async (bodycamId: ID): Promise<ApiMessageResponse> => {
  try {
    const response = await api.delete<ApiMessageResponse>(`/bodycam/${bodycamId}`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al cambiar estado de bodycam: ' + getErrorMessage(error));
    }
  }
};
