import React from 'react'

export default function SupervisionCard({ serenosEnCampo, serenosSinConexion, nivelCumplimiento }) {
  const circumference = 2 * Math.PI * 60
  const strokeDashoffset = circumference - (nivelCumplimiento / 100) * circumference
  
  return (
    <div className="supervision-card">
      <div className="supervision-header">
        <div>
          <h3 className="supervision-title">Supervisión de Campo</h3>
          <p className="supervision-subtitle">Estado actual del equipo</p>
        </div>
        <button className="supervision-menu">⋮</button>
      </div>
      
      <div className="supervision-content">
        <div className="supervision-stats">
          <div className="supervision-stat-item">
            <p className="supervision-label">En campo</p>
            <h4 className="supervision-value">{serenosEnCampo} serenos</h4>
          </div>
          
          <div className="supervision-stat-item">
            <p className="supervision-label">Sin conexión</p>
            <h4 className="supervision-value alert">{serenosSinConexion}</h4>
          </div>
        </div>
        
        <div className="supervision-chart">
          <svg viewBox="0 0 140 140" className="supervision-svg">
            <defs>
              <linearGradient id="supervisionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4a6cf7" />
                <stop offset="100%" stopColor="#8a4af3" />
              </linearGradient>
            </defs>
            
            {/* Círculo de fondo */}
            <circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke="rgba(74, 108, 247, 0.1)"
              strokeWidth="10"
            />
            
            {/* Círculo de progreso */}
            <circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke="url(#supervisionGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 70 70)"
              className="supervision-progress"
            />
          </svg>
          
          <div className="supervision-chart-content">
            <p className="supervision-chart-label">Safety</p>
            <h2 className="supervision-chart-value">{(nivelCumplimiento / 10).toFixed(1)}</h2>
            <p className="supervision-chart-sublabel">Total Score</p>
          </div>
        </div>
      </div>
    </div>
  )
}