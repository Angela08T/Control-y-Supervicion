import React from 'react'
import { FaFilePdf, FaTrash, FaPaperPlane, FaCheck, FaTimes, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'

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

              return (
                <tr key={item.id}>
                  <td style={{textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)', width: '40px'}}>
                    {startIndex + index + 1}
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
                      <button title="Eliminar" onClick={()=> onDelete(item.id)}>
                        <FaTrash/>
                      </button>
                    )}
                  </td>
                  <td><EstadoIncidencia status={item.status} /></td>
                  <td>{item.dni}</td>
                  <td>{item.asunto}</td>
                  <td>{item.falta}</td>
                  <td>{item.medio}{item.bodycamNumber ? ` (${item.bodycamNumber})` : ''}</td>
                  <td>{item.fechaIncidente}</td>
                  <td>{item.horaIncidente}</td>
                  <td>{item.turno}</td>
                  <td>{item.cargo || '-'}</td>
                  <td>{item.regLab || '-'}</td>
                  <td>{item.jurisdiccion || '-'}</td>
                  <td>{item.bodycamNumber || '-'}</td>
                  <td>{item.bodycamAsignadaA || '-'}</td>
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