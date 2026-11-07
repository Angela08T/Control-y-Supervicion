import React from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import Button from '@/components/UI/Button'

export interface ErrorModalProps {
  show: boolean
  message?: string
  onClose?: () => void
}

export default function ErrorModal({ show, message, onClose }: ErrorModalProps) {
  if (!show) return null

  const handleAccept = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/45 p-4 animate-[fadeInSoft_0.15s_ease-out]" onClick={handleAccept}>
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-[400px] flex-col items-center rounded-xl border border-line bg-surface p-6 text-center shadow-[0_16px_48px_rgba(15,23,42,0.18)] animate-[popIn_0.18s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-[rgba(199,21,34,0.10)] text-danger">
          <FiAlertTriangle size={20} aria-hidden />
        </div>
        <h3 className="m-0 text-base font-semibold text-content">Ocurrió un error</h3>
        <p className="m-0 mt-2 text-sm leading-relaxed text-content-2">{message || 'Ha ocurrido un error'}</p>
        <div className="mt-6 flex w-full justify-center">
          <Button onClick={handleAccept}>Ir a inicio de sesión</Button>
        </div>
      </div>
    </div>
  )
}
