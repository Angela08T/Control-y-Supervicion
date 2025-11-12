import React from 'react'
import { FaEdit, FaCheckCircle, FaBan, FaInfoCircle } from 'react-icons/fa'

export default function UserTable({ data = [], onToggleStatus, onEdit, startIndex = 0, canEdit = true, canDelete = true }) {
  const showActions = canEdit || canDelete
  // Función para formatear la fecha de deshabilitación
  const formatDate = (dateString) => {
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
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={showActions ? 7 : 6} style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                  No hay usuarios registrados
                </td>
              </tr>
            )}
            {data.map((item, index) => {
              const isEnabled = !item.deleted_at
              // Obtener el rol (compatibilidad con ambos formatos)
              const userRole = (item.rol || item.role || '').toUpperCase()

              // Configuración de estilos por rol
              const roleConfig = {
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
