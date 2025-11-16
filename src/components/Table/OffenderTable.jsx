import React from 'react'
import { FaEdit, FaCheckCircle, FaBan, FaInfoCircle } from 'react-icons/fa'

export default function OffenderTable({ data = [], onToggleStatus, onEdit, startIndex = 0, canEdit = true, canDelete = true }) {
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

  // Configuración de colores para turnos
  const shiftConfig = {
    'Mañana': { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    'Tarde': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    'Noche': { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' }
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
              <th>DNI</th>
              <th>Cargo</th>
              <th>Régimen</th>
              <th>Turno</th>
              <th>Subgerencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={showActions ? 10 : 9} style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                  No hay infractores registrados
                </td>
              </tr>
            )}
            {data.map((item, index) => {
              const isEnabled = !item.deleted_at
              const shiftStyle = shiftConfig[item.shift] || { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' }

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
                  <td>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366f1',
                      fontFamily: 'monospace'
                    }}>
                      {item.dni}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6'
                    }}>
                      {item.job || 'Sin cargo'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)'
                    }}>
                      {item.regime || '-'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      backgroundColor: shiftStyle.bg,
                      color: shiftStyle.color
                    }}>
                      {item.shift || '-'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {item.subgerencia || '-'}
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
