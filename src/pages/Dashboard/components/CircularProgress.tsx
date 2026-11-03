import React from 'react'
import { FaFrown, FaMeh, FaSmile } from 'react-icons/fa'

export default function CircularProgress({ title, percentage, subtitle }) {
  const circumference = 2 * Math.PI * 65
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Determinar el emoji según el porcentaje
  const getEmoji = () => {
    if (percentage < 50) {
      return <FaFrown className="satisfaction-icon sad" />
    } else if (percentage < 80) {
      return <FaMeh className="satisfaction-icon neutral" />
    } else {
      return <FaSmile className="satisfaction-icon happy" />
    }
  }

  // Determinar el color del progreso según el porcentaje
  const getProgressColor = () => {
    if (percentage < 50) return '#ef4444' // Rojo
    if (percentage < 80) return '#f59e0b' // Amarillo/Naranja
    return '#10b981' // Verde
  }

  return (
    <div className="circular-progress-card">
      <h3 className="circular-title">{title}</h3>
      <p className="circular-subtitle">De todos los reportes</p>

      <div className="circular-container">
        <svg className="circular-svg" viewBox="0 0 160 160">
          {/* Círculo de fondo */}
          <circle
            cx="80"
            cy="80"
            r="65"
            fill="none"
            stroke="rgba(100, 116, 139, 0.15)"
            strokeWidth="14"
          />

          {/* Círculo de progreso */}
          <circle
            cx="80"
            cy="80"
            r="65"
            fill="none"
            stroke={getProgressColor()}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 80 80)"
            className="progress-circle"
          />
        </svg>

        <div className="circular-content">
          {getEmoji()}
        </div>
      </div>

      {/* Cuadro de porcentaje */}
      <div className="satisfaction-percentage-box">
        <span className="satisfaction-percentage">{percentage}%</span>
      </div>
    </div>
  )
}