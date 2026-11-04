import React from 'react'

export interface CircularProgressProps {
  title: string
  percentage: number
  subtitle?: string
}

/** Anillo de cumplimiento: color de marca sobre pista gris, porcentaje al centro. */
export default function CircularProgress({ title, percentage, subtitle }: CircularProgressProps) {
  const radius = 65
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <div>
        <h3 className="m-0 text-[15px] font-semibold text-content">{title}</h3>
        {subtitle && <p className="m-0 mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>

      <div className="relative mx-auto size-[160px]">
        <svg className="size-full" viewBox="0 0 160 160" aria-hidden>
          <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--border)" strokeWidth="12" />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 80 80)"
            className="transition-[stroke-dashoffset] duration-300"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-semibold text-content">{percentage}%</span>
        </div>
      </div>
    </div>
  )
}
