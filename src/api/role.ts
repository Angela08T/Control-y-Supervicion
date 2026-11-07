import { AxiosError } from 'axios';
import api from './config';
import type {
  ApiMessageResponse,
  ApiResponse,
  ID,
  LoginData,
  RoleCatalog,
  RoleFormData,
  RoleItem,
  RoleOption,
} from '@/types';

/** Deja pasar los errores del servidor (traen el mensaje) y traduce los de conexión. */
function rethrow(error: unknown, fallback: string): never {
  if (error instanceof AxiosError && error.response) throw error;
  if (error instanceof AxiosError && error.request)
    throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
  throw new Error(fallback + (error instanceof Error ? error.message : String(error)));
}

/** Roles con sus permisos y la cantidad de usuarios de cada uno. */
export const getRoles = async (): Promise<RoleItem[]> => {
  try {
    const response = await api.get<ApiResponse<RoleItem[]>>('/role');
    return response.data.data;
  } catch (error) {
    return rethrow(error, 'Error al obtener los roles: ');
  }
};

/** Módulos y acciones que se pueden marcar en un rol. */
export const getRoleCatalog = async (): Promise<RoleCatalog> => {
  try {
    const response = await api.get<ApiResponse<RoleCatalog>>('/role/catalog');
    return response.data.data;
  } catch (error) {
    return rethrow(error, 'Error al obtener el catálogo de permisos: ');
  }
};

/** Roles que se pueden asignar a un usuario. */
export const getRoleOptions = async (): Promise<RoleOption[]> => {
  try {
    const response = await api.get<ApiResponse<RoleOption[]>>('/role/options');
    return response.data.data;
  } catch (error) {
    return rethrow(error, 'Error al obtener los roles: ');
  }
};

export const createRole = async (data: RoleFormData): Promise<ApiResponse<RoleItem>> => {
  try {
    const response = await api.post<ApiResponse<RoleItem>>('/role', data);
    return response.data;
  } catch (error) {
    return rethrow(error, 'Error al crear el rol: ');
  }
};

export const updateRole = async (id: ID, data: RoleFormData): Promise<ApiResponse<RoleItem>> => {
  try {
    const response = await api.patch<ApiResponse<RoleItem>>(`/role/${id}`, data);
    return response.data;
  } catch (error) {
    return rethrow(error, 'Error al actualizar el rol: ');
  }
};

export const deleteRole = async (id: ID): Promise<ApiMessageResponse> => {
  try {
    const response = await api.delete<ApiMessageResponse>(`/role/${id}`);
    return response.data;
  } catch (error) {
    return rethrow(error, 'Error al eliminar el rol: ');
  }
};

/** Sesión actual: rol y permisos vigentes (se recarga al abrir la página). */
export const getMe = async (): Promise<Omit<LoginData, 'token'>> => {
  try {
    const response = await api.get<ApiResponse<Omit<LoginData, 'token'>>>('/auth/me');
    return response.data.data;
  } catch (error) {
    return rethrow(error, 'Error al obtener la sesión: ');
  }
};
