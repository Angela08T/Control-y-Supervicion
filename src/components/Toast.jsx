import React, { useEffect, useState } from 'react'
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa'

export default function Toast({ message, type = 'success', onClose }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Activar animación de entrada
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      if (onClose) onClose()
    }, 300)
  }

  const configs = {
    success: {
      icon: <FaCheckCircle size={24} />,
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)',
      borderColor: '#22c55e',
      title: '¡Éxito!'
    },
    error: {
      icon: <FaTimesCircle size={24} />,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: '#ef4444',
      title: 'Error'
    },
    warning: {
      icon: <FaExclamationTriangle size={24} />,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      borderColor: '#f59e0b',
      title: 'Advertencia'
    },
    info: {
      icon: <FaInfoCircle size={24} />,
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: '#3b82f6',
      title: 'Información'
    }
  }

  const config = configs[type] || configs.info

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: 'var(--card-bg)',
        borderLeft: `4px solid ${config.borderColor}`,
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        minWidth: '320px',
        maxWidth: '400px',
        opacity: isExiting ? 0 : isVisible ? 1 : 0,
        transform: isExiting
          ? 'translateX(400px)'
          : isVisible
            ? 'translateX(0)'
            : 'translateX(400px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'auto',
        backdropFilter: 'blur(8px)'
      }}
    >
      {/* Icono */}
      <div style={{
        color: config.color,
        flexShrink: 0,
        marginTop: '2px'
      }}>
        {config.icon}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: '600',
          fontSize: '0.95rem',
          color: 'var(--text)',
          marginBottom: '4px'
        }}>
          {config.title}
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
          wordBreak: 'break-word'
        }}>
          {message}
        </div>
      </div>

      {/* Botón cerrar */}
      <button
        onClick={handleClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          flexShrink: 0
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
          e.target.style.color = 'var(--text)'
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'transparent'
          e.target.style.color = 'var(--text-muted)'
        }}
      >
        <FaTimes size={14} />
      </button>

      {/* Barra de progreso */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '3px',
        backgroundColor: config.bgColor,
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          backgroundColor: config.color,
          animation: 'progress 4s linear forwards'
        }} />
      </div>

      <style jsx="true">{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}
