import React from 'react'
import type { ID, User } from '@/types'
import { FaEdit, FaCheckCircle, FaBan, FaInfoCircle, FaTimes, FaDesktop } from 'react-icons/fa'

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
    <div className="table-card">
      <div className="table-scroll-container">
        <table className="inc-table">
          <thead>
            <tr>
              <th>#</th>
              {showActions && <th>Acciones</th>}
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Sesiones Activas</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={showActions ? 8 : 7} style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
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
                <tr key={item.id}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)', width: '40px' }}>
                    {startIndex + index + 1}
                  </td>
                  {showActions && (
                    <td className="actions">
                      {canEdit && (
                        <button title="Editar" onClick={() => onEdit(item)}>
                          <FaEdit />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          title={isEnabled ? "Deshabilitar" : "Habilitar"}
                          onClick={() => onToggleStatus(item)}
                          style={{
                            color: isEnabled ? '#ef4444' : '#22c55e'
                          }}
                        >
                          {isEnabled ? <FaBan /> : <FaCheckCircle />}
                        </button>
                      )}
                      {!canEdit && !canDelete && (
                        <span style={{
                          color: 'var(--text-muted)',
                          fontSize: '0.85rem',
                          fontStyle: 'italic'
                        }}>
                          Solo lectura
                        </span>
                      )}
                    </td>
                  )}
                  <td style={{ fontWeight: '600', color: 'var(--text)' }}>{item.name}</td>
                  <td style={{ fontWeight: '600', color: 'var(--text)' }}>{item.lastname}</td>
                  <td>{item.username}</td>
                  <td>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      backgroundColor: roleInfo.bg,
                      color: roleInfo.color
                    }}>
                      {roleInfo.label}
                    </span>
                  </td>
                  <td>
                    {item.sessions && item.sessions.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {item.sessions.map((ip, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 8px',
                              backgroundColor: 'rgba(34, 197, 94, 0.1)',
                              borderRadius: '6px',
                              fontSize: '0.8rem'
                            }}
                          >
                            <FaDesktop style={{ color: '#22c55e', fontSize: '10px' }} />
                            <span style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{ip}</span>
                            {onDeactivateSession && (
                              <button
                                onClick={() => onDeactivateSession?.(item.id, ip)}
                                title={`Cerrar sesión en ${ip}`}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '2px',
                                  cursor: 'pointer',
                                  color: '#ef4444',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <FaTimes style={{ fontSize: '10px' }} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                        Sin sesiones
                      </span>
                    )}
                  </td>
                  <td>
                    {isEnabled ? (
                      <span style={{
                        color: '#22c55e',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <FaCheckCircle /> Habilitado
                      </span>
                    ) : (
                      <span style={{
                        color: '#ef4444',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <FaBan /> Deshabilitado
                        <span
                          title={`Deshabilitado el: ${formatDate(item.deleted_at)}`}
                          style={{
                            cursor: 'help',
                            color: 'var(--text-muted)',
                            fontSize: '14px',
                            marginLeft: '3px'
                          }}
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
