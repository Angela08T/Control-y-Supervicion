/**
 * Sistema de permisos centralizado para Control y Supervisión
 * Define qué puede hacer cada rol en el sistema
 */

// Definición de roles
export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  CENTINELA: 'centinela'
}

// Permisos por módulo y rol
export const PERMISSIONS = {
  // DASHBOARD
  dashboard: {
    view: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CENTINELA]
  },

  // INCIDENCIAS
  incidencias: {
    view: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CENTINELA],
    create: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CENTINELA],
    edit: [ROLES.ADMIN, ROLES.SUPERVISOR],
    delete: [ROLES.ADMIN, ROLES.SUPERVISOR]
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

  // AUDITORÍA
  auditoria: {
    view: [ROLES.ADMIN],
    create: [ROLES.ADMIN],
    edit: [ROLES.ADMIN],
    delete: [ROLES.ADMIN]
  }
}

/**
 * Verifica si un rol tiene permiso para realizar una acción en un módulo
 * @param {string} role - Rol del usuario (admin, supervisor, centinela)
 * @param {string} module - Módulo del sistema (incidencias, bodycam, etc.)
 * @param {string} action - Acción a realizar (view, create, edit, delete)
 * @returns {boolean}
 */
export function hasPermission(role, module, action) {
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
export function canAccessModule(role, module) {
  return hasPermission(role, module, 'view')
}

/**
 * Obtiene todos los permisos de un rol en un módulo
 * @param {string} role - Rol del usuario
 * @param {string} module - Módulo del sistema
 * @returns {object} Objeto con booleanos para cada acción
 */
export function getModulePermissions(role, module) {
  return {
    canView: hasPermission(role, module, 'view'),
    canCreate: hasPermission(role, module, 'create'),
    canEdit: hasPermission(role, module, 'edit'),
    canDelete: hasPermission(role, module, 'delete')
  }
}

/**
 * Verifica permisos específicos para usuarios
 * SUPERVISOR solo puede crear/editar/eliminar CENTINELA
 * ADMIN puede crear/editar/eliminar cualquier usuario
 */
export function canManageUser(currentUserRole, targetUserRole, action) {
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
