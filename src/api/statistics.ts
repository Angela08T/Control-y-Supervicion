import { AxiosError } from 'axios';
import api from './config';
import type {
  DashboardGeneralResponse,
  DashboardOffendersResponse,
  DashboardPerformanceResponse,
  DashboardTrendsResponse,
  DateOnlyString,
  LegacyStatisticsResponse,
  Offender,
  PaginatedResponse,
} from '@/types';

/**
 * Obtener estadísticas generales del dashboard
 * @returns {Promise} - Respuesta con estadísticas generales
 */
export const getDashboardStats = async (): Promise<LegacyStatisticsResponse> => {
  try {
    const response = await api.get<LegacyStatisticsResponse>('/statistics/dashboard');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener estadísticas: ' + (error instanceof Error ? error.message : ''));
    }
  }
};

/**
 * Obtener lista de personal/serenos activos
 * @returns {Promise} - Respuesta con lista de serenos
 */
export const getActivePersonnel = async (): Promise<LegacyStatisticsResponse> => {
  try {
    const response = await api.get<LegacyStatisticsResponse>('/personnel/active');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener personal: ' + (error instanceof Error ? error.message : ''));
    }
  }
};

/**
 * Obtener estadísticas de supervisión de campo
 * @returns {Promise} - Respuesta con datos de supervisión
 */
export const getFieldSupervisionStats = async (): Promise<LegacyStatisticsResponse> => {
  try {
    const response = await api.get<LegacyStatisticsResponse>('/statistics/field-supervision');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener supervisión de campo: ' + (error instanceof Error ? error.message : ''));
    }
  }
};

/**
 * Obtener lista de todos los offenders (serenos) para la tabla de personal
 * Utiliza el endpoint de offender existente
 * @returns {Promise} - Respuesta con lista de offenders
 */
export const getAllOffenders = async (): Promise<PaginatedResponse<Offender>> => {
  try {
    // Este endpoint debería existir en el backend para obtener todos los offenders
    const response = await api.get<PaginatedResponse<Offender>>('/offender');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener lista de offenders: ' + (error instanceof Error ? error.message : ''));
    }
  }
};

/**
 * Obtener tendencias del dashboard (evolución de incidencias por fecha y asunto)
 * @param {string} startDate - Fecha de inicio en formato YYYY-MM-DD
 * @param {string} endDate - Fecha de fin en formato YYYY-MM-DD
 * @returns {Promise} - Respuesta con datos de tendencias por día y asunto
 */
export const getDashboardTrends = async (startDate: DateOnlyString, endDate: DateOnlyString): Promise<DashboardTrendsResponse> => {
  try {
    const response = await api.get<DashboardTrendsResponse>('/dashboard/trends/', {
      params: {
        start: startDate,
        end: endDate
      }
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener tendencias del dashboard: ' + (error instanceof Error ? error.message : ''));
    }
  }
};

/**
 * Obtener métricas de performance por usuario
 * @param {string} startDate - Fecha de inicio en formato YYYY-MM-DD
 * @param {string} endDate - Fecha de fin en formato YYYY-MM-DD
 * @returns {Promise} - Respuesta con { general, performance }
 */
export const getDashboardPerformance = async (startDate: DateOnlyString, endDate: DateOnlyString): Promise<DashboardPerformanceResponse> => {
  try {
    const response = await api.get<DashboardPerformanceResponse>('/dashboard/performance', {
      params: { start: startDate, end: endDate }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtener métricas de infractores (offenders) con desglose por tipo de falta
 */
export const getDashboardOffenders = async (startDate: DateOnlyString, endDate: DateOnlyString): Promise<DashboardOffendersResponse> => {
  try {
    const response = await api.get<DashboardOffendersResponse>('/dashboard/offenders', {
      params: { start: startDate, end: endDate }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtener estadísticas generales del dashboard (incidencias críticas y zonas)
 * @param {string} startDate - Fecha de inicio en formato YYYY-MM-DD
 * @param {string} endDate - Fecha de fin en formato YYYY-MM-DD
 * @returns {Promise} - Respuesta con estadísticas generales
 */
export const getDashboardGeneral = async (startDate: DateOnlyString, endDate: DateOnlyString): Promise<DashboardGeneralResponse> => {
  try {
    const response = await api.get<DashboardGeneralResponse>('/dashboard/general/', {
      params: {
        start: startDate,
        end: endDate
      }
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al obtener estadísticas generales: ' + (error instanceof Error ? error.message : ''));
    }
  }
};
