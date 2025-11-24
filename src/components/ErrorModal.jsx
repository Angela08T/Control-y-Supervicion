import React from 'react'
import { FaTimesCircle } from 'react-icons/fa'

export default function ErrorModal({ show, message, onClose }) {
  if (!show) return null

  const handleAccept = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="notification-modal-backdrop" onClick={handleAccept}>
      <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notification-modal-icon error">
          <FaTimesCircle />
        </div>

        <h2 className="notification-modal-title">Error</h2>

        <p className="notification-modal-message">
          {message || 'Ha ocurrido un error'}
        </p>

        <button
          className="notification-modal-button"
          onClick={handleAccept}
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}
