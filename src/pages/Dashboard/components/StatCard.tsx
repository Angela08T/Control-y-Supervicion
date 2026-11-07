import React from 'react'
import Badge, { type BadgeTone } from '@/components/UI/Badge'
import { useCountUp } from '@/hooks/useCountUp'

export interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  change?: string
  icon: React.ReactNode
  /** Color del icono (hex), tintado al 12% como fondo. */
  color: string
  onIconClick?: () => void
}

/** Variación: "+" sube (verde), "0%" neutra, cualquier otra cosa empeora (rojo). */
const changeTone = (change: string): BadgeTone => {
  if (change.startsWith('+')) return 'success'
  if (change === '0%') return 'neutral'
  return 'danger'
}

export default function StatCard({ title, value, subtitle, change, icon, color, onIconClick }: StatCardProps) {
  const iconStyle = { backgroundColor: `${color}1f`, color }
  const iconClass = 'flex size-10 shrink-0 items-center justify-center rounded-lg text-xl'

  // Los numeros "cuentan" hasta su valor; un texto se muestra tal cual
  const numeric = typeof value === 'number' && Number.isFinite(value)
  const counted = useCountUp(numeric ? value : 0)

  return (
    <div className="flex flex-col rounded-2xl border border-line bg-surface p-5 transition-colors duration-200 hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 text-[13px] font-medium text-muted">{title}</p>
        {onIconClick ? (
          <button
            type="button"
            onClick={onIconClick}
            aria-label={title}
            title={title}
            className={`${iconClass} cursor-pointer border-none transition-opacity duration-150 hover:opacity-80`}
            style={iconStyle}
          >
            {icon}
          </button>
        ) : (
          <span className={iconClass} style={iconStyle} aria-hidden>
            {icon}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
        <span className="text-[34px] leading-none font-semibold tracking-[-0.02em] text-content tabular-nums">
          {numeric ? counted : value}
        </span>
        {change && (
          <Badge tone={changeTone(change)} dot={false}>
            {change}
          </Badge>
        )}
      </div>

      {subtitle && <p className="m-0 mt-2 text-xs text-muted">{subtitle}</p>}
    </div>
  )
}
