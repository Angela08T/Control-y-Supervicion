import React from 'react'
import { FaFileAlt, FaUserSlash, FaCalendarTimes } from 'react-icons/fa'

export default function BarChart({ title, subtitle, data }) {
  const max = Math.max(...Object.values(data), 1)
  
  const iconos = {
    'Falta disciplinaria': <FaFileAlt />,
    'Abandono de servicio': <FaUserSlash />,
    'Inasistencia': <FaCalendarTimes />
  }
  
  const colores = {
    'Falta disciplinaria': '#4a6cf7',
    'Abandono de servicio': '#8a4af3',
    'Inasistencia': '#4caf50'
  }
  
  return (
    <div className="bar-chart-card">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">{title}</h3>
          <p className="chart-subtitle">{subtitle}</p>
        </div>
      </div>
      
      <div className="bar-chart-container">
        <div className="bar-chart-grid">
          {Object.entries(data).map(([asunto, cantidad]) => {
            const height = max > 0 ? (cantidad / max) * 100 : 0
            
            return (
              <div key={asunto} className="bar-chart-item">
                <div className="bar-wrapper">
                  <div 
                    className="bar"
                    style={{
                      height: `${height}%`,
                      background: `linear-gradient(180deg, ${colores[asunto]}, ${colores[asunto]}99)`
                    }}
                  >
                    <span className="bar-value">{cantidad}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Estadísticas por tipo */}
      <div className="bar-stats">
        {Object.entries(data).map(([asunto, cantidad]) => (
          <div key={asunto} className="bar-stat-item">
            <div className="bar-stat-icon" style={{ color: colores[asunto] }}>
              {iconos[asunto]}
            </div>
            <div className="bar-stat-info">
              <p className="bar-stat-label">{asunto}</p>
              <h4 className="bar-stat-value">{cantidad.toLocaleString()}</h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}