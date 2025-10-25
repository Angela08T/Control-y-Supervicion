import React from 'react'
import { FaSun, FaCloudSun, FaMoon } from 'react-icons/fa'

export default function TurnoList({ data }) {
  const turnos = [
    {
      nombre: 'Mañana',
      icon: <FaSun />,
      color: '#4a6cf7',
      cantidad: data['Mañana'] || 0,
      descripcion: 'Incidencias registradas'
    },
    {
      nombre: 'Tarde',
      icon: <FaCloudSun />,
      color: '#8a4af3',
      cantidad: data['Tarde'] || 0,
      descripcion: 'Incidencias registradas'
    },
    {
      nombre: 'Noche',
      icon: <FaMoon />,
      color: '#4caf50',
      cantidad: data['Noche'] || 0,
      descripcion: 'Incidencias registradas'
    }
  ]
  
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  
  return (
    <div className="turno-list-card">
      <div className="turno-header">
        <div>
          <h3 className="turno-title">Incidencias por Turno</h3>
          <p className="turno-subtitle">
            <span className="turno-indicator">+30%</span> este mes
          </p>
        </div>
      </div>
      
      <div className="turno-list">
        {turnos.map((turno, index) => {
          const porcentaje = total > 0 ? Math.round((turno.cantidad / total) * 100) : 0
          
          return (
            <div key={index} className="turno-item">
              <div className="turno-icon-container" style={{ backgroundColor: `${turno.color}20` }}>
                <div className="turno-icon" style={{ color: turno.color }}>
                  {turno.icon}
                </div>
              </div>
              
              <div className="turno-content">
                <div className="turno-info">
                  <h4 className="turno-name">{turno.nombre}</h4>
                  <p className="turno-desc">{turno.descripcion}</p>
                </div>
                
                <div className="turno-stats">
                  <h3 className="turno-cantidad">{turno.cantidad}</h3>
                  <span className="turno-porcentaje">{porcentaje}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}