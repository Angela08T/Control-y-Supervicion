import api from './config';
import type {
  ApiResponse,
  ID,
  Jurisdiction,
  PaginatedResponse,
} from '@/types';

/**
 * API para gestión de Jurisdicciones
 */

// Obtener todas las jurisdicciones
export const getJurisdictions = async (): Promise<PaginatedResponse<Jurisdiction>> => {
  try {
    const response = await api.get<PaginatedResponse<Jurisdiction>>('/jurisdiction');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener una jurisdicción por ID
export const getJurisdictionById = async (jurisdictionId: ID): Promise<ApiResponse<Jurisdiction>> => {
  try {
    const response = await api.get<ApiResponse<Jurisdiction>>(`/jurisdiction/${jurisdictionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
