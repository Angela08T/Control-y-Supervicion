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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease-in-out',
        backdropFilter: 'blur(4px)'
      }}
      onClick={handleAccept}
    >
      <div
        style={{
          backgroundColor: 'var(--card-bg)',
          borderRadius: '16px',
          maxWidth: '420px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'slideDown 0.3s ease-out',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con icono */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 24px 20px',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
          borderBottom: '2px solid rgba(34, 197, 94, 0.2)'
        }}>
          <div style={{
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '3px solid #22c55e',
            borderRadius: '50%',
            padding: '20px',
            marginBottom: '16px',
            color: '#22c55e',
            animation: 'scaleIn 0.4s ease-out'
          }}>
            <FaCheckCircle size={56} />
          </div>
          <h3 style={{
            margin: 0,
            fontSize: '1.4rem',
            fontWeight: '700',
            color: 'var(--text)',
            textAlign: 'center'
          }}>
            ¡Cambios guardados exitosamente!
          </h3>
        </div>

        {/* Body */}
        <div style={{
          padding: '24px 28px',
          fontSize: '1rem',
          lineHeight: '1.6',
          color: 'var(--text-secondary)',
          textAlign: 'center'
        }}>
          {message || 'La operación se ha realizado correctamente'}
        </div>

        {/* Footer con botón */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '20px 24px 28px'
        }}>
          <button
            onClick={handleAccept}
            style={{
              minWidth: '140px',
              padding: '12px 32px',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#16a34a'
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.4)'
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#22c55e'
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)'
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
            transform: translateY(-30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
