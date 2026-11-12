import React from 'react'
import { FiCalendar } from 'react-icons/fi'
import { TbShieldCheck, TbTrendingUp } from 'react-icons/tb'
import { useCountUp } from '@/hooks/useCountUp'

export interface TotalHeroProps {
  total: number
  change?: string
  /** Texto del periodo, por ejemplo "13 oct – 11 nov 2026" */
  periodo: string
  /** Incidencias por dia, en orden, para la linea de tendencia */
  serie: number[]
}

/** Tarjeta grande azul marino: el total del periodo, su variacion y la tendencia diaria. */
export default function TotalHero({ total, change, periodo, serie }: TotalHeroProps) {
  const shown = useCountUp(total)

  // Linea de tendencia en un lienzo de 100 x 24 que se estira al ancho de la tarjeta
  const max = Math.max(1, ...serie)
  const linea = serie
    .map((v, i) => `${(serie.length > 1 ? (i / (serie.length - 1)) * 100 : 50).toFixed(2)},${(22 - (v / max) * 20).toFixed(2)}`)
    .join(' ')

  return (
    <div className="relative flex h-full min-h-[200px] flex-col overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,#10265f_0%,#14296b_55%,#1b3b8f_100%)] px-8 pt-6 pb-6 text-white shadow-[0_22px_44px_-22px_rgba(10,22,61,0.85)]">
      {/* Ondas y escudo decorativos */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 560 200" preserveAspectRatio="none">
        <path d="M300 0 C 360 60 420 40 470 110 S 540 190 560 200 V0Z" fill="#ffffff" opacity="0.04" />
        <path d="M380 0 C 430 50 470 40 510 100 S 550 170 560 180 V0Z" fill="#60a5fa" opacity="0.06" />
      </svg>
      <TbShieldCheck
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-7 size-[118px] -translate-y-[58%] text-[#3b6fd8] opacity-80 [stroke-width:1.4] max-sm:size-20"
      />

      <p className="relative m-0 text-[19px] font-semibold text-white">Total de incidencias</p>
      <div className="relative mt-3 flex items-center gap-4">
        <span className="text-[68px] leading-none font-bold tracking-[-0.03em] tabular-nums">{shown}</span>
        {change && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3.5 py-1.5 text-[18px] font-semibold text-white ring-1 ring-white/10">
            <TbTrendingUp className="size-5" aria-hidden />
            {change.replace(/^\+/, '')}
          </span>
        )}
      </div>
      <p className="relative m-0 mt-4 flex items-center gap-2 text-[15px] text-white/80">
        <FiCalendar aria-hidden />
        {periodo}
      </p>

      {/* Tendencia diaria: linea fina en la base */}
      <svg className="relative mt-auto block h-6 w-[92%] pt-1" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden>
        <polyline
          points={serie.length > 1 ? linea : '0,22 100,22'}
          fill="none"
          stroke="#5b8cf0"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
