import React from 'react'
import { FiAlertTriangle, FiInfo } from 'react-icons/fi'
import Button from '@/components/UI/Button'

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

/**
 * Modal de confirmación.
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

  const styles = {
    warning: {
      tone: 'bg-[rgba(242,165,15,0.14)] text-warning',
      icon: <FiAlertTriangle size={20} aria-hidden />
    },
    danger: {
      tone: 'bg-[rgba(199,21,34,0.10)] text-danger',
      icon: <FiAlertTriangle size={20} aria-hidden />
    },
    info: {
      tone: 'bg-[rgba(59,130,246,0.1)] text-secondary',
      icon: <FiInfo size={20} aria-hidden />
    }
  }

  const style = styles[type] || styles.warning

  // Convertir saltos de línea en elementos <br>
  const lines = message.split('\n')
  const formattedMessage = lines.map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < lines.length - 1 && <br />}
    </React.Fragment>
  ))

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/45 dark:bg-black/65 p-4 animate-[fadeInSoft_0.15s_ease-out]">
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-[400px] flex-col items-center rounded-xl border border-line bg-surface p-6 text-center shadow-[0_16px_48px_rgba(15,23,42,0.18)] animate-[popIn_0.18s_ease-out]"
      >
        <div className={`mb-4 flex size-10 items-center justify-center rounded-full ${style.tone}`}>
          {style.icon}
        </div>
        <h3 className="m-0 text-base font-semibold text-content">{title}</h3>
        <p className="m-0 mt-2 text-sm leading-relaxed text-content-2">{formattedMessage}</p>
        <div className="mt-6 flex w-full justify-center gap-3">
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={type === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
