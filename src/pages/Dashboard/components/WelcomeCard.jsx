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
          <img 
            src="/src/assets/lobo.png"
            alt="Lobo Centinela" 
            className="wolf-image"
          />
        </div>
      </div>
    </div>
  )
}