import React, { useState } from 'react'
import { FaEdit, FaCheckCircle, FaBan, FaInfoCircle, FaFolder, FaFileAlt, FaEye } from 'react-icons/fa'
import ModalViewContent from './ModalViewContent'

export default function LackTable({ data = [], onToggleStatus, onEdit, startIndex = 0, canEdit = true, canDelete = true }) {
  const showActions = canEdit || canDelete
  const [viewingContent, setViewingContent] = useState(null)

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

  // Función para truncar texto largo
  const truncateText = (text, maxLength = 100) => {
    if (!text) return 'Sin contenido'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="table-card">
      <div className="table-scroll-container">
        <table className="inc-table">
          <thead>
            <tr>
              <th style={{ width: '50px', minWidth: '50px' }}>#</th>
              {showActions && <th style={{ width: '120px', minWidth: '120px' }}>Acciones</th>}
              <th style={{ width: '280px', minWidth: '280px' }}>Nombre de la Falta</th>
              <th style={{ width: '280px', minWidth: '280px' }}>Asunto</th>
              <th style={{ width: '100px', minWidth: '90px', textAlign: 'center' }}>Artículo</th>
              <th style={{ width: '200px', minWidth: '180px' }}>Descripción</th>
              <th style={{ width: '320px', minWidth: '300px' }}>Contenido</th>
              <th style={{ width: '150px', minWidth: '150px' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={showActions ? 8 : 7} style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                  No hay faltas registradas
                </td>
              </tr>
            )}
            {data.map((item, index) => {
              const isEnabled = !item.deleted_at
              return (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)', width: '50px' }}>
                    {startIndex + index + 1}
                  </td>
                  {showActions && (
                    <td className="actions" style={{ width: '120px' }}>
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
                  <td style={{
                    fontWeight: '600',
                    color: 'var(--text)',
                    width: '280px',
                    minWidth: '280px',
                    maxWidth: '280px',
                    paddingRight: '20px',
                    verticalAlign: 'top'
                  }}>
                    <div
                      title={item.name}
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                        maxWidth: '260px',
                        cursor: 'help'
                      }}
                    >
                      {item.name}
                    </div>
                  </td>
                  <td style={{
                    width: '280px',
                    minWidth: '280px',
                    maxWidth: '280px',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    verticalAlign: 'top'
                  }}>
                    {item.subject ? (
                      <div style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                        maxWidth: '240px'
                      }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            maxWidth: '100%'
                          }}
                          title={item.subject.name}
                        >
                          <FaFolder style={{ fontSize: '0.7rem', flexShrink: 0 }} />
                          <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.subject.name}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <span style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        fontStyle: 'italic'
                      }}>
                        Sin asunto
                      </span>
                    )}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    width: '100px',
                    minWidth: '90px',
                    verticalAlign: 'top',
                    paddingTop: '12px'
                  }}>
                    {item.article ? (
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        backgroundColor: 'rgba(234, 179, 8, 0.1)',
                        color: '#eab308',
                        border: '1px solid rgba(234, 179, 8, 0.2)'
                      }}>
                        Art. {item.article}
                      </span>
                    ) : (
                      <span style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        fontStyle: 'italic'
                      }}>
                        -
                      </span>
                    )}
                  </td>
                  <td style={{
                    width: '200px',
                    minWidth: '180px',
                    maxWidth: '200px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    paddingRight: '15px',
                    verticalAlign: 'top'
                  }}>
                    {item.description ? (
                      <div style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.4'
                      }}>
                        {item.description}
                      </div>
                    ) : (
                      <span style={{
                        color: 'var(--text-muted)',
                        fontStyle: 'italic'
                      }}>
                        Sin descripción
                      </span>
                    )}
                  </td>
                  <td style={{
                    width: '320px',
                    minWidth: '300px',
                    maxWidth: '320px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    verticalAlign: 'top'
                  }}>
                    {item.content ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            flex: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: '1.4'
                          }}
                        >
                          <FaFileAlt style={{ marginRight: '5px', fontSize: '0.7rem', color: 'var(--primary)' }} />
                          {item.content}
                        </div>
                        <button
                          onClick={() => setViewingContent(item)}
                          title="Ver contenido completo"
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--primary)',
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'var(--primary)'
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
                            e.currentTarget.style.color = 'var(--primary)'
                          }}
                        >
                          <FaEye />
                          Ver
                        </button>
                      </div>
                    ) : (
                      <span style={{
                        color: 'var(--text-muted)',
                        fontStyle: 'italic'
                      }}>
                        Sin contenido
                      </span>
                    )}
                  </td>
                  <td style={{ width: '150px', minWidth: '150px' }}>
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

      {/* Modal de vista de contenido */}
      {viewingContent && (
        <ModalViewContent
          content={viewingContent.content}
          title={`Contenido: ${viewingContent.name}`}
          onClose={() => setViewingContent(null)}
        />
      )}
    </div>
  )
}
