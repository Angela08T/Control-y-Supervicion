import React from 'react'
import { useAppSelector } from '../../../store/hooks'
import { getTurno } from '@/utils/turno'
import loboImage from '../../../assets/lobo.png'

export interface WelcomeCardProps {
  /** Controles a la derecha del saludo (el filtro de periodo) */
  children?: React.ReactNode
}

const saludoDe = (hora: number): string => {
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/**
 * Encabezado de Inicio, sin banner: el lobo y el saludo grande (nombre en degradado) a la izquierda,
 * el filtro a la derecha. La fecha ya esta en la barra superior.
 */
export default function WelcomeCard({ children }: WelcomeCardProps) {
  const { username, nombre } = useAppSelector((state) => state.auth)
  const hora = new Date().getHours()
  // Solo el primer nombre, para que el saludo sea corto
  const primerNombre = (nombre || username || 'Usuario').trim().split(/\s+/)[0]

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 items-center gap-5">
        {/* Lobo en un circulo blanco con anillo azul marino */}
        <span className="flex size-[88px] shrink-0 items-center justify-center rounded-full border-[3px] border-[#14296b] bg-white shadow-[0_0_0_5px_rgba(20,41,107,0.08)] dark:shadow-[0_0_0_5px_rgba(96,165,250,0.12),0_12px_26px_-14px_rgba(20,41,107,0.7)] max-sm:hidden dark:border-accent-light">
          <img src={loboImage} alt="" aria-hidden className="size-[60px] object-contain" />
        </span>

        <div className="min-w-0">
          <p className="m-0 text-[13px] font-semibold tracking-[0.04em] text-ink/80 uppercase dark:text-content-2">Inicio · Panel de control</p>
          <h2 className="m-0 mt-0.5 text-[34px] leading-[1.15] font-bold tracking-[-0.02em] text-ink max-sm:text-[25px] dark:text-content">
            {saludoDe(hora)}, <span className="text-[#2f62d8] uppercase dark:text-accent-light">{primerNombre}</span>
          </h2>
          <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[14px] font-medium text-ink ring-1 ring-[#8ebc22]/70 dark:bg-surface dark:text-content">
            <span className="relative flex size-2.5">
              <span className="absolute inset-0 rounded-full bg-[#22c55e]" style={{ animation: 'blipRing 2.4s ease-out infinite' }} />
              <span className="relative size-2.5 rounded-full bg-[#22c55e]" />
            </span>
            Turno {getTurno().nombre.toLowerCase()} en curso
          </span>
        </div>
      </div>

      {children}
    </header>
  )
}
