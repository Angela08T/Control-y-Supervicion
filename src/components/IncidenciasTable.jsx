import React from 'react'
import { FaFilePdf, FaTrash } from 'react-icons/fa'

function formatDate(iso){
  if(!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString()
}

export default function IncidenciasTable({ data = [], onDelete, onEdit, startIndex = 0, canDelete = true }){
  return (
    <div className="table-card">
      <div className="table-scroll-container">
        <table className="inc-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Acciones</th>
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
                <td colSpan={16} style={{textAlign:'center', color: 'var(--muted)', padding: '40px'}}>
                  No hay incidencias registradas
                </td>
              </tr>
            )}
            {data.map((item, index) => (
              <tr key={item.id}>
                <td style={{textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)', width: '40px'}}>
                  {startIndex + index + 1}
                </td>
                <td className="actions">
                  <button title="Ver/Generar PDF" onClick={()=> onEdit(item)}>
                    <FaFilePdf/>
                  </button>
                  {canDelete && (
                    <button title="Eliminar" onClick={()=> onDelete(item.id)}>
                      <FaTrash/>
                    </button>
                  )}
                </td>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}