import React from 'react'
import { FaEdit, FaCheckCircle, FaBan, FaInfoCircle } from 'react-icons/fa'

export default function BodycamTable({ data = [], onToggleStatus, onEdit, startIndex = 0, canEdit = true, canDelete = true }) {
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

  // Helper para mostrar el tipo formateado
  const formatType = (type, name) => {
    // Si tiene tipo explícito válido (ingorar BODYCAM genérico), usarlo
    if (type && type !== 'BODYCAM') {
      switch (type) {
        case 'CAMERA': return 'Radio' // Mapear CAMERA a Radio si existe
        case 'RADIO': return 'Radio'
        case 'BODYCAM_SG': return 'Bodycam SG'
        case 'BODYCAM_FISCA': return 'Bodycam FISCA'
        default: return type
      }
    }
    
    // Si no tiene tipo, o es genérico, inferir del nombre
    if (!name) return 'Radio' 
    
    const upperName = name.toUpperCase()
    if (upperName.startsWith('SG')) return 'Bodycam SG'
    if (upperName.startsWith('FISCA')) return 'Bodycam FISCA'
    
    // Por defecto, todo lo demás es Radio
    return 'Radio'
  }

  return (
    <div className="table-card bodycam-table-container">
      <div className="table-scroll-container">
        <table className="inc-table bodycam-table">
          <thead>
            <tr>
              <th>#</th>
              {showActions && <th>Acciones</th>}
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={showActions ? 5 : 4} style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                  No hay bodycams registradas
                </td>
              </tr>
            )}
            {data.map((item, index) => {
              const isEnabled = !item.deleted_at
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
                  <td>{item.name}</td>
                  <td>{formatType(item.cam, item.name)}</td>
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
