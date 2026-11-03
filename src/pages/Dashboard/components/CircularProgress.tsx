import React from 'react'
import { FaFrown, FaMeh, FaSmile } from 'react-icons/fa'
import { cn } from '../../../utils/classes'

export interface CircularProgressProps {
  title: string
  percentage: number
  subtitle?: string
}

// Icono de satisfacción: el color cambia en modo oscuro
const iconBase = 'animate-[fadeIn_0.5s_ease] text-[48px]'

export default function CircularProgress({ title, percentage, subtitle }: CircularProgressProps) {
  const circumference = 2 * Math.PI * 65
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Determinar el emoji según el porcentaje
  const getEmoji = (): React.ReactElement => {
    if (percentage < 50) {
      return <FaFrown className={cn(iconBase, 'text-[#ef4444] dark:text-[#f87171]')} />
    } else if (percentage < 80) {
      return <FaMeh className={cn(iconBase, 'text-[#f59e0b] dark:text-[#fbbf24]')} />
    } else {
      return <FaSmile className={cn(iconBase, 'text-[#10b981] dark:text-[#34d399]')} />
    }
  }

  // Determinar el color del progreso según el porcentaje
  const getProgressColor = (): string => {
    if (percentage < 50) return '#ef4444' // Rojo
    if (percentage < 80) return '#f59e0b' // Amarillo/Naranja
    return '#10b981' // Verde
  }

  return (
    <div className="rounded-2xl border border-line bg-transparent! p-6 text-center shadow-[0_4px_20px_var(--shadow)] [backdrop-filter:blur(10px)]">
      <h3 className="mb-1 text-[16px] font-semibold text-content">{title}</h3>
      <p className="mb-5 text-[12px] text-content-2">De todos los reportes</p>

      <div className="relative mx-auto mb-5 h-[180px] w-[180px]">
        <svg className="h-full w-full" viewBox="0 0 160 160">
          {/* Círculo de fondo */}
          <circle
            cx="80"
            cy="80"
            r="65"
            fill="none"
            stroke="rgba(100, 116, 139, 0.15)"
            strokeWidth="14"
          />

          {/* Círculo de progreso */}
          <circle
            cx="80"
            cy="80"
            r="65"
            fill="none"
            stroke={getProgressColor()}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 80 80)"
            className="[transition:stroke-dashoffset_1s_ease,stroke_0.5s_ease]!"
          />
        </svg>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          {getEmoji()}
        </div>
      </div>

      {/* Cuadro de porcentaje */}
      <div className="mx-auto max-w-fit rounded-xl bg-[linear-gradient(135deg,#0c4a6e_0%,#075985_100%)] px-6 py-3 shadow-[0_4px_12px_rgba(7,89,133,0.3)] dark:bg-[linear-gradient(135deg,#1e40af_0%,#2563eb_100%)] dark:shadow-[0_4px_12px_rgba(37,99,235,0.4)]">
        <span className="text-[28px] font-extrabold text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.2)]">{percentage}%</span>
      </div>
    </div>
  )
}
