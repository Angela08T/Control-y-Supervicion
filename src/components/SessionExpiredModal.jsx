import React from 'react'
import { FaTimesCircle } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

export default function SessionExpiredModal({ show, onAccept }) {
  const navigate = useNavigate()

  if (!show) return null

  const handleAccept = () => {
    if (onAccept) {
      onAccept()
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="session-expired-backdrop">
      <div className="session-expired-modal">
        <div className="session-expired-icon">
          <FaTimesCircle />
        </div>

        <h2 className="session-expired-title">Error de autenticación</h2>

        <p className="session-expired-message">
          Su sesión ha expirado. Por favor, inicie sesión nuevamente
        </p>

        <button
          className="session-expired-button"
          onClick={handleAccept}
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}
