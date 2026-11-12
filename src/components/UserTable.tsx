import React, { useState } from 'react'
import { FiCheckSquare, FiChevronDown, FiEdit2, FiEye, FiLogOut, FiMonitor, FiRadio, FiShield, FiUser, FiUserCheck, FiUserX } from 'react-icons/fi'
import { EmptyState } from '@/components/UI/EmptyState'
import type { ID, User } from '@/types'
import { actionBtn, actionBtnDanger, cn } from '@/utils/classes'
import { colorAvatar, iniciales } from '@/utils/incidenciaFormat'

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

/** Icono y color de cada rol (colores del logo); los roles creados por el administrador usan el rosa */
export const ROLE_STYLE: Record<string, { icon: React.ReactNode; color: string; orden: number }> = {
  ADMINISTRATOR: { icon: <FiShield />, color: '#1e3a8a', orden: 0 },
  ADMIN: { icon: <FiShield />, color: '#1e3a8a', orden: 0 },
  SUPERVISOR: { icon: <FiEye />, color: '#31a3b5', orden: 1 },
  VALIDATOR: { icon: <FiCheckSquare />, color: '#6f9a14', orden: 2 },
  SENTINEL: { icon: <FiRadio />, color: '#c97d00', orden: 3 },
  CENTINELA: { icon: <FiRadio />, color: '#c97d00', orden: 3 },
}
const ESTILO_OTRO = { icon: <FiUser />, color: '#d20b80', orden: 9 }

export const claveRol = (u: UserRow) => (u.rol || u.role || '').toUpperCase()
export const estiloRol = (clave: string) => ROLE_STYLE[clave] ?? ESTILO_OTRO
export const nombreRol = (clave: string, roleNames?: Record<string, string>) => roleNames?.[clave] ?? ROLE_LABELS[clave] ?? 'Sin rol'

/** Fecha de deshabilitación en formato local corto */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Avatar con punto verde cuando el usuario tiene una sesion abierta */
export function UserAvatar({ user, size = 'md' }: { user: UserRow; size?: 'sm' | 'md' }) {
  const enLinea = (user.sessions?.length ?? 0) > 0 && !user.deleted_at
  const nombre = `${user.name ?? ''} ${user.lastname ?? ''}`.trim() || user.username
  return (
    <span className="relative shrink-0">
      <span
        className={cn(
          'flex items-center justify-center font-bold text-white',
          size === 'sm' ? 'size-8 rounded-lg text-[11px]' : 'size-10 rounded-xl text-sm',
          user.deleted_at && 'opacity-55 grayscale'
        )}
        style={{ background: colorAvatar(String(user.id)) }}
        aria-hidden
      >
        {iniciales(nombre)}
      </span>
      {enLinea && (
        <span className="absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full bg-surface" title="En línea">
          <span className="absolute size-2.5 animate-ping rounded-full bg-success opacity-50 [animation-duration:2.2s]" />
          <span className="relative size-2.5 rounded-full bg-success" />
        </span>
      )}
    </span>
  )
}

/**
 * Usuarios agrupados por rol. Cada grupo se puede plegar; cada fila muestra el acceso de la persona:
 * usuario, correo, sesiones abiertas (con su IP) y estado.
 */
export default function UserTable({ data = [], onToggleStatus, onEdit, onDeactivateSession, canEdit = true, canDelete = true, roleNames }: UserTableProps) {
  const [plegados, setPlegados] = useState<Set<string>>(new Set())

  if (data.length === 0) {
    return <EmptyState title="Aún no hay usuarios" description="Cuando se registren usuarios, aparecerán aquí." />
  }

  // Grupos por rol, en el orden del sistema (admin, supervisor, validador, centinela, otros)
  const grupos = new Map<string, UserRow[]>()
  data.forEach(u => {
    const k = claveRol(u)
    grupos.set(k, [...(grupos.get(k) ?? []), u])
  })
  const ordenados = [...grupos.entries()].sort((a, b) => estiloRol(a[0]).orden - estiloRol(b[0]).orden || a[0].localeCompare(b[0]))

  const alternar = (k: string) =>
    setPlegados(prev => {
      const n = new Set(prev)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      {ordenados.map(([clave, usuarios]) => {
        const estilo = estiloRol(clave)
        const plegado = plegados.has(clave)
        const enLinea = usuarios.filter(u => (u.sessions?.length ?? 0) > 0 && !u.deleted_at).length
        return (
          <section key={clave} aria-label={nombreRol(clave, roleNames)}>
            {/* Cabecera del grupo: queda pegada arriba al desplazar */}
            <button
              type="button"
              onClick={() => alternar(clave)}
              aria-expanded={!plegado}
              className="sticky top-0 z-10 flex w-full cursor-pointer items-center gap-3 border-x-0 border-t-0 border-b border-line bg-subtle/95 px-5 py-2.5 text-left backdrop-blur-sm max-sm:px-3"
            >
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-sm text-white"
                style={{ background: estilo.color }}
                aria-hidden
              >
                {estilo.icon}
              </span>
              <span className="text-[13px] font-bold text-content">{nombreRol(clave, roleNames)}</span>
              <span className="rounded-full bg-surface px-2 py-px text-[11px] font-bold text-content-2 tabular-nums ring-1 ring-line">{usuarios.length}</span>
              {enLinea > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-lime-ink">
                  <span className="size-1.5 rounded-full bg-success" aria-hidden /> {enLinea} en línea
                </span>
              )}
              <FiChevronDown className={cn('ml-auto text-muted transition-transform duration-200', plegado && '-rotate-90')} aria-hidden />
            </button>

            {!plegado && (
              <ul className="m-0 list-none p-0">
                {usuarios.map(item => {
                  const isEnabled = !item.deleted_at
                  const sesiones = item.sessions ?? []
                  const nombre = `${item.name ?? ''} ${item.lastname ?? ''}`.trim()
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        'grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-line px-5 py-3 transition-colors hover:bg-card-hover',
                        'max-lg:grid-cols-[minmax(0,1fr)_auto_auto] max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:px-3',
                        !isEnabled && 'bg-subtle/50'
                      )}
                    >
                      {/* Persona */}
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar user={item} />
                        <div className={cn('min-w-0', !isEnabled && 'opacity-60')}>
                          <p className="m-0 truncate text-[14px] font-semibold text-content">{nombre || item.username}</p>
                          <p className="m-0 truncate text-xs text-muted">
                            <span className="font-mono">@{item.username}</span>
                            {item.email && <span className="max-lg:hidden"> · {item.email}</span>}
                          </p>
                        </div>
                      </div>

                      {/* Sesiones: un chip por equipo conectado */}
                      <div className="min-w-0 max-lg:hidden">
                        {sesiones.length > 0 && isEnabled ? (
                          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                            {sesiones.map((ip, idx) => (
                              <li key={idx} className="inline-flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/8 py-0.5 pr-0.5 pl-2 text-xs text-content-2">
                                <FiMonitor className="text-lime-ink" aria-hidden />
                                <span className="font-mono">{ip}</span>
                                {onDeactivateSession ? (
                                  <button
                                    type="button"
                                    onClick={() => onDeactivateSession(item.id, ip)}
                                    title={`Cerrar sesión en ${ip}`}
                                    aria-label={`Cerrar la sesión de ${nombre || item.username} en ${ip}`}
                                    className="flex size-6 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                                  >
                                    <FiLogOut aria-hidden />
                                  </button>
                                ) : (
                                  <span className="w-1" />
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-muted">{isEnabled ? 'Sin sesión abierta' : '—'}</span>
                        )}
                      </div>

                      {/* Estado */}
                      <div className="max-sm:hidden">
                        {isEnabled ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-semibold text-lime-ink">
                            <span className="size-1.5 rounded-full bg-success" aria-hidden /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex flex-col items-start">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-red-ink">
                              <span className="size-1.5 rounded-full bg-danger" aria-hidden /> Deshabilitado
                            </span>
                            <span className="mt-0.5 pl-2.5 text-[11px] text-muted">desde {formatDate(item.deleted_at)}</span>
                          </span>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center justify-end gap-0.5">
                        {canEdit && (
                          <button type="button" title="Editar usuario" aria-label={`Editar a ${nombre || item.username}`} onClick={() => onEdit(item)} className={actionBtn}>
                            <FiEdit2 aria-hidden />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            title={isEnabled ? 'Deshabilitar usuario' : 'Habilitar usuario'}
                            aria-label={`${isEnabled ? 'Deshabilitar' : 'Habilitar'} a ${nombre || item.username}`}
                            onClick={() => onToggleStatus(item)}
                            className={isEnabled ? actionBtnDanger : cn(actionBtn, 'text-lime-ink hover:bg-success/12 hover:text-lime-ink')}
                          >
                            {isEnabled ? <FiUserX aria-hidden /> : <FiUserCheck aria-hidden />}
                          </button>
                        )}
                        {!canEdit && !canDelete && <span className="text-xs text-muted">Solo lectura</span>}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
