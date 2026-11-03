import { AxiosError } from 'axios';
import api from './config';
import type {
  ApiMessageResponse,
  ApiResponse,
  CreateJobDto,
  ID,
  Job,
  Lead,
  PaginatedResponse,
  UpdateJobDto,
} from '@/types';

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/**
 * API para gestión de Cargos (Jobs)
 */

// Obtener todos los cargos con paginación
export const getJobs = async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<Job>> => {
  try {
    const response = await api.get<PaginatedResponse<Job>>('/job', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener un cargo por ID
export const getJobById = async (jobId: ID): Promise<ApiResponse<Job>> => {
  try {
    const response = await api.get<ApiResponse<Job>>(`/job/${jobId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Buscar cargos por nombre
export const searchJob = async (searchTerm: string): Promise<PaginatedResponse<Job>> => {
  try {
    const response = await api.get<PaginatedResponse<Job>>('/job', {
      params: { search: searchTerm }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Crear un nuevo cargo
export const createJob = async (jobData: CreateJobDto): Promise<ApiResponse<Job>> => {
  try {
    const response = await api.post<ApiResponse<Job>>('/job', jobData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Actualizar un cargo existente
export const updateJob = async (jobId: ID, jobData: UpdateJobDto): Promise<ApiResponse<Job>> => {
  try {
    const response = await api.put<ApiResponse<Job>>(`/job/${jobId}`, jobData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Cambiar estado de un cargo (toggle: habilitar/deshabilitar)
export const deleteJob = async (jobId: ID): Promise<ApiMessageResponse> => {
  try {
    const response = await api.delete<ApiMessageResponse>(`/job/${jobId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Funciones heredadas para compatibilidad con código existente
 */

// Obtener lista de líderes/personas según el cargo (job)
export const getLeadsByJob = async (jobId: ID): Promise<PaginatedResponse<Lead>> => {
  try {
    const response = await api.get<PaginatedResponse<Lead>>('/lead', {
      params: { job: jobId }
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener personas: ' + getErrorMessage(error));
    }
  }
};

// Obtener lista completa de líderes/personas (sin filtro)
export const getAllLeads = async (): Promise<PaginatedResponse<Lead>> => {
  try {
    const response = await api.get<PaginatedResponse<Lead>>('/lead');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener lista de personas: ' + getErrorMessage(error));
    }
  }
};
