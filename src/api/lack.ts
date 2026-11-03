import api from './config';
import type {
  ApiMessageResponse,
  ApiResponse,
  CreateLackDto,
  FilterLackParams,
  ID,
  Lack,
  PaginatedResponse,
  UpdateLackDto,
} from '@/types';

/**
 * API para gestión de Faltas (Lacks)
 */

// Obtener todas las faltas con paginación y búsqueda opcional
export const getLacks = async (page = 1, limit = 10, search: string | null = null): Promise<PaginatedResponse<Lack>> => {
  try {
    const params: FilterLackParams = { page, limit };

    // Agregar búsqueda si existe
    if (search) {
      params.search = search;
    }

    const response = await api.get<PaginatedResponse<Lack>>('/lack', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener una falta por ID
export const getLackById = async (lackId: ID): Promise<ApiResponse<Lack>> => {
  try {
    const response = await api.get<ApiResponse<Lack>>(`/lack/${lackId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Buscar faltas por nombre
export const searchLack = async (searchTerm: string): Promise<PaginatedResponse<Lack>> => {
  try {
    const response = await api.get<PaginatedResponse<Lack>>('/lack', {
      params: { search: searchTerm }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Crear una nueva falta
export const createLack = async (lackData: CreateLackDto): Promise<ApiResponse<Lack>> => {
  try {
    const response = await api.post<ApiResponse<Lack>>('/lack', lackData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Actualizar una falta existente
export const updateLack = async (lackId: ID, lackData: UpdateLackDto): Promise<ApiResponse<Lack>> => {
  try {
    const response = await api.patch<ApiResponse<Lack>>(`/lack/${lackId}`, lackData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Eliminar una falta
export const deleteLack = async (lackId: ID): Promise<ApiMessageResponse> => {
  try {
    const response = await api.delete<ApiMessageResponse>(`/lack/${lackId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
