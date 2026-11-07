import type { ID } from './common.types';
import type { PermissionAction, RolePermissions } from './auth.types';

/** Rol tal como lo devuelve GET /role. */
export interface RoleItem {
  id: ID;
  /** Valor que se guarda en `User.rol` */
  key: string;
  name: string;
  description: string | null;
  /** Los roles del sistema no se pueden eliminar */
  is_system: boolean;
  permissions: RolePermissions;
  /** Usuarios activos con este rol */
  users: number;
}

/** Módulo del catálogo de permisos con las acciones que admite. */
export interface PermissionCatalogModule {
  key: string;
  label: string;
  actions: PermissionAction[];
}

/** `data` de GET /role/catalog. */
export interface RoleCatalog {
  modules: PermissionCatalogModule[];
  actions: PermissionAction[];
}

/** Elemento de GET /role/options (selector de rol de Usuarios). */
export interface RoleOption {
  key: string;
  name: string;
  is_system: boolean;
}

/** Cuerpo de POST /role y PATCH /role/:id. */
export interface RoleFormData {
  name?: string;
  description?: string;
  permissions?: RolePermissions;
}
