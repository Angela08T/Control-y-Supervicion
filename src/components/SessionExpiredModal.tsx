import React from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/UI/Button'

export interface SessionExpiredModalProps {
  show: boolean
  onAccept?: () => void
}

export default function SessionExpiredModal({ show, onAccept }: SessionExpiredModalProps) {
  const navigate = useNavigate()

  if (!show) return null

  const handleAccept = () => {
    if (onAccept) {
      onAccept()
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/45 p-4 animate-[fadeInSoft_0.15s_ease-out]">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-expired-title"
        className="flex w-full max-w-[400px] flex-col items-center rounded-xl border border-line bg-surface p-6 text-center shadow-[0_16px_48px_rgba(15,23,42,0.18)] animate-[popIn_0.18s_ease-out]"
      >
        <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-[rgba(245,158,11,0.14)] text-warning">
          <FiAlertTriangle size={20} aria-hidden />
        </div>
        <h3 id="session-expired-title" className="m-0 text-base font-semibold text-content">
          Sesión expirada
        </h3>
        <p className="m-0 mt-2 text-sm leading-relaxed text-content-2">
          Su sesión ha expirado por inactividad. Por favor, inicie sesión nuevamente para continuar.
        </p>
        <div className="mt-6 flex w-full justify-center">
          <Button onClick={handleAccept}>Ir a inicio de sesión</Button>
        </div>
      </div>
    </div>
  )
}
