import React from 'react'
import { FaFilePdf, FaBan, FaPaperPlane, FaCheck, FaTimes, FaClock, FaCheckCircle, FaTimesCircle, FaUndo } from 'react-icons/fa'
import { MdBlock } from 'react-icons/md'

function formatDeletedDate(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  return `Deshabilitado el ${d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })} a las ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
}

function formatAbsenceDates(item) {
  if (!item.absenceStart || !item.absenceEnd) return '-'
  const fmt = (d) => new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${fmt(item.absenceStart)} - ${fmt(item.absenceEnd)}`
}

function EstadoIncidencia({ status, disabled }) {
  if (disabled) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '4px 10px', borderRadius: '12px', fontSize: '0.82rem',
        fontWeight: '700', backgroundColor: 'rgba(239,68,68,0.12)',
        color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)'
      }}>
        <MdBlock size={13} /> Deshabilitado
      </span>
    )
  }

  const estados = {
    pending:  { label: 'Pendiente',  icon: <FaClock />,       color: '#f59e0b' },
    approved: { label: 'Aprobado',   icon: <FaCheckCircle />, color: '#22c55e' },
    rejected: { label: 'Rechazado',  icon: <FaTimesCircle />, color: '#ef4444' },
    draft:    { label: 'Borrador',   icon: <FaClock />,       color: '#94a3b8' },
  }
  const statusLower = status ? status.toLowerCase() : 'draft'
  const estado = estados[statusLower] || estados.draft

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem',
      fontWeight: '600', backgroundColor: `${estado.color}20`, color: estado.color
    }}>
      {estado.icon} {estado.label}
    </span>
  )
}

export default function IncidenciasTable({
  data = [],
  onDelete,
  onEdit,
  onSend,
  onApprove,
  onReject,
  startIndex = 0,
  canDelete = true,
  canSend = false,
  canValidate = false
}) {
  return (
    <div className="table-card">
      <div className="table-scroll-container">
        <table className="inc-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Acciones</th>
              <th>Estado</th>
              <th>DNI</th>
              <th>Asunto</th>
              <th>Falta</th>
              <th>Medio</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Turno</th>
              <th>Subgerencia</th>
              <th>Cargo</th>
              <th>Reg. Lab</th>
              <th>Jurisdicción</th>
              <th>Bodycam Asignada</th>
              <th>Dirigido a</th>
              <th>Destinatario</th>
              <th>Registrado Por</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={18} style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                  No hay incidencias registradas
                </td>
              </tr>
            )}
            {data.map((item, index) => {
              const isDisabled = !!item.deletedAt
              const isAbsence  = item.isAbsenceReport
              const itemStatus = item.status ? item.status.toLowerCase() : 'draft'
              const canSendToValidator  = !isDisabled && canSend     && item.evidences?.length > 0 && itemStatus === 'draft'
              const canValidateReport   = !isDisabled && canValidate && itemStatus === 'pending'

              // Estilos de fila según estado habilitado/deshabilitado
              const rowStyle = isDisabled ? {
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                opacity: 0.72,
              } : {}

              // Estilo de texto en celdas de una fila deshabilitada
              const cellTextStyle = isDisabled ? {
                textDecoration: 'line-through',
                color: 'var(--text-muted)',
              } : {}

              return (
                <tr key={item.id} style={rowStyle}>

                  {/* Número */}
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)', width: '40px' }}>
                    {startIndex + index + 1}
                  </td>

                  {/* Acciones */}
                  <td className="actions">
                    <button title="Ver/Generar PDF" onClick={() => onEdit(item)}>
                      <FaFilePdf />
                    </button>

                    {canSendToValidator && (
                      <button title="Enviar a validador" onClick={() => onSend(item.id)} style={{ color: '#3b82f6' }}>
                        <FaPaperPlane />
                      </button>
                    )}

                    {canValidateReport && (
                      <>
                        <button title="Aprobar" onClick={() => onApprove(item.id)} style={{ color: '#22c55e' }}>
                          <FaCheck />
                        </button>
                        <button title="Rechazar" onClick={() => onReject(item.id)} style={{ color: '#ef4444' }}>
                          <FaTimes />
                        </button>
                      </>
                    )}

                    {canDelete && (
                      isDisabled ? (
                        <button
                          title="Habilitar incidencia"
                          onClick={() => onDelete(item.id, item.status)}
                          style={{ color: '#22c55e' }}
                        >
                          <FaUndo />
                        </button>
                      ) : (
                        <button
                          title="Deshabilitar incidencia"
                          onClick={() => onDelete(item.id, item.status)}
                          style={{ color: '#ef4444' }}
                        >
                          <FaBan />
                        </button>
                      )
                    )}
                  </td>

                  {/* Estado — muestra "Deshabilitado" si está eliminada */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      <EstadoIncidencia status={item.status} disabled={isDisabled} />
                      {isDisabled && (
                        <span title={formatDeletedDate(item.deletedAt)} style={{
                          fontSize: '0.7rem', color: '#94a3b8', cursor: 'help', whiteSpace: 'nowrap'
                        }}>
                          {formatDeletedDate(item.deletedAt)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Resto de celdas con tachado si está deshabilitada */}
                  <td style={cellTextStyle}>{isAbsence ? '-' : (item.dni || '-')}</td>
                  <td style={cellTextStyle}>{item.asunto}</td>
                  <td style={cellTextStyle}>{item.falta}</td>
                  <td style={cellTextStyle}>
                    {isAbsence ? 'Reporte' : (item.medio + (item.bodycamNumber ? ` (${item.bodycamNumber})` : ''))}
                  </td>
                  <td style={cellTextStyle}>{isAbsence ? formatAbsenceDates(item) : item.fechaIncidente}</td>
                  <td style={cellTextStyle}>
                    {isAbsence ? (item.absenceMode === 'JUSTIFIED' ? 'Justificada' : 'Injustificada') : item.horaIncidente}
                  </td>
                  <td style={cellTextStyle}>{isAbsence ? '-' : item.turno}</td>
                  <td style={cellTextStyle}>{item.subgerencia || '-'}</td>
                  <td style={cellTextStyle}>{item.cargo || '-'}</td>
                  <td style={cellTextStyle}>{item.regLab || '-'}</td>
                  <td style={cellTextStyle}>{item.jurisdiccion || '-'}</td>
                  <td style={cellTextStyle}>{isAbsence ? '-' : (item.bodycamAsignadaA || '-')}</td>
                  <td style={cellTextStyle}>{item.dirigidoA || '-'}</td>
                  <td style={cellTextStyle}>{item.destinatario || '-'}</td>
                  <td style={cellTextStyle}>{item.registradoPor || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
