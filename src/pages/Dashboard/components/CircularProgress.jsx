import React from 'react'
import { FaCheckCircle } from 'react-icons/fa'

export default function CircularProgress({ title, percentage, subtitle }) {
  const circumference = 2 * Math.PI * 70
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
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
            r="70"
            fill="none"
            stroke="rgba(74, 108, 247, 0.1)"
            strokeWidth="12"
          />
          
          {/* Círculo de progreso */}
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 80 80)"
            className="progress-circle"
          />
          
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4a6cf7" />
              <stop offset="100%" stopColor="#8a4af3" />
            </linearGradient>
          </defs>
        </svg>
        
        <div className="circular-content">
          <FaCheckCircle className="circular-icon" />
          <h2 className="circular-percentage">{percentage}%</h2>
          <p className="circular-label">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}