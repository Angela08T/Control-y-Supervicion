import React from 'react'
import { FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa'

/**
 * Modal de confirmación personalizado
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje del modal (puede incluir \n para saltos de línea)
 * @param {string} type - Tipo de modal: 'warning' | 'danger' | 'info'
 * @param {function} onConfirm - Función a ejecutar al confirmar
 * @param {function} onCancel - Función a ejecutar al cancelar
 * @param {string} confirmText - Texto del botón de confirmación (default: 'Aceptar')
 * @param {string} cancelText - Texto del botón de cancelación (default: 'Cancelar')
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  type = 'warning',
  onConfirm,
  onCancel,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar'
}) {
  if (!isOpen) return null

  const colors = {
    warning: {
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.5)',
      color: '#f59e0b',
      icon: <FaExclamationTriangle size={48} />
    },
    danger: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.5)',
      color: '#ef4444',
      icon: <FaExclamationTriangle size={48} />
    },
    info: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.5)',
      color: '#3b82f6',
      icon: <FaInfoCircle size={48} />
    }
  }

  const style = colors[type] || colors.warning

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
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '500px',
          animation: 'slideDown 0.3s ease-out'
        }}
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

        {/* Footer con botones */}
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '16px 24px 24px',
          justifyContent: 'center'
        }}>
          <button
            onClick={onCancel}
            className="btn-secondary"
            style={{
              minWidth: '120px',
              padding: '10px 20px'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary"
            style={{
              minWidth: '120px',
              padding: '10px 20px',
              backgroundColor: type === 'danger' ? '#ef4444' : undefined
            }}
          >
            {confirmText}
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
