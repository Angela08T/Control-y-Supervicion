import React from 'react'

export interface SectionHeaderProps {
  title: string
  subtitle?: string
  /** Icono del titulo, sobre un cuadro de color */
  icon: React.ReactNode
  /** Color del cuadro del icono (hex) */
  color: string
  /** Dato a la derecha, por ejemplo el total */
  right?: React.ReactNode
}

/** Cabecera comun de las tarjetas de Inicio: icono de color, titulo en azul tinta y subtitulo. */
export default function SectionHeader({ title, subtitle, icon, color, right }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3.5">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-[14px] text-[22px] text-white"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}d9)`, boxShadow: `0 8px 16px -8px ${color}` }}
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="m-0 text-[18px] leading-tight font-bold text-ink dark:text-content">{title}</h3>
          {subtitle && <p className="m-0 mt-0.5 truncate text-[14px] text-[#5b6b8c] dark:text-content-2">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="shrink-0 text-right">{right}</div>}
    </div>
  )
}

/** Cifra destacada para la derecha de la cabecera: "48" grande y "en total" debajo */
export function HeaderTotal({ value, label }: { value: number; label: string }) {
  return (
    <>
      <p className="m-0 text-[24px] leading-none font-bold text-ink tabular-nums dark:text-content">{value}</p>
      <p className="m-0 mt-1 text-[13px] font-medium text-ink/80 dark:text-content-2">{label}</p>
    </>
  )
}

/** Estado vacio con ilustracion: un icono grande sobre una nube suave y el mensaje debajo */
export function EmptyIllustration({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="relative mt-4 flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#eef3fb] px-4 py-6 text-center dark:bg-[#0d1628] dark:ring-1 dark:ring-inset dark:ring-white/[0.04]">
      {/* Nube de fondo */}
      <svg aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 h-[70%] w-[90%] -translate-x-1/2" viewBox="0 0 400 160" preserveAspectRatio="none">
        <path
          d="M20 160 C 10 120 50 100 85 110 C 95 70 150 55 180 80 C 200 40 270 40 285 85 C 320 70 370 90 365 125 C 390 130 395 150 385 160Z"
          className="fill-white/60 dark:fill-white/[0.035]"
        />
      </svg>
      <span className="relative flex text-[64px] text-[#2f62d8] dark:text-accent-light" aria-hidden>
        {icon}
      </span>
      <p className="relative m-0 mt-4 text-[15px] font-medium text-ink dark:text-content">{message}</p>
    </div>
  )
}
