import type { ApiResponse, ID } from './common.types';

/** Backend enum `Rol`. */
export const ROLS = ['ADMINISTRATOR', 'SUPERVISOR', 'SENTINEL', 'VALIDATOR', 'SUBGERENTE'] as const;
export type Role = (typeof ROLS)[number];
/** Alias matching the backend enum name. */
export type Rol = Role;

/** Normalized role used by the front (utils/permissions.ts `ROLES`). */
export const APP_ROLES = ['admin', 'supervisor', 'centinela', 'validator', 'subgerente'] as const;
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
  | 'estadisticas';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'send' | 'validate';

export type PermissionMap = Record<PermissionModule, Partial<Record<PermissionAction, readonly AppRole[]>>>;

export interface ModulePermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSend: boolean;
  canValidate: boolean;
}
