import React from 'react'
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa'

/**
 * Modal de alerta personalizado (reemplazo de alert())
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje del modal
 * @param {string} type - Tipo: 'success' | 'error' | 'info'
 * @param {function} onClose - Función a ejecutar al cerrar
 */
export default function AlertModal({
  isOpen,
  title,
  message,
  type = 'success',
  onClose
}) {
  if (!isOpen) return null

  const styles = {
    success: {
      bg: 'rgba(34, 197, 94, 0.1)',
      border: 'rgba(34, 197, 94, 0.5)',
      color: '#22c55e',
      icon: <FaCheckCircle size={48} />
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.5)',
      color: '#ef4444',
      icon: <FaExclamationCircle size={48} />
    },
    info: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.5)',
      color: '#3b82f6',
      icon: <FaInfoCircle size={48} />
    }
  }

  const style = styles[type] || styles.info

  // Convertir saltos de línea en elementos <br>
  const formattedMessage = message.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < message.split('\n').length - 1 && <br />}
    </React.Fragment>
  ))

  return (
    <div
      className="modal-backdrop"
      style={{
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease-in-out'
      }}
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '450px',
          animation: 'slideDown 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con icono */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 24px 16px',
          borderBottom: `2px solid ${style.border}`
        }}>
          <div style={{
            backgroundColor: style.bg,
            border: `2px solid ${style.border}`,
            borderRadius: '50%',
            padding: '16px',
            marginBottom: '16px',
            color: style.color
          }}>
            {style.icon}
          </div>
          <h3 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--text)',
            textAlign: 'center'
          }}>
            {title}
          </h3>
        </div>

        {/* Body */}
        <div style={{
          padding: '24px',
          fontSize: '0.95rem',
          lineHeight: '1.6',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          whiteSpace: 'pre-line'
        }}>
          {formattedMessage}
        </div>

        {/* Footer con botón */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '16px 24px 24px'
        }}>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{
              minWidth: '120px',
              padding: '10px 20px',
              backgroundColor: style.color
            }}
          >
            Aceptar
          </button>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
