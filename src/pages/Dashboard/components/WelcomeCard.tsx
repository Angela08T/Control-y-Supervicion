import React from 'react'
import { useSelector } from 'react-redux'
import loboImage from '../../../assets/lobo.png'

export default function WelcomeCard({ message }) {
  const { username } = useSelector((state) => state.auth)

  return (
    <div className="welcome-card">
      <div className="welcome-content">
        <div className="welcome-text">
          <p className="welcome-label">Bienvenido a Control y Supervisión,</p>
          <h2 className="welcome-name">{username || 'Usuario'}</h2>
          <p className="welcome-message">{message}</p>
        </div>

        <div className="welcome-illustration">
          <img
            src={loboImage}
            alt="Lobo Centinela"
            className="wolf-image"
          />
        </div>
      </div>
    </div>
  )
}