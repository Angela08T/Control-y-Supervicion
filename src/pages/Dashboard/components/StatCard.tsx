import React from 'react'
import { Link } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'
import { useCountUp } from '@/hooks/useCountUp'
import { cardBase, cardHover } from '../cardStyles'

export interface StatCardProps {
  title: string
  value: number | string
  /** Texto pegado al numero, por ejemplo "%" */
  suffix?: string
  subtitle?: string
  icon: React.ReactNode
  /** Color de la metrica (hex): fondo del icono */
  color: string
  /** Pagina a la que lleva la flecha de la derecha; sin ella no se muestra la flecha */
  to?: string
}

/** Metrica: icono grande de color, titulo, dato grande y una flecha que lleva al detalle. */
export default function StatCard({ title, value, suffix, subtitle, icon, color, to }: StatCardProps) {
  // Los numeros "cuentan" hasta su valor; un texto se muestra tal cual
  const numeric = typeof value === 'number' && Number.isFinite(value)
  const counted = useCountUp(numeric ? value : 0)

  return (
    <div className={`relative flex h-full items-center gap-5 px-5 py-4 ${cardBase} ${cardHover}`}>
      <span
        className="flex size-[62px] shrink-0 items-center justify-center rounded-2xl text-[28px] text-white"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}d9)`, boxShadow: `0 10px 20px -10px ${color}` }}
        aria-hidden
      >
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-[14.5px] font-semibold text-ink dark:text-content" title={title}>{title}</p>
        <p className="m-0 mt-1 text-[30px] leading-none font-bold tracking-[-0.02em] text-ink tabular-nums dark:text-content">
          {numeric ? counted : value}
          {suffix}
        </p>
        {subtitle && (
          <p className="m-0 mt-1.5 truncate text-[13.5px] font-medium text-[#5b6b8c] dark:text-content-2" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>

      {to && (
        <Link
          to={to}
          aria-label={`Ver ${title.toLowerCase()}`}
          title="Ver detalle"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eef3fb] text-[20px] text-ink no-underline transition-colors duration-150 hover:bg-primary hover:text-white dark:bg-subtle dark:text-content"
        >
          <FiChevronRight aria-hidden />
        </Link>
      )}
    </div>
  )
}
