import React from 'react'
import { FaExclamationTriangle } from 'react-icons/fa'

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
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 [backdrop-filter:blur(4px)] animate-[fadeInPointInstant_0.2s_ease-in-out]"
      onClick={handleAccept}
    >
      <div
        className="w-[90%] max-w-[420px] overflow-hidden rounded-[16px] border border-[rgba(239,68,68,0.1)] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-[modalSlideDown_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con icono */}
        <div className="flex flex-col items-center border-b-[3px] border-[rgba(245,158,11,0.3)] bg-[linear-gradient(135deg,rgba(245,158,11,0.12)_0%,rgba(245,158,11,0.05)_100%)] px-6 pt-8 pb-5">
          <div className="mb-4 rounded-[50%] border-[4px] border-[#f59e0b] bg-[rgba(245,158,11,0.15)] p-6 text-[#f59e0b] animate-[scaleIn_0.4s_ease-out]">
            <FaExclamationTriangle size={60} />
          </div>
          <h3 className="m-0 text-center text-[1.5rem] font-bold text-[#1a1a1a]">
            Sesión Expirada
          </h3>
        </div>

        {/* Body */}
        <div className="px-7 py-6 text-center text-[1.05rem] leading-[1.6] font-medium text-[#374151]">
          {message || 'Ha ocurrido un error'}
        </div>

        {/* Footer con botón */}
        <div className="flex justify-center px-6 pt-5 pb-7">
          <button
            onClick={handleAccept}
            className="min-w-[200px] cursor-pointer rounded-[10px] border-none bg-[#f59e0b] px-10 py-3.5 text-[1.05rem] font-bold tracking-[0.5px] text-white uppercase shadow-[0_4px_12px_rgba(245,158,11,0.4)] transition-all duration-200 ease-[ease]"
            onMouseOver={(e) => {
              const target = e.target as HTMLElement
              target.style.backgroundColor = '#d97706'
              target.style.transform = 'translateY(-2px)'
              target.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.5)'
            }}
            onMouseOut={(e) => {
              const target = e.target as HTMLElement
              target.style.backgroundColor = '#f59e0b'
              target.style.transform = 'translateY(0)'
              target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)'
            }}
          >
            Ir a Inicio de Sesión
          </button>
        </div>
      </div>
    </div>
  )
}
