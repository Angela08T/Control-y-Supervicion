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
      icon: <FaCheckCircle size={28} />,
      color: '#22c55e',
      bgColor: '#22c55e',
      borderColor: '#22c55e',
      lightBg: 'rgba(34, 197, 94, 0.15)',
      title: '¡Éxito!'
    },
    error: {
      icon: <FaTimesCircle size={28} />,
      color: '#ef4444',
      bgColor: '#ef4444',
      borderColor: '#ef4444',
      lightBg: 'rgba(239, 68, 68, 0.15)',
      title: 'Error'
    },
    warning: {
      icon: <FaExclamationTriangle size={28} />,
      color: '#f59e0b',
      bgColor: '#f59e0b',
      borderColor: '#f59e0b',
      lightBg: 'rgba(245, 158, 11, 0.15)',
      title: 'Advertencia'
    },
    info: {
      icon: <FaInfoCircle size={28} />,
      color: '#3b82f6',
      bgColor: '#3b82f6',
      borderColor: '#3b82f6',
      lightBg: 'rgba(59, 130, 246, 0.15)',
      title: 'Información'
    }
  }

  const config = configs[type] || configs.info

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: '#ffffff',
        border: `3px solid ${config.borderColor}`,
        borderRadius: '16px',
        boxShadow: `0 10px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px ${config.lightBg}`,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        minWidth: '380px',
        maxWidth: '480px',
        opacity: isExiting ? 0 : isVisible ? 1 : 0,
        transform: isExiting
          ? 'translateX(450px) scale(0.9)'
          : isVisible
            ? 'translateX(0) scale(1)'
            : 'translateX(450px) scale(0.9)',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        pointerEvents: 'auto',
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Icono con fondo circular */}
      <div style={{
        backgroundColor: config.lightBg,
        borderRadius: '50%',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: config.color,
        flexShrink: 0
      }}>
        {config.icon}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: '700',
          fontSize: '1.1rem',
          color: '#1a1a1a',
          marginBottom: '6px',
          letterSpacing: '-0.01em'
        }}>
          {config.title}
        </div>
        <div style={{
          fontSize: '1rem',
          color: '#4a5568',
          lineHeight: '1.6',
          wordBreak: 'break-word',
          fontWeight: '500'
        }}>
          {message}
        </div>
      </div>

      {/* Botón cerrar */}
      <button
        onClick={handleClose}
        style={{
          background: 'rgba(0, 0, 0, 0.05)',
          border: 'none',
          color: '#6b7280',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          flexShrink: 0,
          width: '32px',
          height: '32px'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
          e.target.style.color = '#1a1a1a'
          e.target.style.transform = 'scale(1.1)'
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
          e.target.style.color = '#6b7280'
          e.target.style.transform = 'scale(1)'
        }}
      >
        <FaTimes size={16} />
      </button>

      {/* Barra de progreso */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '5px',
        backgroundColor: config.lightBg,
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          backgroundColor: config.bgColor,
          animation: 'progress 4s linear forwards',
          boxShadow: `0 0 10px ${config.color}`
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
