/**
 * Permisos de Control y Supervisión.
 *
 * Qué puede hacer cada rol ya no está escrito aquí: lo define el administrador en "Roles y permisos"
 * y el backend lo entrega al iniciar sesión (y en GET /auth/me). Estas funciones leen esos permisos
 * del estado de la sesión.
 */
import { store } from '@/store'
import type {
  AppRole,
  ModulePermissions,
  PermissionAction,
  PermissionModule,
} from '@/types'

// Definición de roles (ruta base de cada rol en el front)
export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  CENTINELA: 'centinela',
  VALIDATOR: 'validator',
  SUBGERENTE: 'subgerente',
  CUSTOM: 'custom'
} as const

/**
 * Normaliza el rol del backend al formato del frontend
 * Backend: ADMINISTRATOR, SUPERVISOR, SENTINEL, VALIDATOR, SUBGERENTE o la clave de un rol creado
 * Frontend: admin, supervisor, centinela, validator, subgerente o custom
 * @param {string} backendRole - Rol del backend
 * @returns {string} Rol normalizado para el frontend
 */
export function normalizeRole(backendRole: string | null | undefined): AppRole {
  if (!backendRole) return ROLES.CENTINELA

  const roleMap: Record<string, AppRole> = {
    'ADMINISTRATOR': ROLES.ADMIN,
    'ADMIN': ROLES.ADMIN,
    'SUPERVISOR': ROLES.SUPERVISOR,
    'SENTINEL': ROLES.CENTINELA,
    'CENTINELA': ROLES.CENTINELA,
    'VALIDATOR': ROLES.VALIDATOR,
    'SUBGERENTE': ROLES.SUBGERENTE
  }

  // Cualquier otra clave es un rol creado por el administrador
  return roleMap[backendRole.toUpperCase()] ?? ROLES.CUSTOM
}

/**
 * Verifica si el usuario con sesión iniciada puede realizar una acción en un módulo.
 * El primer parámetro se mantiene por compatibilidad: los permisos son los de la sesión actual.
 */
export function hasPermission(
  role: AppRole | null | undefined,
  module: PermissionModule | null | undefined,
  action: PermissionAction | null | undefined
): boolean {
  if (!role || !module || !action) return false
  const { permissions } = store.getState().auth
  return permissions[module]?.includes(action) ?? false
}

/**
 * Verifica si el usuario puede acceder a un módulo (al menos ver)
 */
export function canAccessModule(
  role: AppRole | null | undefined,
  module: PermissionModule | null | undefined
): boolean {
  return hasPermission(role, module, 'view')
}

/**
 * Obtiene todos los permisos del usuario en un módulo
 * @returns {object} Objeto con booleanos para cada acción
 */
export function getModulePermissions(
  role: AppRole | null | undefined,
  module: PermissionModule | null | undefined
): ModulePermissions {
  return {
    canView: hasPermission(role, module, 'view'),
    canCreate: hasPermission(role, module, 'create'),
    canEdit: hasPermission(role, module, 'edit'),
    canDelete: hasPermission(role, module, 'delete'),
    canSend: hasPermission(role, module, 'send'),
    canValidate: hasPermission(role, module, 'validate')
  }
}

/**
 * Verifica permisos específicos para usuarios
 * SUPERVISOR solo puede crear/editar/eliminar CENTINELA
 * ADMIN puede crear/editar/eliminar cualquier usuario
 */
export function canManageUser(
  currentUserRole: AppRole | null | undefined,
  targetUserRole: AppRole | null | undefined,
  action: PermissionAction
): boolean {
  if (currentUserRole === ROLES.ADMIN) {
    return true // Admin puede hacer todo
  }

  // Cualquier otro rol que pueda gestionar usuarios solo gestiona centinelas
  if (targetUserRole === ROLES.CENTINELA && hasPermission(currentUserRole, 'usuarios', action)) return true

  return false
}
