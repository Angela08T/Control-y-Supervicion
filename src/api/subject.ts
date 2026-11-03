import api from './config';
import type {
  ApiMessageResponse,
  ApiResponse,
  CreateSubjectDto,
  ID,
  PaginatedResponse,
  Subject,
  UpdateSubjectDto,
} from '@/types';

/**
 * API para gestión de Asuntos (Subjects)
 */

// Obtener todos los asuntos con paginación
export const getSubjects = async (page = 1, limit = 10): Promise<PaginatedResponse<Subject>> => {
  try {
    const response = await api.get<PaginatedResponse<Subject>>('/subject', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener un asunto por ID
export const getSubjectById = async (subjectId: ID): Promise<ApiResponse<Subject>> => {
  try {
    const response = await api.get<ApiResponse<Subject>>(`/subject/${subjectId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Buscar asuntos por nombre
export const searchSubject = async (searchTerm: string): Promise<PaginatedResponse<Subject>> => {
  try {
    const response = await api.get<PaginatedResponse<Subject>>('/subject', {
      params: { search: searchTerm }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Crear un nuevo asunto
export const createSubject = async (subjectData: CreateSubjectDto): Promise<ApiResponse<Subject>> => {
  try {
    const response = await api.post<ApiResponse<Subject>>('/subject', subjectData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Actualizar un asunto existente
export const updateSubject = async (subjectId: ID, subjectData: UpdateSubjectDto): Promise<ApiResponse<Subject>> => {
  try {
    const response = await api.patch<ApiResponse<Subject>>(`/subject/${subjectId}`, subjectData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Eliminar un asunto
export const deleteSubject = async (subjectId: ID): Promise<ApiMessageResponse> => {
  try {
    const response = await api.delete<ApiMessageResponse>(`/subject/${subjectId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
