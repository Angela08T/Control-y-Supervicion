import React from 'react'
import { FaFilePdf, FaTrash } from 'react-icons/fa'

function formatDate(iso){
  if(!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString()
}

export default function IncidenciasTable({ data = [], onDelete, onEdit, filtroAsunto = 'Todos' }){
  const mostrarTipoInasistencia = filtroAsunto === 'Inasistencia'
  const mostrarCamposBodycam = filtroAsunto !== 'Inasistencia'
  
  return (
    <div className="table-card">
      <table className="inc-table">
        <thead>
          <tr>
            <th>Acciones</th>
            <th>DNI</th>
            <th>Asunto</th>
            <th>Falta</th>
            {mostrarTipoInasistencia && <th>Tipo Inasistencia</th>}
            {mostrarCamposBodycam && <th>Medio</th>}
            <th>Fecha</th>
            <th>Hora</th>
            <th>Turno</th>
            <th>Cargo</th>
            <th>Reg. Lab</th>
            <th>Jurisdicción</th>
            {mostrarCamposBodycam && (
              <>
                <th>N° Bodycam</th>
                <th>Bodycam Asignada</th>
                <th>Encargado Bodycam</th>
              </>
            )}
            <th>Dirigido a</th>
            <th>Destinatario</th>
            <th>Creado En</th>
            <th>Actualizado</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={
                mostrarTipoInasistencia ? 
                (mostrarCamposBodycam ? 19 : 16) : 
                (mostrarCamposBodycam ? 18 : 15)
              } style={{textAlign:'center', color: 'var(--muted)', padding: '40px'}}>
                No hay incidencias registradas
              </td>
            </tr>
          )}
          {data.map(item => (
            <tr key={item.id}>
              <td className="actions">
                <button title="Generar PDF" onClick={()=> onEdit(item)}>
                  <FaFilePdf/>
                </button>
                <button title="Eliminar" onClick={()=> onDelete(item.id)}>
                  <FaTrash/>
                </button>
              </td>
              <td>{item.dni}</td>
              <td>{item.asunto}</td>
              <td>{item.falta}</td>
              {mostrarTipoInasistencia && <td>{item.tipoInasistencia || '-'}</td>}
              {mostrarCamposBodycam && <td>{item.medio}{item.bodycamNumber ? ` (${item.bodycamNumber})` : ''}</td>}
              <td>{item.fechaIncidente}</td>
              <td>{item.horaIncidente}</td>
              <td>{item.turno}</td>
              <td>{item.cargo || '-'}</td>
              <td>{item.regLab || '-'}</td>
              <td>{item.jurisdiccion || '-'}</td>
              {mostrarCamposBodycam && (
                <>
                  <td>{item.bodycamNumber || '-'}</td>
                  <td>{item.bodycamAsignadaA || '-'}</td>
                  <td>{item.encargadoBodycam || '-'}</td>
                </>
              )}
              <td>{item.dirigidoA || '-'}</td>
              <td>{item.destinatario || '-'}</td>
              <td>{formatDate(item.createdAt)}</td>
              <td>{formatDate(item.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}