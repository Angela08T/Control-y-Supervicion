import type { ApiResponse, ID } from './common.types';

/** Claves de los roles del sistema (los roles creados por el administrador usan otras claves). */
export const ROLS = ['ADMINISTRATOR', 'SUPERVISOR', 'SENTINEL', 'VALIDATOR', 'SUBGERENTE'] as const;
/** Clave de un rol (`User.rol`): uno del sistema o uno creado en Roles y permisos. */
export type Role = string;
/** Alias matching the backend name. */
export type Rol = Role;

/**
 * Normalized role used by the front (utils/permissions.ts `ROLES`). Define la ruta base del usuario;
 * 'custom' agrupa a todos los roles creados por el administrador.
 */
export const APP_ROLES = ['admin', 'supervisor', 'centinela', 'validator', 'subgerente', 'custom'] as const;
export type AppRole = (typeof APP_ROLES)[number];

/** Backend `LoginDto` (POST /auth/login). */
export interface LoginCredentials {
  username: string;
  password: string;
}

/** `data` of POST /auth/login (AuthService.login). */
export interface LoginData {
  /** username */
  user: string;
  rol: Role;
  /** Nombre visible del rol */
  role_name: string;
  permissions: RolePermissions;
  token: string;
  nombre: string;
  apellido: string;
}

export type LoginResponse = ApiResponse<LoginData>;

/** `data` of POST /auth/logout. */
export interface LogoutData {
  success: boolean;
}

export type LogoutResponse = ApiResponse<LogoutData>;

/** Redux `auth` slice state. */
export interface AuthState {
  token: string | null;
  username: string | null;
  role: AppRole | null;
  /** Clave del rol en el backend (`User.rol`) */
  roleKey: string | null;
  roleName: string | null;
  permissions: RolePermissions;
  authorized: boolean;
  id: ID | null;
  nombre: string | null;
  apellido: string | null;
}

/** Payload of the `login` action of authSlice. */
export interface AuthLoginPayload {
  token: string;
  id: ID | null;
  username: string;
  role: AppRole;
  roleKey: string;
  roleName: string;
  permissions: RolePermissions;
  nombre: string | null;
  apellido: string | null;
}

/** Return value of useLogin().handleLogin. */
export interface LoginResult {
  success: boolean;
  role: AppRole | null;
}

// ==================== Permissions (utils/permissions.ts) ====================

export type PermissionModule =
  | 'dashboard'
  | 'incidencias'
  | 'bodycam'
  | 'usuarios'
  | 'cargos'
  | 'personal'
  | 'asuntos'
  | 'faltas'
  | 'auditoria'
  | 'offenders'
  | 'estadisticas'
  | 'inasistencias'
  | 'jurisdicciones'
  | 'sesiones'
  | 'roles';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'send' | 'validate';

/** Permisos de un rol: { modulo: [acciones] } (lo devuelve el backend al iniciar sesión). */
export type RolePermissions = Record<string, PermissionAction[]>;

export interface ModulePermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSend: boolean;
  canValidate: boolean;
}
