import React from 'react'
import { FaFilePdf, FaBan, FaPaperPlane, FaCheck, FaTimes, FaClock, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa'

// Función para formatear fecha de eliminación
function formatDeletedDate(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  return `Eliminado: ${d.toLocaleDateString('es-PE')} ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
}

function formatDate(iso){
  if(!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString()
}

// Componente para mostrar el estado de la incidencia
function EstadoIncidencia({ status }) {
  const estados = {
    pending: { label: 'Pendiente', icon: <FaClock />, color: '#f59e0b' },
    approved: { label: 'Aprobado', icon: <FaCheckCircle />, color: '#22c55e' },
    rejected: { label: 'Rechazado', icon: <FaTimesCircle />, color: '#ef4444' },
    draft: { label: 'Borrador', icon: <FaClock />, color: '#94a3b8' }
  }

  // Convertir a minúsculas por si el backend envía en mayúsculas
  const statusLower = status ? status.toLowerCase() : 'draft'
  const estado = estados[statusLower] || estados.draft

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '0.85rem',
      fontWeight: '600',
      backgroundColor: `${estado.color}20`,
      color: estado.color
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
}){
  // DEBUG: Ver si hay reportes de inasistencias
  React.useEffect(() => {
    const absenceReports = data.filter(item => item.isAbsenceReport)
    if (absenceReports.length > 0) {
      console.log('=== REPORTES DE INASISTENCIAS ENCONTRADOS ===')
      console.log('Total:', absenceReports.length)
      console.log('Datos:', absenceReports)
      console.log('===========================================')
    }
  }, [data])

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
              <th>Cargo</th>
              <th>Reg. Lab</th>
              <th>Jurisdicción</th>
              <th>N° Bodycam</th>
              <th>Bodycam Asignada</th>
              <th>Dirigido a</th>
              <th>Destinatario</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={17} style={{textAlign:'center', color: 'var(--muted)', padding: '40px'}}>
                  No hay incidencias registradas
                </td>
              </tr>
            )}
            {data.map((item, index) => {
              const hasImages = item.evidences && item.evidences.length > 0
              const itemStatus = item.status ? item.status.toLowerCase() : 'draft'
              const canSendToValidator = canSend && hasImages && (itemStatus === 'draft')
              const canValidateReport = canValidate && itemStatus === 'pending'
              const isAbsence = item.isAbsenceReport

              // Formatear rango de fechas para reportes de inasistencias
              const formatAbsenceDates = () => {
                if (!item.absenceStart || !item.absenceEnd) return '-'
                const start = new Date(item.absenceStart).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                const end = new Date(item.absenceEnd).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                return `${start} - ${end}`
              }

              return (
                <tr key={item.id} style={item.deletedAt ? { backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}>
                  <td style={{textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)', width: '40px'}}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {startIndex + index + 1}
                      {item.deletedAt && (
                        <span
                          title={formatDeletedDate(item.deletedAt)}
                          style={{
                            color: '#ef4444',
                            cursor: 'help',
                            display: 'inline-flex'
                          }}
                        >
                          <FaInfoCircle size={12} />
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="actions">
                    <button title="Ver/Generar PDF" onClick={()=> onEdit(item)}>
                      <FaFilePdf/>
                    </button>
                    {canSendToValidator && (
                      <button
                        title="Enviar a validador"
                        onClick={()=> onSend(item.id)}
                        style={{ color: '#3b82f6' }}
                      >
                        <FaPaperPlane/>
                      </button>
                    )}
                    {canValidateReport && (
                      <>
                        <button
                          title="Aprobar"
                          onClick={()=> onApprove(item.id)}
                          style={{ color: '#22c55e' }}
                        >
                          <FaCheck/>
                        </button>
                        <button
                          title="Rechazar"
                          onClick={()=> onReject(item.id)}
                          style={{ color: '#ef4444' }}
                        >
                          <FaTimes/>
                        </button>
                      </>
                    )}
                    {canDelete && (
                      <button
                        title="Deshabilitar/Eliminar"
                        onClick={()=> onDelete(item.id, item.status)}
                        style={{ color: '#ef4444' }}
                      >
                        <FaBan/>
                      </button>
                    )}
                  </td>
                  <td><EstadoIncidencia status={item.status} /></td>
                  <td>{isAbsence ? '-' : item.dni}</td>
                  <td>{item.asunto}</td>
                  <td>{item.falta}</td>
                  <td>{isAbsence ? 'Reporte' : (item.medio + (item.bodycamNumber ? ` (${item.bodycamNumber})` : ''))}</td>
                  <td>{isAbsence ? formatAbsenceDates() : item.fechaIncidente}</td>
                  <td>{isAbsence ? (item.absenceMode === 'JUSTIFIED' ? 'Justificada' : 'Injustificada') : item.horaIncidente}</td>
                  <td>{isAbsence ? '-' : item.turno}</td>
                  <td>{item.cargo || '-'}</td>
                  <td>{item.regLab || '-'}</td>
                  <td>{item.jurisdiccion || '-'}</td>
                  <td>{isAbsence ? '-' : (item.bodycamNumber || '-')}</td>
                  <td>{isAbsence ? '-' : (item.bodycamAsignadaA || '-')}</td>
                  <td>{item.dirigidoA || '-'}</td>
                  <td>{item.destinatario || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}