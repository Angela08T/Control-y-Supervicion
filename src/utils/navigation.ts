import type { PermissionModule, RolePermissions } from '@/types'

export type NavKey =
  | 'dashboard'
  | 'incidencias'
  | 'inasistencias'
  | 'bodycam'
  | 'estadisticas'
  | 'personal'
  | 'cargos'
  | 'infractores'
  | 'asuntos'
  | 'faltas'
  | 'usuarios'
  | 'roles'
  | 'auditoria'

/** Módulo de permisos que controla cada opción del menú (y su ruta) */
export const NAV_MODULE: Record<NavKey, PermissionModule> = {
  dashboard: 'dashboard',
  incidencias: 'incidencias',
  inasistencias: 'inasistencias',
  bodycam: 'bodycam',
  estadisticas: 'estadisticas',
  personal: 'personal',
  cargos: 'cargos',
  infractores: 'offenders',
  asuntos: 'asuntos',
  faltas: 'faltas',
  usuarios: 'usuarios',
  roles: 'roles',
  auditoria: 'auditoria',
}

/**
 * Menú por tema: lo que se usa cada día, las personas que se registran, los catálogos de faltas y,
 * aparte, quién puede entrar al sistema y qué queda registrado. Cada rol ve solo lo que puede consultar.
 */
export const NAV_GROUPS: { title: string; keys: NavKey[] }[] = [
  { title: 'Operación', keys: ['dashboard', 'incidencias', 'inasistencias', 'bodycam', 'estadisticas'] },
  { title: 'Personas', keys: ['personal', 'cargos', 'infractores'] },
  { title: 'Catálogos', keys: ['asuntos', 'faltas'] },
  { title: 'Seguridad', keys: ['usuarios', 'roles', 'auditoria'] },
]

/** ¿Los permisos incluyen ver esta opción? */
export function canSee(permissions: RolePermissions, key: NavKey): boolean {
  return permissions[NAV_MODULE[key]]?.includes('view') ?? false
}

/** Primera opción del menú (que no sea el inicio) a la que el rol tiene acceso. */
export function firstAllowedKey(permissions: RolePermissions): NavKey | null {
  for (const group of NAV_GROUPS)
    for (const key of group.keys) if (key !== 'dashboard' && canSee(permissions, key)) return key
  return null
}
