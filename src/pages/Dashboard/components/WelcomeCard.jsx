import React from 'react'
import { useSelector } from 'react-redux'

export default function WelcomeCard({ message }) {
  const { username } = useSelector((state) => state.auth)
  
  return (
    <div className="welcome-card">
      <div className="welcome-content">
        <div className="welcome-text">
          <p className="welcome-label">Bienvenido a Control y Supervisión,</p>
          <h2 className="welcome-name">{username || 'Usuario'}</h2>
          <p className="welcome-message">{message}</p>
          <button className="welcome-btn">
            Tap to record →
          </button>
        </div>
        
        <div className="welcome-illustration">
          <svg viewBox="0 0 200 200" className="wolf-svg">
            <defs>
              <linearGradient id="wolfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#4a6cf7', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#8a4af3', stopOpacity: 0.6 }} />
              </linearGradient>
            </defs>
            
            {/* Cuerpo del lobo */}
            <ellipse cx="100" cy="120" rx="45" ry="35" fill="url(#wolfGradient)" opacity="0.7" />
            
            {/* Cabeza */}
            <ellipse cx="100" cy="80" rx="35" ry="30" fill="url(#wolfGradient)" opacity="0.8" />
            
            {/* Orejas */}
            <path d="M 75 65 L 70 45 L 80 55 Z" fill="url(#wolfGradient)" opacity="0.9" />
            <path d="M 125 65 L 130 45 L 120 55 Z" fill="url(#wolfGradient)" opacity="0.9" />
            
            {/* Hocico */}
            <ellipse cx="100" cy="90" rx="20" ry="15" fill="url(#wolfGradient)" opacity="0.9" />
            
            {/* Ojos */}
            <circle cx="90" cy="75" r="3" fill="#4a6cf7" opacity="0.9" />
            <circle cx="110" cy="75" r="3" fill="#4a6cf7" opacity="0.9" />
            
            {/* Patas delanteras */}
            <rect x="80" y="135" width="10" height="25" rx="5" fill="url(#wolfGradient)" opacity="0.7" />
            <rect x="110" y="135" width="10" height="25" rx="5" fill="url(#wolfGradient)" opacity="0.7" />
            
            {/* Cola */}
            <path d="M 140 115 Q 160 110 165 130" stroke="url(#wolfGradient)" strokeWidth="12" fill="none" opacity="0.6" strokeLinecap="round" />
            
            {/* Detalles brillantes */}
            <circle cx="95" cy="70" r="1" fill="#fff" opacity="0.8" />
            <circle cx="115" cy="70" r="1" fill="#fff" opacity="0.8" />
          </svg>
        </div>
      </div>
    </div>
  )
}