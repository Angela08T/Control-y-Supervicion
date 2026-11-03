import React from 'react'
import { FaCheckCircle } from 'react-icons/fa'

export interface SuccessModalProps {
  show: boolean
  message?: string
  onClose?: () => void
}

export default function SuccessModal({ show, message, onClose }: SuccessModalProps) {
  if (!show) return null

  const handleAccept = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 [backdrop-filter:blur(4px)] animate-[fadeInPointInstant_0.2s_ease-in-out]"
      onClick={handleAccept}
    >
      <div
        className="w-[90%] max-w-[420px] overflow-hidden rounded-[16px] [background-color:var(--card-bg)] shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[modalSlideDown_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con icono */}
        <div className="flex flex-col items-center border-b-2 border-[rgba(34,197,94,0.2)] bg-[linear-gradient(135deg,rgba(34,197,94,0.1)_0%,rgba(34,197,94,0.05)_100%)] px-6 pt-8 pb-5">
          <div className="mb-4 rounded-[50%] border-[3px] border-[#22c55e] bg-[rgba(34,197,94,0.15)] p-5 text-[#22c55e] animate-[scaleIn_0.4s_ease-out]">
            <FaCheckCircle size={56} />
          </div>
          <h3 className="m-0 text-center text-[1.4rem] font-bold">
            ¡Cambios guardados exitosamente!
          </h3>
        </div>

        {/* Body */}
        <div className="px-7 py-6 text-center text-[1rem] leading-[1.6] text-content-2">
          {message || 'La operación se ha realizado correctamente'}
        </div>

        {/* Footer con botón */}
        <div className="flex justify-center px-6 pt-5 pb-7">
          <button
            onClick={handleAccept}
            className="min-w-[140px] cursor-pointer rounded-[10px] border-none bg-[#22c55e] px-8 py-3 text-[1rem] font-semibold text-white shadow-[0_4px_12px_rgba(34,197,94,0.3)] transition-all duration-200 ease-[ease]"
            onMouseOver={(e) => {
              const target = e.target as HTMLElement
              target.style.backgroundColor = '#16a34a'
              target.style.transform = 'translateY(-2px)'
              target.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.4)'
            }}
            onMouseOut={(e) => {
              const target = e.target as HTMLElement
              target.style.backgroundColor = '#22c55e'
              target.style.transform = 'translateY(0)'
              target.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)'
            }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
