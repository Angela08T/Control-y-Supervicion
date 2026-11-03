import React, { useEffect, useState } from 'react'
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa'
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
      textCls: 'text-[#22c55e]',
      bgCls: 'bg-[#22c55e]',
      borderCls: 'border-[#22c55e]',
      lightBgCls: 'bg-[rgba(34,197,94,0.15)]',
      shadowCls: 'shadow-[0_10px_40px_rgba(0,0,0,0.25),0_0_0_1px_rgba(34,197,94,0.15)]',
      glowCls: 'shadow-[0_0_10px_#22c55e]',
      title: '¡Éxito!'
    },
    error: {
      icon: <FaTimesCircle size={28} />,
      textCls: 'text-[#ef4444]',
      bgCls: 'bg-[#ef4444]',
      borderCls: 'border-[#ef4444]',
      lightBgCls: 'bg-[rgba(239,68,68,0.15)]',
      shadowCls: 'shadow-[0_10px_40px_rgba(0,0,0,0.25),0_0_0_1px_rgba(239,68,68,0.15)]',
      glowCls: 'shadow-[0_0_10px_#ef4444]',
      title: 'Error'
    },
    warning: {
      icon: <FaExclamationTriangle size={28} />,
      textCls: 'text-[#f59e0b]',
      bgCls: 'bg-[#f59e0b]',
      borderCls: 'border-[#f59e0b]',
      lightBgCls: 'bg-[rgba(245,158,11,0.15)]',
      shadowCls: 'shadow-[0_10px_40px_rgba(0,0,0,0.25),0_0_0_1px_rgba(245,158,11,0.15)]',
      glowCls: 'shadow-[0_0_10px_#f59e0b]',
      title: 'Advertencia'
    },
    info: {
      icon: <FaInfoCircle size={28} />,
      textCls: 'text-[#3b82f6]',
      bgCls: 'bg-[#3b82f6]',
      borderCls: 'border-[#3b82f6]',
      lightBgCls: 'bg-[rgba(59,130,246,0.15)]',
      shadowCls: 'shadow-[0_10px_40px_rgba(0,0,0,0.25),0_0_0_1px_rgba(59,130,246,0.15)]',
      glowCls: 'shadow-[0_0_10px_#3b82f6]',
      title: 'Información'
    }
  }

  const config = configs[type] || configs.info

  return (
    <div
      className={cn(
        'pointer-events-auto relative flex min-w-[380px] max-w-[480px] items-start gap-4 rounded-[16px] border-[3px] bg-white px-6 py-5 [backdrop-filter:blur(12px)] transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        config.borderCls,
        config.shadowCls,
        isVisible && !isExiting
          ? 'translate-x-0 scale-100 opacity-100'
          : 'translate-x-[450px] scale-90 opacity-0'
      )}
    >
      {/* Icono con fondo circular */}
      <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-full', config.lightBgCls, config.textCls)}>
        {config.icon}
      </div>

      {/* Contenido */}
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 text-[1.1rem] font-bold tracking-[-0.01em] text-[#1a1a1a]">
          {config.title}
        </div>
        <div className="text-[1rem] leading-[1.6] font-medium text-[#4a5568] [word-break:break-word]">
          {message}
        </div>
      </div>

      {/* Botón cerrar */}
      <button
        onClick={handleClose}
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none bg-[rgba(0,0,0,0.05)] p-2 text-[#6b7280] transition-all duration-200 ease-[ease]"
        onMouseOver={(e) => {
          const target = e.target as HTMLElement
          target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
          target.style.color = '#1a1a1a'
          target.style.transform = 'scale(1.1)'
        }}
        onMouseOut={(e) => {
          const target = e.target as HTMLElement
          target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
          target.style.color = '#6b7280'
          target.style.transform = 'scale(1)'
        }}
      >
        <FaTimes size={16} />
      </button>

      {/* Barra de progreso */}
      <div className={cn('absolute inset-x-0 bottom-0 h-[5px] overflow-hidden rounded-b-[16px]', config.lightBgCls)}>
        <div className={cn('h-full animate-[progress_4s_linear_forwards]', config.bgCls, config.glowCls)} />
      </div>
    </div>
  )
}
