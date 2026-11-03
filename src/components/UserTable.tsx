import React from 'react'
import type { ID, User } from '@/types'
import { FaEdit, FaCheckCircle, FaBan, FaInfoCircle, FaTimes, FaDesktop } from 'react-icons/fa'
import { actionBtn, actions, cn, incTable, incTableTd, incTableTh, incTableTr, tableCard, tableScroll } from '@/utils/classes'

/** Los bordes del encabezado y de las filas solo llevan ancho en un lado: se anulan los demas */
const headerCell = `${incTableTh} border-x-0 border-t-0`
const bodyRow = `${incTableTr} border-x-0 border-t-0 ease-[ease]`

/** User row; `role` and `sessions` are read by the table but not part of GET /user (buildSelectUser). */
export type UserRow = User & { role?: string; sessions?: string[] };

export interface UserTableProps {
  data?: UserRow[];
  onToggleStatus: (item: UserRow) => void;
  onEdit: (item: UserRow) => void;
  /** Passed as null when the current user is not an admin. */
  onDeactivateSession?: ((userId: ID, ip: string) => void) | null;
  startIndex?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function UserTable({ data = [], onToggleStatus, onEdit, onDeactivateSession, startIndex = 0, canEdit = true, canDelete = true }: UserTableProps) {
  const showActions = canEdit || canDelete
  // Función para formatear la fecha de deshabilitación
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  return (
    <div className={tableCard}>
      <div className={tableScroll}>
        <table className={incTable}>
          <thead>
            <tr>
              <th className={headerCell}>#</th>
              {showActions && <th className={headerCell}>Acciones</th>}
              <th className={headerCell}>Nombre</th>
              <th className={headerCell}>Apellido</th>
              <th className={headerCell}>Usuario</th>
              <th className={headerCell}>Rol</th>
              <th className={headerCell}>Sesiones Activas</th>
              <th className={headerCell}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr className={bodyRow}>
                <td colSpan={showActions ? 8 : 7} className={cn(incTableTd, 'text-center text-content! p-10!')}>
                  No hay usuarios registrados
                </td>
              </tr>
            )}
            {data.map((item, index) => {
              const isEnabled = !item.deleted_at
              // Obtener el rol (compatibilidad con ambos formatos)
              const userRole = (item.rol || item.role || '').toUpperCase()

              // Configuración de estilos por rol
              const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
                ADMIN: { label: 'Admin', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
                ADMINISTRATOR: { label: 'Admin', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
                SUPERVISOR: { label: 'Supervisor', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
                VALIDATOR: { label: 'Validador', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                SENTINEL: { label: 'Sentinel', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
                CENTINELA: { label: 'Sentinel', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
              }

              const roleInfo = roleConfig[userRole] || { label: 'Desconocido', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' }

              return (
                <tr key={item.id} className={bodyRow}>
                  <td className={cn(incTableTd, 'w-10 text-center font-bold text-muted!')}>
                    {startIndex + index + 1}
                  </td>
                  {showActions && (
                    <td className={cn(incTableTd, actions)}>
                      {canEdit && (
                        <button title="Editar" onClick={() => onEdit(item)} className={actionBtn}>
                          <FaEdit />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          title={isEnabled ? "Deshabilitar" : "Habilitar"}
                          onClick={() => onToggleStatus(item)}
                          className={actionBtn}
                        >
                          {isEnabled ? <FaBan /> : <FaCheckCircle />}
                        </button>
                      )}
                      {!canEdit && !canDelete && (
                        <span className="text-muted text-[0.85rem] italic">
                          Solo lectura
                        </span>
                      )}
                    </td>
                  )}
                  <td className={cn(incTableTd, 'font-semibold text-content!')}>{item.name}</td>
                  <td className={cn(incTableTd, 'font-semibold text-content!')}>{item.lastname}</td>
                  <td className={incTableTd}>{item.username}</td>
                  <td className={incTableTd}>
                    <span
                      className="rounded-[12px] px-3 py-1 text-[0.85rem] font-medium"
                      style={{ backgroundColor: roleInfo.bg, color: roleInfo.color }}
                    >
                      {roleInfo.label}
                    </span>
                  </td>
                  <td className={incTableTd}>
                    {item.sessions && item.sessions.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {item.sessions.map((ip, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 rounded-md bg-[rgba(34,197,94,0.1)] px-2 py-[3px] text-[0.8rem]"
                          >
                            <FaDesktop className="text-[10px] text-[#22c55e]" />
                            <span className="[font-family:monospace]">{ip}</span>
                            {onDeactivateSession && (
                              <button
                                onClick={() => onDeactivateSession?.(item.id, ip)}
                                title={`Cerrar sesión en ${ip}`}
                                className="flex cursor-pointer items-center border-none bg-transparent p-0.5 text-[#ef4444]"
                              >
                                <FaTimes className="text-[10px]" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted text-[0.85rem] italic">
                        Sin sesiones
                      </span>
                    )}
                  </td>
                  <td className={incTableTd}>
                    {isEnabled ? (
                      <span className="inline-flex items-center gap-[5px] font-semibold text-[#22c55e]">
                        <FaCheckCircle /> Habilitado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-[5px] font-semibold text-[#ef4444]">
                        <FaBan /> Deshabilitado
                        <span
                          title={`Deshabilitado el: ${formatDate(item.deleted_at)}`}
                          className="cursor-help text-muted text-[14px] ml-[3px]"
                        >
                          <FaInfoCircle />
                        </span>
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
