import React, { useEffect, useState } from 'react'
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiX, FiXCircle } from 'react-icons/fi'
import type { ToastType } from '../utils/toast'
import { cn } from '../utils/classes'

export interface ToastProps {
  message: string
  type?: ToastType
  onClose?: () => void
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Activar la entrada (solo opacidad, sin desplazamiento)
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
      icon: <FiCheckCircle size={18} aria-hidden />,
      iconCls: 'bg-[rgba(142,188,34,0.12)] text-success',
      stripeCls: 'bg-success',
      barCls: 'bg-success',
      title: '¡Éxito!'
    },
    error: {
      icon: <FiXCircle size={18} aria-hidden />,
      iconCls: 'bg-[rgba(199,21,34,0.10)] text-danger',
      stripeCls: 'bg-danger',
      barCls: 'bg-danger',
      title: 'Error'
    },
    warning: {
      icon: <FiAlertTriangle size={18} aria-hidden />,
      iconCls: 'bg-[rgba(242,165,15,0.14)] text-warning',
      stripeCls: 'bg-warning',
      barCls: 'bg-warning',
      title: 'Advertencia'
    },
    info: {
      icon: <FiInfo size={18} aria-hidden />,
      iconCls: 'bg-[rgba(59,130,246,0.1)] text-secondary',
      stripeCls: 'bg-secondary',
      barCls: 'bg-secondary',
      title: 'Información'
    }
  }

  const config = configs[type] || configs.info

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto relative flex w-[360px] max-w-full items-start gap-3 overflow-hidden rounded-xl border border-line bg-surface py-3.5 pr-3 pl-5 shadow-[0_1px_2px_var(--shadow)] transition-opacity duration-200',
        isVisible && !isExiting ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Franja de color del tipo */}
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', config.stripeCls)} aria-hidden />

      {/* Icono */}
      <div className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full', config.iconCls)}>
        {config.icon}
      </div>

      {/* Contenido */}
      <div className="min-w-0 flex-1 pb-1">
        <div className="text-sm font-semibold text-content">{config.title}</div>
        <div className="mt-0.5 text-sm break-words text-content-2">{message}</div>
      </div>

      {/* Botón cerrar */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Cerrar notificación"
        title="Cerrar"
        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-muted transition-colors duration-150 hover:bg-subtle hover:text-content"
      >
        <FiX size={16} aria-hidden />
      </button>

      {/* Barra de tiempo restante (misma duración que el auto-cierre) */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-subtle">
        <div className={cn('h-full animate-[progress_4s_linear_forwards]', config.barCls)} />
      </div>
    </div>
  )
}
