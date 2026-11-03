import api from './config';
import type {
  ApiMessageResponse,
  ApiResponse,
  CreateLeadDto,
  ID,
  Lead,
  PaginatedResponse,
  UpdateLeadDto,
} from '@/types';

/**
 * API para gestión de Personal (Leads)
 */

// Obtener todo el personal con paginación
export const getLeads = async (page = 1, limit = 10): Promise<PaginatedResponse<Lead>> => {
  try {
    const response = await api.get<PaginatedResponse<Lead>>('/lead', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener una persona por ID
export const getLeadById = async (leadId: ID): Promise<ApiResponse<Lead>> => {
  try {
    const response = await api.get<ApiResponse<Lead>>(`/lead/${leadId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Buscar personal por nombre
export const searchLead = async (searchTerm: string): Promise<PaginatedResponse<Lead>> => {
  try {
    const response = await api.get<PaginatedResponse<Lead>>('/lead', {
      params: { search: searchTerm }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Crear una nueva persona
export const createLead = async (leadData: CreateLeadDto): Promise<ApiResponse<Lead>> => {
  try {
    const response = await api.post<ApiResponse<Lead>>('/lead', leadData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Actualizar una persona existente
export const updateLead = async (leadId: ID, leadData: UpdateLeadDto): Promise<ApiResponse<Lead>> => {
  try {
    const response = await api.patch<ApiResponse<Lead>>(`/lead/${leadId}`, leadData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Cambiar estado de una persona (toggle: habilitar/deshabilitar)
export const deleteLead = async (leadId: ID): Promise<ApiMessageResponse> => {
  try {
    const response = await api.delete<ApiMessageResponse>(`/lead/${leadId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
