import React, { useId } from 'react'
import { cn } from '@/utils/classes'

export interface CentinelaWordmarkProps {
  /** `dark` = sobre fondo azul (letras blancas); `light` = sobre fondo claro (letras azul marino) */
  tone?: 'dark' | 'light'
  className?: string
}

/**
 * Contornos de las letras C-E-N-T-I-N-E-L-A en IBM Plex Sans Bold (la fuente de la app),
 * convertidos a trazos y ya posicionados: cada letra se monta sobre la anterior.
 * Al ser trazos fijos, el logo se ve igual en cualquier equipo, tenga o no la fuente instalada.
 */
const LETTERS = [
  'M309 710Q215 710 145.5 670Q76 630 38 551Q0 472 0 354Q0 236 38 154.5Q76 73 145.5 30.5Q215 -12 309 -12Q405 -12 468.5 28Q532 68 570 152L439 220Q426 176 395.5 149.5Q365 123 309 123Q242 123 201.5 166.5Q161 210 161 293V405Q161 487 201.5 531Q242 575 309 575Q365 575 398.5 544.5Q432 514 448 471L572 543Q533 622 469 666Q405 710 309 710Z',
  'M927 698H452V0H927V135H604V278H881V412H604V563H927Z',
  'M1211 698 1020 368 953 228H950V374V698H807V0H973L1164 330L1231 470H1234V324V0H1377V698Z',
  'M1927 135H1738V698H1586V135H1397V0H1927Z',
  'M2249 698H1917V577H2007V121H1917V0H2249V121H2159V577H2249Z',
  'M2643 698 2452 368 2385 228H2382V374V698H2239V0H2405L2596 330L2663 470H2666V324V0H2809V698Z',
  'M3164 698H2689V0H3164V135H2841V278H3118V412H2841V563H3164Z',
  'M3502 698H3084V0H3236V563H3502Z',
  'M3997 698H3839L3789 532H3556L3506 698H3352L3582 0H3770ZM3752 403 3709 258 3674 138H3669L3635 258L3592 403Z',
]

const WIDTH = 3997
const CAP = 698
const PAD = 20
/** Grosor del corte que separa cada letra de la que se le monta encima */
const GAP = 26

/**
 * Logotipo "CENTINELA" con letras entrelazadas: cada letra se monta sobre la anterior
 * y la recorta con un fino corte transparente, asi se ven fusionadas pero legibles.
 */
export default function CentinelaWordmark({ tone = 'dark', className }: CentinelaWordmarkProps) {
  const uid = useId().replace(/:/g, '')
  const box = { x: -PAD, y: -PAD, width: WIDTH + PAD * 2, height: CAP + PAD * 2 }

  return (
    <svg
      viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      role="img"
      aria-label="Centinela"
      className={cn('block h-auto overflow-visible', className)}
    >
      <defs>
        <linearGradient id={`wm-fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
          {tone === 'dark' ? (
            <>
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#c7d7fe" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#1e3a8a" />
              <stop offset="1" stopColor="#14296b" />
            </>
          )}
        </linearGradient>
        {LETTERS.slice(0, -1).map((_, i) => (
          <mask key={i} id={`wm-cut-${uid}-${i}`} maskUnits="userSpaceOnUse" {...box}>
            <rect {...box} fill="#fff" />
            {/* La letra siguiente, engrosada, recorta a esta */}
            <path d={LETTERS[i + 1]} fill="#000" stroke="#000" strokeWidth={GAP * 2} strokeLinejoin="round" />
          </mask>
        ))}
      </defs>

      <g fill={`url(#wm-fill-${uid})`}>
        {LETTERS.map((d, i) => (
          <path key={i} d={d} mask={i < LETTERS.length - 1 ? `url(#wm-cut-${uid}-${i})` : undefined} />
        ))}
      </g>
    </svg>
  )
}
