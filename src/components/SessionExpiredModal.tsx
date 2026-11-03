import React from 'react'
import { FaExclamationTriangle } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 [backdrop-filter:blur(4px)] animate-[fadeInPointInstant_0.2s_ease-in-out]">
      <div className="w-[90%] max-w-[420px] overflow-hidden rounded-[16px] border border-[rgba(245,158,11,0.2)] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-[modalSlideDown_0.3s_ease-out]">
        {/* Header con icono */}
        <div className="flex flex-col items-center border-b-2 border-[rgba(245,158,11,0.3)] bg-[linear-gradient(135deg,rgba(245,158,11,0.15)_0%,rgba(245,158,11,0.08)_100%)] px-6 pt-8 pb-5">
          <div className="mb-4 rounded-[50%] border-[3px] border-[#f59e0b] bg-[rgba(245,158,11,0.2)] p-5 text-[#f59e0b] animate-[scaleIn_0.4s_ease-out]">
            <FaExclamationTriangle size={56} />
          </div>
          <h3 className="m-0 text-center text-[1.5rem] font-bold text-[#1f2937]">
            Sesión Expirada
          </h3>
        </div>

        {/* Body */}
        <div className="px-7 py-6 text-center text-[1.05rem] leading-[1.6] font-medium text-[#4b5563]">
          Su sesión ha expirado por inactividad. Por favor, inicie sesión nuevamente para continuar.
        </div>

        {/* Footer con botón */}
        <div className="flex justify-center px-6 pt-5 pb-7">
          <button
            onClick={handleAccept}
            className="min-w-[140px] cursor-pointer rounded-[10px] border-none bg-[#f59e0b] px-8 py-3 text-[1rem] font-semibold text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)] transition-all duration-200 ease-[ease]"
            onMouseOver={(e) => {
              const target = e.target as HTMLElement
              target.style.backgroundColor = '#d97706'
              target.style.transform = 'translateY(-2px)'
              target.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.4)'
            }}
            onMouseOut={(e) => {
              const target = e.target as HTMLElement
              target.style.backgroundColor = '#f59e0b'
              target.style.transform = 'translateY(0)'
              target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}
          >
            Ir a Inicio de Sesión
          </button>
        </div>
      </div>
    </div>
  )
}
