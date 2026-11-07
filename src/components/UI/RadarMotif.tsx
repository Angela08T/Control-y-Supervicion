import React from 'react'
import { cn } from '@/utils/classes'
import loboImage from '@/assets/lobo.png'

/** Puntos del radar: cada uno es un "incidente" que pulsa en su propio ritmo. */
const BLIPS = [
  { x: 71, y: 27, color: '#ffffff', delay: '0s', duration: '3.4s' },
  { x: 29, y: 38, color: '#93c5fd', delay: '1.1s', duration: '4s' },
  { x: 77, y: 68, color: '#ffffff', delay: '2s', duration: '3.7s' },
  { x: 36, y: 76, color: '#93c5fd', delay: '0.6s', duration: '4.3s' },
  { x: 57, y: 17, color: '#bfdbfe', delay: '2.6s', duration: '3.2s' },
]

export interface RadarMotifProps {
  className?: string
  /** Muestra el lobo al centro */
  wolf?: boolean
  /** Segundos por vuelta del barrido */
  sweepSeconds?: number
}

/**
 * Radar de vigilancia para fondos azules: anillos finos, un barrido giratorio y puntos que pulsan.
 * Es decorativo (aria-hidden). Quien lo use debe darle posicion (relative/absolute).
 */
export default function RadarMotif({ className, wolf = false, sweepSeconds = 9 }: RadarMotifProps) {
  return (
    <div aria-hidden className={cn('aspect-square', className)}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" fill="none">
        {[24, 48, 72, 96].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} stroke="rgba(191,219,254,0.22)" strokeWidth="0.7" />
        ))}
        <circle cx="100" cy="100" r="96" stroke="rgba(191,219,254,0.4)" strokeWidth="0.8" strokeDasharray="1 4" />
        <path d="M100 4V196M4 100H196" stroke="rgba(191,219,254,0.14)" strokeWidth="0.7" />
        <path d="M32 32L168 168M168 32L32 168" stroke="rgba(191,219,254,0.08)" strokeWidth="0.7" />
      </svg>

      <div
        className="absolute inset-[2%] rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(147,197,253,0) 0deg, rgba(147,197,253,0) 290deg, rgba(147,197,253,0.4) 358deg, rgba(147,197,253,0) 360deg)',
          animation: `radarSweep ${sweepSeconds}s linear infinite`,
        }}
      />

      {BLIPS.map((b, i) => (
        <span
          key={i}
          className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: `${b.x}%`, top: `${b.y}%`, background: b.color }}
        >
          <span
            className="absolute inset-0 rounded-full"
            style={{ background: b.color, animation: `blipRing ${b.duration} ease-out ${b.delay} infinite` }}
          />
        </span>
      ))}

      {wolf && (
        <span className="absolute top-1/2 left-1/2 flex size-[26%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_0_0_6px_rgba(255,255,255,0.1),0_10px_30px_rgba(2,6,23,0.35)]">
          <img src={loboImage} alt="" className="size-[74%] object-contain" />
        </span>
      )}
    </div>
  )
}
