import React from 'react'
import Badge, { type BadgeTone } from '@/components/UI/Badge'

export interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  change?: string
  icon: React.ReactNode
  /** Color de marca del icono (hex). Se usa tintado al 10% como fondo del icono. */
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
  const iconStyle = { backgroundColor: `${color}1a`, color }
  const iconClass = 'flex size-9 shrink-0 items-center justify-center rounded-lg text-lg'

  return (
    <div className="flex flex-col rounded-xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 text-[13px] text-muted">{title}</p>
        {onIconClick ? (
          <button
            type="button"
            onClick={onIconClick}
            aria-label={title}
            title={title}
            className={`${iconClass} cursor-pointer border-none transition-colors duration-150`}
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

      <div className="mt-3 flex flex-wrap items-baseline gap-2">
        <span className="text-3xl font-semibold text-content">{value}</span>
        {change && (
          <Badge tone={changeTone(change)} dot={false}>
            {change}
          </Badge>
        )}
      </div>

      {subtitle && <p className="m-0 mt-1 text-xs text-muted">{subtitle}</p>}
    </div>
  )
}
