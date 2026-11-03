import { AxiosError } from 'axios';
import api from './config';
import type {
  ApiMessageResponse,
  ApiResponse,
  CreateUserDto,
  FilterUserParams,
  ID,
  PaginatedResponse,
  Role,
  UpdateUserDto,
  User,
} from '@/types';

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/**
 * API unificada para gestión de usuarios (Supervisores y Sentinels)
 * Todos los endpoints ahora usan /user
 */

// ==================== FUNCIONES PRINCIPALES ====================

/**
 * Crear un usuario (Supervisor o Sentinel)
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.name - Nombre
 * @param {string} userData.lastname - Apellido
 * @param {string} userData.username - Usuario
 * @param {string} userData.password - Contraseña
 * @param {string} userData.email - Email
 * @param {string} userData.rol - Rol: "SUPERVISOR" o "SENTINEL"
 * @returns {Promise} - Respuesta con el usuario creado
 */
export const createUser = async (userData: CreateUserDto): Promise<ApiResponse<User>> => {
  try {
    const response = await api.post<ApiResponse<User>>('/user', userData);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al crear usuario: ' + getErrorMessage(error));
    }
  }
};

/**
 * Obtener todos los usuarios con paginación y filtros
 * @param {number} page - Número de página
 * @param {number} limit - Límite de registros por página
 * @param {string} rol - Filtro por rol (opcional): ADMINISTRATOR, SUPERVISOR, SENTINEL, VALIDATOR
 * @param {string} search - Término de búsqueda (opcional)
 * @returns {Promise} - Respuesta con usuarios
 */
export const getUsers = async (page: number = 1, limit: number = 10, rol: Role | null = null, search: string | null = null): Promise<PaginatedResponse<User>> => {
  try {
    const params: FilterUserParams = { page, limit };

    // Agregar filtro de rol si existe
    if (rol) {
      params.rol = rol;
    }

    // Agregar búsqueda si existe
    if (search) {
      params.search = search;
    }

    const response = await api.get<PaginatedResponse<User>>('/user', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Buscar usuarios
 * @param {string} searchTerm - Término de búsqueda
 * @param {string} rol - Filtro por rol (opcional)
 * @returns {Promise} - Respuesta con usuarios encontrados
 */
export const searchUser = async (searchTerm: string, rol: Role | null = null): Promise<PaginatedResponse<User>> => {
  try {
    const params: FilterUserParams = { search: searchTerm };

    // Agregar filtro de rol si existe
    if (rol) {
      params.rol = rol;
    }

    const response = await api.get<PaginatedResponse<User>>('/user', { params });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al buscar usuarios: ' + getErrorMessage(error));
    }
  }
};

/**
 * Filtrar usuarios por rol
 * @param {string} rol - Rol a filtrar: ADMINISTRATOR, SUPERVISOR, SENTINEL, VALIDATOR
 * @param {number} page - Número de página
 * @param {number} limit - Límite de registros por página
 * @returns {Promise} - Respuesta con usuarios filtrados
 */
export const getUsersByRole = async (rol: Role, page: number = 1, limit: number = 10): Promise<PaginatedResponse<User>> => {
  try {
    const response = await api.get<PaginatedResponse<User>>('/user', {
      params: { rol, page, limit }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Actualizar un usuario
 * @param {string} userId - ID del usuario
 * @param {Object} userData - Datos a actualizar
 * @returns {Promise} - Respuesta con el usuario actualizado
 */
export const updateUser = async (userId: ID, userData: UpdateUserDto): Promise<ApiResponse<User>> => {
  try {
    const response = await api.patch<ApiResponse<User>>(`/user/${userId}`, userData);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al actualizar usuario: ' + getErrorMessage(error));
    }
  }
};

/**
 * Eliminar un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise} - Respuesta de eliminación
 */
export const deleteUser = async (userId: ID): Promise<ApiMessageResponse> => {
  try {
    const response = await api.delete<ApiMessageResponse>(`/user/${userId}`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al eliminar usuario: ' + getErrorMessage(error));
    }
  }
};

/**
 * Desactivar sesión de un usuario
 * @param {string} userId - ID del usuario
 * @param {string} ip - IP de la sesión a desactivar
 * @returns {Promise} - Respuesta de desactivación
 */
export const deactivateSession = async (userId: ID, ip: string): Promise<ApiMessageResponse> => {
  try {
    const response = await api.post<ApiMessageResponse>('/session/deactivate', {
      user_id: userId,
      ip: ip
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw error;
    } else if (error instanceof AxiosError && error.request) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    } else {
      throw new Error('Error al desactivar sesión: ' + getErrorMessage(error));
    }
  }
};

// ==================== FUNCIONES DE COMPATIBILIDAD ====================
// Estas funciones mantienen la interfaz antigua pero usan el nuevo endpoint

/**
 * Crear un supervisor (compatibilidad)
 */
export const createSupervisor = async (userData: Omit<CreateUserDto, 'rol'>): Promise<ApiResponse<User>> => {
  return createUser({ ...userData, rol: 'SUPERVISOR' });
};

/**
 * Crear un sentinel (compatibilidad)
 */
export const createSentinel = async (userData: Omit<CreateUserDto, 'rol'>): Promise<ApiResponse<User>> => {
  return createUser({ ...userData, rol: 'SENTINEL' });
};

/**
 * Buscar supervisores (compatibilidad)
 */
export const searchSupervisor = async (searchTerm: string): Promise<PaginatedResponse<User>> => {
  return searchUser(searchTerm);
};

/**
 * Buscar sentinels (compatibilidad)
 */
export const searchSentinel = async (searchTerm: string): Promise<PaginatedResponse<User>> => {
  return searchUser(searchTerm);
};

/**
 * Obtener supervisores (compatibilidad)
 */
export const getSupervisors = async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<User>> => {
  return getUsers(page, limit);
};

/**
 * Obtener sentinels (compatibilidad)
 */
export const getSentinels = async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<User>> => {
  return getUsers(page, limit);
};

/**
 * Actualizar supervisor (compatibilidad)
 */
export const updateSupervisor = async (supervisorId: ID, userData: UpdateUserDto): Promise<ApiResponse<User>> => {
  return updateUser(supervisorId, userData);
};

/**
 * Actualizar sentinel (compatibilidad)
 */
export const updateSentinel = async (sentinelId: ID, userData: UpdateUserDto): Promise<ApiResponse<User>> => {
  return updateUser(sentinelId, userData);
};

/**
 * Eliminar supervisor (compatibilidad)
 */
export const deleteSupervisor = async (supervisorId: ID): Promise<ApiMessageResponse> => {
  return deleteUser(supervisorId);
};

/**
 * Eliminar sentinel (compatibilidad)
 */
export const deleteSentinel = async (sentinelId: ID): Promise<ApiMessageResponse> => {
  return deleteUser(sentinelId);
};
