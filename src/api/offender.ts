import api, { offenderApi } from './config';
import type {
  ApiMessageResponse,
  ApiResponse,
  Attendance,
  CreateAbsenceDto,
  CreateAttendanceDto,
  CreateOffenderDto,
  DateOnlyString,
  FilterAttendanceParams,
  FilterOffenderParams,
  ID,
  ISODateString,
  Mode,
  OffenderDniLookup,
  OffenderEntity,
  OffenderFormPayload,
  PaginatedResponse,
  Offender,
  Report,
  UpdateOffenderDto,
} from '@/types';

/**
 * Formulario de inasistencias que consume mapFormDataToOffenderAPI
 */
interface AttendanceFormData {
  turno: string;
  nombreCompleto?: string;
  dni?: string;
  cargo?: string;
  regLab?: string;
}

/**
 * Offender con sus inasistencias del rango, tal como lo devuelve GET /attendance
 */
interface AttendanceOffenderRow {
  id?: ID;
  offender_id?: ID;
  dni: string;
  name: string;
  lastname: string;
  fullname?: string;
  job: string;
  regime: string;
  shift: string;
  subgerencia?: string;
  jurisdiction?: string;
  created_at: ISODateString;
  updated_at: ISODateString;
  attendances: Attendance[];
}

/**
 * API para gestión de Infractores (Offenders)
 */

// Obtener todos los infractores con paginación
export const getOffenders = async (page = 1, limit = 10, search = ''): Promise<PaginatedResponse<Offender>> => {
  try {
    const params: FilterOffenderParams = { page, limit };
    if (search) params.search = search;

    const response = await api.get<PaginatedResponse<Offender>>('/offender', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener lista de subgerencias únicas
export const getSubgerencias = async (): Promise<string[] | ApiResponse<string[]>> => {
  const response = await api.get<ApiResponse<string[]> | string[]>('/offender/subgerencias');
  const body = response.data;
  if (Array.isArray(body)) return body;
  return body?.data || body || [];
};

// Buscar infractor por DNI
export const getOffenderByDni = async (dni: string): Promise<ApiResponse<OffenderDniLookup>> => {
  try {
    const response = await api.get<ApiResponse<OffenderDniLookup>>(`/offender/dni/${dni}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Crear un nuevo infractor
export const createOffender = async (
  offenderData: CreateOffenderDto | OffenderFormPayload
): Promise<ApiResponse<OffenderEntity>> => {
  try {
    const response = await api.post<ApiResponse<OffenderEntity>>('/offender', offenderData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Actualizar un infractor existente
export const updateOffender = async (
  offenderId: ID,
  offenderData: UpdateOffenderDto
): Promise<ApiResponse<OffenderEntity>> => {
  try {
    const response = await api.patch<ApiResponse<OffenderEntity>>(`/offender/${offenderId}`, offenderData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Eliminar/Toggle estado de un infractor (soft delete)
export const deleteOffender = async (offenderId: ID): Promise<ApiMessageResponse> => {
  try {
    const response = await api.delete<ApiMessageResponse>(`/offender/${offenderId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Mapear datos del formulario de inasistencia al formato de la API de offender
 * @param {Object} form - Datos del formulario de incidencia
 * @returns {Object} - Datos formateados para la API de offender
 */
export function mapFormDataToOffenderAPI(form: AttendanceFormData): OffenderFormPayload {
  // Convertir el turno completo a la inicial si viene completo
  let shiftInitial = form.turno;
  if (form.turno === 'Mañana') {
    shiftInitial = 'M';
  } else if (form.turno === 'Tarde') {
    shiftInitial = 'T';
  } else if (form.turno === 'Noche') {
    shiftInitial = 'N';
  }

  // Extraer nombre y apellido del nombreCompleto
  const nombreCompleto = form.nombreCompleto || '';
  const partes = nombreCompleto.trim().split(' ');
  const name = partes[0] || '';
  const lastname = partes.slice(1).join(' ') || '';

  const payload: OffenderFormPayload = {
    name: name,
    lastname: lastname,
    dni: form.dni || '',
    job: form.cargo || '',
    regime: form.regLab || '',
    shift: shiftInitial,
    attendance: false // Siempre false para inasistencias
  };

  return payload;
}

/**
 * Crear inasistencias (attendances) para offenders
 * @param {Array} attendanceData - Array de items con offender_id y attendances
 * @returns {Promise} - Respuesta con el resultado de la creación
 *
 * Formato esperado:
 * {
 *   items: [
 *     {
 *       offender_id: "uuid",
 *       attendances: [
 *         { date: "2025-11-09", mode: "UNJUSTIFIED" }
 *       ]
 *     }
 *   ]
 * }
 */
export const createAttendances = async (
  attendanceData: CreateAttendanceDto
): Promise<ApiResponse<{ count: number }>> => {
  try {
    const response = await offenderApi.post<ApiResponse<{ count: number }>>('/attendance', attendanceData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtener inasistencias guardadas en un rango de fechas
 * @param {string} start - Fecha de inicio (YYYY-MM-DD)
 * @param {string} end - Fecha de fin (YYYY-MM-DD)
 * @param {string} mode - Modo opcional: "JUSTIFIED" o "UNJUSTIFIED"
 * @returns {Promise} - Respuesta con las inasistencias guardadas
 */
export const getAttendances = async (
  start: DateOnlyString,
  end: DateOnlyString,
  mode: Mode | null = null
): Promise<ApiResponse<AttendanceOffenderRow[]>> => {
  try {
    const params: FilterAttendanceParams = { start, end };
    if (mode) {
      params.mode = mode;
    }
    const response = await offenderApi.get<ApiResponse<AttendanceOffenderRow[]>>('/attendance', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Eliminar una inasistencia específica (soft delete)
 * @param {string} attendanceId - ID de la inasistencia a eliminar
 * @returns {Promise} - Respuesta de la eliminación
 */
export const deleteAttendance = async (attendanceId: ID): Promise<ApiMessageResponse> => {
  try {
    const response = await offenderApi.delete<ApiMessageResponse>(`/attendance/${attendanceId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Crear reporte de inasistencias (absence report)
 * @param {Object} reportData - Datos del reporte
 * @param {Object} reportData.header - Encabezado del reporte
 * @param {Object} reportData.header.to - Destinatario principal {name, job}
 * @param {Array} reportData.header.cc - Array de destinatarios en copia [{name, job}]
 * @param {string} reportData.subject_id - ID del asunto
 * @param {string} reportData.lack_id - ID de la falta
 * @param {string} reportData.mode - Modo: "JUSTIFIED" o "UNJUSTIFIED"
 * @param {string} reportData.start - Fecha de inicio (YYYY-MM-DD)
 * @param {string} reportData.end - Fecha de fin (YYYY-MM-DD)
 * @returns {Promise} - Respuesta con el reporte generado
 */
export const createAbsenceReport = async (reportData: CreateAbsenceDto): Promise<ApiResponse<Report>> => {
  try {
    const response = await offenderApi.post<ApiResponse<Report>>('/absence', reportData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
