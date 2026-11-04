import React from 'react'
import { useAppSelector } from '../../../store/hooks'
import loboImage from '../../../assets/lobo.png'
import DateCard from './DateCard'

export interface WelcomeCardProps {
  message: string
}

/** Encabezado compacto: saludo, fecha de hoy y frase corta. Sin tarjeta de color. */
export default function WelcomeCard({ message }: WelcomeCardProps) {
  const { username } = useAppSelector((state) => state.auth)

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h2 className="m-0 text-[22px] font-semibold text-content">Hola, {username || 'Usuario'}</h2>
        <div className="mt-1 flex flex-col gap-0.5">
          <DateCard />
          <p className="m-0 text-sm text-muted">{message}</p>
        </div>
      </div>

      <img src={loboImage} alt="Lobo Centinela" className="size-14 shrink-0 object-contain" />
    </header>
  )
}
