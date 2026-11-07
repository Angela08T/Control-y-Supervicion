import React from 'react'
import { useAppSelector } from '../../../store/hooks'
import loboImage from '../../../assets/lobo.png'
import ContourMap from '@/components/UI/ContourMap'
import { getTurno } from '@/utils/turno'
import DateCard from './DateCard'

export interface WelcomeCardProps {
  message: string
}

const saludoDe = (hora: number): string => {
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/** Banner del panel: saludo, fecha, turno en curso y el lobo, sobre el fondo cartografico. */
export default function WelcomeCard({ message }: WelcomeCardProps) {
  const { username, nombre } = useAppSelector((state) => state.auth)
  const hora = new Date().getHours()

  return (
    <header className="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-[var(--page-color)] px-7 py-6 text-[var(--page-fg)] max-sm:px-5">
      <ContourMap tone="dark" align="xMaxYMid" />

      <div className="relative z-10 min-w-0">
        <DateCard className="text-white/70" />
        <h2 className="m-0 mt-1 text-[26px] leading-tight font-semibold tracking-[-0.01em] max-sm:text-[22px]">
          {saludoDe(hora)}, {nombre || username || 'Usuario'}
        </h2>
        <p className="m-0 mt-1 text-sm text-white/75">{message}</p>
        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20">
          <span className="relative flex size-2">
            <span
              className="absolute inset-0 rounded-full bg-brand-lime"
              style={{ animation: 'blipRing 2.4s ease-out infinite' }}
            />
            <span className="relative size-2 rounded-full bg-brand-lime" />
          </span>
          Turno {getTurno().nombre.toLowerCase()} en curso
        </span>
      </div>

      <span className="relative z-10 flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.25)] max-sm:hidden">
        <img src={loboImage} alt="Lobo Centinela" className="size-12 object-contain" />
      </span>
    </header>
  )
}
