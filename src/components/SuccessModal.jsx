import React from 'react'
import { FaCheckCircle } from 'react-icons/fa'

export default function SuccessModal({ show, message, onClose }) {
  if (!show) return null

  const handleAccept = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="notification-modal-backdrop" onClick={handleAccept}>
      <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notification-modal-icon success">
          <FaCheckCircle />
        </div>

        <h2 className="notification-modal-title">Éxito</h2>

        <p className="notification-modal-message">
          {message || 'Operación realizada correctamente'}
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
