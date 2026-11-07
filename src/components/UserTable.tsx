import React from 'react'
import { FiEdit2, FiLogOut, FiUserCheck, FiUserX } from 'react-icons/fi'
import Badge from '@/components/UI/Badge'
import { EmptyState } from '@/components/UI/EmptyState'
import type { ID, User } from '@/types'
import { actionBtn, actionBtnDanger, actions, cn, incTable, incTableTd, incTableTh, incTableTr } from '@/utils/classes'

/** User row; `role` and `sessions` are read by the table but not part of GET /user (buildSelectUser). */
export type UserRow = User & { role?: string; sessions?: string[] };

export interface UserTableProps {
  data?: UserRow[];
  onToggleStatus: (item: UserRow) => void;
  onEdit: (item: UserRow) => void;
  /** Passed as null when the current user is not an admin. */
  onDeactivateSession?: ((userId: ID, ip: string) => void) | null;
  /** Ya no se muestra numeración de filas; se conserva por compatibilidad de props. */
  startIndex?: number;
  canEdit?: boolean;
  canDelete?: boolean;
  /** Nombre de cada rol por su clave (incluye los roles creados por el administrador) */
  roleNames?: Record<string, string>;
}

/** Nombre legible de cada rol del sistema, si todavía no se cargó la lista de roles. */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  ADMINISTRATOR: 'Administrador',
  SUPERVISOR: 'Supervisor',
  VALIDATOR: 'Validador',
  SENTINEL: 'Centinela',
  CENTINELA: 'Centinela',
  SUBGERENTE: 'Subgerente'
};

/** Fecha de deshabilitación en formato local corto */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** Tabla de usuarios. Va dentro de una tarjeta que pone la pagina. */
export default function UserTable({ data = [], onToggleStatus, onEdit, onDeactivateSession, canEdit = true, canDelete = true, roleNames }: UserTableProps) {
  const showActions = canEdit || canDelete;

  if (data.length === 0) {
    return <EmptyState title="Aún no hay usuarios" description="Cuando se registren usuarios, aparecerán aquí." />;
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className={incTable}>
        <thead>
          <tr>
            <th className={incTableTh}>Nombre</th>
            <th className={incTableTh}>Rol</th>
            <th className={incTableTh}>Sesiones activas</th>
            <th className={incTableTh}>Estado</th>
            {showActions && <th className={cn(incTableTh, 'text-right')}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const isEnabled = !item.deleted_at;
            const userRole = (item.rol || item.role || '').toUpperCase();
            const roleLabel = roleNames?.[userRole] ?? ROLE_LABELS[userRole];

            return (
              <tr key={item.id} className={cn(incTableTr, !isEnabled && 'opacity-60')}>
                <td className={incTableTd}>
                  <div className="font-medium text-content">
                    {item.name} {item.lastname}
                  </div>
                  <div className="text-xs text-muted">
                    {item.username}
                    {item.email && <> · {item.email}</>}
                  </div>
                </td>

                <td className={incTableTd}>
                  {roleLabel ? <Badge tone="info">{roleLabel}</Badge> : <Badge tone="neutral">Desconocido</Badge>}
                </td>

                <td className={incTableTd}>
                  {item.sessions && item.sessions.length > 0 ? (
                    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                      {item.sessions.map((ip, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Badge tone="success">En línea</Badge>
                          <span className="font-mono text-xs text-muted">{ip}</span>
                          {onDeactivateSession && (
                            <button
                              type="button"
                              onClick={() => onDeactivateSession?.(item.id, ip)}
                              title={`Cerrar sesión en ${ip}`}
                              aria-label={`Cerrar sesión en ${ip}`}
                              className={actionBtnDanger}
                            >
                              <FiLogOut />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Badge tone="neutral">Sin sesión</Badge>
                  )}
                </td>

                <td className={incTableTd}>
                  {isEnabled ? (
                    <Badge tone="success">Activo</Badge>
                  ) : (
                    <div className="flex flex-col items-start gap-1">
                      <Badge tone="danger">Deshabilitado</Badge>
                      <span className="text-xs text-muted">Desde {formatDate(item.deleted_at)}</span>
                    </div>
                  )}
                </td>

                {showActions && (
                  <td className={cn(incTableTd, actions)}>
                    {canEdit && (
                      <button
                        type="button"
                        title="Editar usuario"
                        aria-label="Editar usuario"
                        onClick={() => onEdit(item)}
                        className={actionBtn}
                      >
                        <FiEdit2 />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        title={isEnabled ? 'Deshabilitar usuario' : 'Habilitar usuario'}
                        aria-label={isEnabled ? 'Deshabilitar usuario' : 'Habilitar usuario'}
                        onClick={() => onToggleStatus(item)}
                        className={isEnabled ? actionBtnDanger : actionBtn}
                      >
                        {isEnabled ? <FiUserX /> : <FiUserCheck />}
                      </button>
                    )}
                    {!canEdit && !canDelete && <span className="text-xs text-muted">Solo lectura</span>}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
