import React from 'react'
import { FaCircle } from 'react-icons/fa'

export default function PersonalTable() {
  // Datos de ejemplo - en producción vendrían de la API
  const personal = [
    { nombre: 'Carmen Rodríguez', turno: 'Noche', activo: true, avatar: 'CR' },
    { nombre: 'José Martinez', turno: 'Mañana', activo: false, avatar: 'JM' },
    { nombre: 'Ana Torres', turno: 'Tarde', activo: true, avatar: 'AT' },
    { nombre: 'Carlos Vega', turno: 'Noche', activo: true, avatar: 'CV' },
    { nombre: 'María Sánchez', turno: 'Mañana', activo: false, avatar: 'MS' }
  ]
  
  const turnoActual = () => {
    const hora = new Date().getHours()
    if (hora >= 6 && hora < 14) return 'Mañana'
    if (hora >= 14 && hora < 22) return 'Tarde'
    return 'Noche'
  }
  
  const enTurno = turnoActual()
  
  return (
    <div className="personal-table-card">
      <div className="personal-header">
        <div>
          <h3 className="personal-title">Centinelas</h3>
          <p className="personal-subtitle">
            <FaCircle className="status-dot active" />
            {personal.filter(p => p.activo).length} en turno
          </p>
        </div>
        <button className="personal-menu">⋮</button>
      </div>
      
      <div className="personal-table-container">
        <table className="personal-table">
          <thead>
            <tr>
              <th>Personal</th>
              <th>Turno</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {personal.map((persona, index) => {
              const esSuTurno = persona.turno === enTurno
              const estado = esSuTurno ? 'En turno' : 'Fuera de turno'
              
              return (
                <tr key={index}>
                  <td>
                    <div className="personal-info">
                      <div className="personal-avatar">{persona.avatar}</div>
                      <span>{persona.nombre}</span>
                    </div>
                  </td>
                  <td>
                    <span className="personal-turno">{persona.turno}</span>
                  </td>
                  <td>
                    <span className={`personal-status ${esSuTurno ? 'active' : 'inactive'}`}>
                      <FaCircle className="status-icon" />
                      {estado}
                    </span>
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