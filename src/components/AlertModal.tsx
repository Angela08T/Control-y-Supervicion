import React from 'react'
import { FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi'
import Button from '@/components/UI/Button'

export type AlertModalType = 'success' | 'error' | 'info'

export interface AlertModalProps {
  isOpen: boolean
  title: string
  message: string
  type?: AlertModalType
  onClose: () => void
}

/**
 * Modal de alerta (reemplazo de alert()).
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje del modal (puede incluir \n para saltos de línea)
 * @param {string} type - Tipo: 'success' | 'error' | 'info'
 * @param {function} onClose - Función a ejecutar al cerrar
 */
export default function AlertModal({
  isOpen,
  title,
  message,
  type = 'success',
  onClose
}: AlertModalProps) {
  if (!isOpen) return null

  const styles = {
    success: {
      tone: 'bg-[rgba(142,188,34,0.12)] text-success',
      icon: <FiCheckCircle size={20} aria-hidden />
    },
    error: {
      tone: 'bg-[rgba(199,21,34,0.10)] text-danger',
      icon: <FiAlertCircle size={20} aria-hidden />
    },
    info: {
      tone: 'bg-[rgba(59,130,246,0.1)] text-secondary',
      icon: <FiInfo size={20} aria-hidden />
    }
  }

  const style = styles[type] || styles.info

  // Convertir saltos de línea en elementos <br>
  const lines = message.split('\n')
  const formattedMessage = lines.map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < lines.length - 1 && <br />}
    </React.Fragment>
  ))

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/45 dark:bg-black/65 p-4 animate-[fadeInSoft_0.15s_ease-out]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-[400px] flex-col items-center rounded-xl border border-line bg-surface p-6 text-center shadow-[0_16px_48px_rgba(15,23,42,0.18)] animate-[popIn_0.18s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`mb-4 flex size-10 items-center justify-center rounded-full ${style.tone}`}>
          {style.icon}
        </div>
        <h3 className="m-0 text-base font-semibold text-content">{title}</h3>
        <p className="m-0 mt-2 whitespace-pre-line text-sm leading-relaxed text-content-2">{formattedMessage}</p>
        <div className="mt-6 flex w-full justify-center">
          <Button onClick={onClose}>Aceptar</Button>
        </div>
      </div>
    </div>
  )
}
