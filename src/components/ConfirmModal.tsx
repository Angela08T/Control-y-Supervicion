import React from 'react'
import { FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa'
import { cn } from '../utils/classes'

export type ConfirmModalType = 'warning' | 'danger' | 'info'

export interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  type?: ConfirmModalType
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
}

/** Boton con el gradiente de .btn-primary; padding y ancho minimo propios de este modal */
const primaryButton =
  'relative min-w-[120px] cursor-pointer overflow-hidden rounded-[10px] border-none bg-[linear-gradient(135deg,var(--primary)_0%,var(--secondary)_100%)] px-5 py-2.5 text-[14px] font-semibold text-btn! shadow-[0_4px_15px_var(--shadow)] transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] hover:-translate-y-[3px] hover:scale-105 hover:text-white! hover:shadow-[0_8px_25px_var(--shadow-hover)] active:-translate-y-px active:scale-[1.02]'

/** Boton de .btn-secondary; padding y ancho minimo propios de este modal */
const secondaryButton =
  'cursor-pointer rounded-[10px] border-2 border-[#6b7280] bg-[#f3f4f6] px-5 py-2.5 min-w-[120px] text-[14px] font-semibold text-[#374151] transition-all duration-300 ease-[ease] hover:-translate-y-0.5 hover:border-[#1e3a8a] hover:bg-[#e5e7eb] hover:text-[#1e3a8a]'

/** .modal-backdrop con el z-index y la animacion propios de este modal */
const backdropClass =
  'fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/85 p-10 [backdrop-filter:blur(8px)] animate-[fadeInPointInstant_0.2s_ease-in-out]'

/** .modal-card con el ancho maximo y la animacion propios de este modal */
const cardClass =
  'm-auto w-[450px] max-w-[500px] overflow-hidden rounded-[20px] border border-line bg-surface shadow-[0_20px_60px_var(--shadow-hover)] [backdrop-filter:blur(20px)] animate-[alertSlideDown_0.3s_ease-out] max-[900px]:my-2.5 max-[900px]:max-h-[90vh] max-[900px]:w-[95%] max-[900px]:overflow-y-auto'

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
}: ConfirmModalProps) {
  if (!isOpen) return null

  const colors = {
    warning: {
      bg: 'bg-[rgba(245,158,11,0.1)]',
      border: 'border-[rgba(245,158,11,0.5)]',
      color: 'text-[#f59e0b]',
      icon: <FaExclamationTriangle size={48} />
    },
    danger: {
      bg: 'bg-[rgba(239,68,68,0.1)]',
      border: 'border-[rgba(239,68,68,0.5)]',
      color: 'text-[#ef4444]',
      icon: <FaExclamationTriangle size={48} />
    },
    info: {
      bg: 'bg-[rgba(59,130,246,0.1)]',
      border: 'border-[rgba(59,130,246,0.5)]',
      color: 'text-[#3b82f6]',
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
    <div className={backdropClass}>
      <div className={cardClass}>
        {/* Header con icono */}
        <div className={cn('flex flex-col items-center border-b-2 px-6 pt-6 pb-4', style.border)}>
          <div className={cn('rounded-[50%] border-2 p-4 mb-4', style.bg, style.border, style.color)}>
            {style.icon}
          </div>
          <h3 className="m-0 text-center text-[1.25rem] font-bold">
            {title}
          </h3>
        </div>

        {/* Body */}
        <div className="p-6 text-center text-[0.95rem] leading-[1.6] whitespace-pre-line text-content-2">
          {formattedMessage}
        </div>

        {/* Footer con botones */}
        <div className="flex justify-center gap-3 px-6 pt-4 pb-6">
          <button
            onClick={onCancel}
            className={secondaryButton}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn(primaryButton, type === 'danger' && 'bg-[#ef4444]')}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
