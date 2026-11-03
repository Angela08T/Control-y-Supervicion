/**
 * Sistema de permisos centralizado para Control y Supervisión
 * Define qué puede hacer cada rol en el sistema
 */
import type {
  AppRole,
  ModulePermissions,
  PermissionAction,
  PermissionMap,
  PermissionModule,
} from '@/types'

// Definición de roles
export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  CENTINELA: 'centinela',
  VALIDATOR: 'validator',
  SUBGERENTE: 'subgerente'
} as const

/**
 * Normaliza el rol del backend al formato del frontend
 * Backend: ADMINISTRATOR, SUPERVISOR, SENTINEL, VALIDATOR
 * Frontend: admin, supervisor, centinela, validator
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

  const normalized: AppRole | undefined = roleMap[backendRole.toUpperCase()]
  return normalized || ROLES.CENTINELA
}

// Permisos por módulo y rol
export const PERMISSIONS: PermissionMap = {
  // DASHBOARD
  dashboard: {
    view: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CENTINELA, ROLES.VALIDATOR, ROLES.SUBGERENTE]
  },

  // INCIDENCIAS
  incidencias: {
    view: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CENTINELA, ROLES.VALIDATOR, ROLES.SUBGERENTE],
    create: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CENTINELA],
    edit: [ROLES.ADMIN, ROLES.SUPERVISOR],
    delete: [ROLES.ADMIN, ROLES.SUPERVISOR],
    send: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CENTINELA], // Enviar al validador
    validate: [ROLES.ADMIN, ROLES.VALIDATOR] // Aprobar/Rechazar
  },

  // BODYCAM
  bodycam: {
    view: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CENTINELA],
    create: [ROLES.ADMIN],
    edit: [ROLES.ADMIN],
    delete: [ROLES.ADMIN]
  },

  // USUARIOS
  usuarios: {
    view: [ROLES.ADMIN, ROLES.SUPERVISOR],
    create: [ROLES.ADMIN, ROLES.SUPERVISOR], // SUPERVISOR solo puede crear CENTINELA
    edit: [ROLES.ADMIN, ROLES.SUPERVISOR],
    delete: [ROLES.ADMIN, ROLES.SUPERVISOR]
  },

  // CARGOS
  cargos: {
    view: [ROLES.ADMIN],
    create: [ROLES.ADMIN],
    edit: [ROLES.ADMIN],
    delete: [ROLES.ADMIN]
  },

  // PERSONAL
  personal: {
    view: [ROLES.ADMIN],
    create: [ROLES.ADMIN],
    edit: [ROLES.ADMIN],
    delete: [ROLES.ADMIN]
  },

  // ASUNTOS
  asuntos: {
    view: [ROLES.ADMIN, ROLES.SUPERVISOR],
    create: [ROLES.ADMIN],
    edit: [ROLES.ADMIN],
    delete: [ROLES.ADMIN]
  },

  // FALTAS
  faltas: {
    view: [ROLES.ADMIN, ROLES.SUPERVISOR],
    create: [ROLES.ADMIN],
    edit: [ROLES.ADMIN],
    delete: [ROLES.ADMIN]
  },

  // AUDITORÍA
  auditoria: {
    view: [ROLES.ADMIN],
    create: [ROLES.ADMIN],
    edit: [ROLES.ADMIN],
    delete: [ROLES.ADMIN]
  },

  // INFRACTORES (OFFENDERS)
  offenders: {
    view: [ROLES.ADMIN, ROLES.SUPERVISOR],
    create: [ROLES.ADMIN],
    edit: [ROLES.ADMIN],
    delete: [ROLES.ADMIN]
  },

  // ESTADÍSTICAS
  estadisticas: {
    view: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SUBGERENTE]
  }
}

/**
 * Verifica si un rol tiene permiso para realizar una acción en un módulo
 * @param {string} role - Rol del usuario (admin, supervisor, centinela)
 * @param {string} module - Módulo del sistema (incidencias, bodycam, etc.)
 * @param {string} action - Acción a realizar (view, create, edit, delete)
 * @returns {boolean}
 */
export function hasPermission(
  role: AppRole | null | undefined,
  module: PermissionModule | null | undefined,
  action: PermissionAction | null | undefined
): boolean {
  if (!role || !module || !action) return false

  const modulePermissions = PERMISSIONS[module]
  if (!modulePermissions) return false

  const allowedRoles = modulePermissions[action]
  if (!allowedRoles) return false

  return allowedRoles.includes(role)
}

/**
 * Verifica si un rol puede acceder a un módulo (al menos ver)
 * @param {string} role - Rol del usuario
 * @param {string} module - Módulo del sistema
 * @returns {boolean}
 */
export function canAccessModule(
  role: AppRole | null | undefined,
  module: PermissionModule | null | undefined
): boolean {
  return hasPermission(role, module, 'view')
}

/**
 * Obtiene todos los permisos de un rol en un módulo
 * @param {string} role - Rol del usuario
 * @param {string} module - Módulo del sistema
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

  if (currentUserRole === ROLES.SUPERVISOR) {
    // Supervisor solo puede gestionar centinelas
    if (action === 'create' && targetUserRole === ROLES.CENTINELA) return true
    if ((action === 'edit' || action === 'delete') && targetUserRole === ROLES.CENTINELA) return true
    return false
  }

  return false // Centinela no puede gestionar usuarios
}
