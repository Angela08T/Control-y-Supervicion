import React, { useEffect, useId, useState } from 'react'
import { useCountUp } from '@/hooks/useCountUp'

export interface CircularProgressProps {
  title: string
  percentage: number
  subtitle?: string
}

/** Anillo de cumplimiento: se dibuja al entrar (lima a celeste) y el porcentaje cuenta hasta su valor. */
export default function CircularProgress({ title, percentage, subtitle }: CircularProgressProps) {
  const radius = 65
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  const gradientId = useId()

  // Empieza vacio y pasa a su valor en el siguiente cuadro para que la transicion se vea
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const shown = useCountUp(percentage, 1200)

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-18px_rgba(30,58,138,0.25)]">
      <div>
        <h3 className="m-0 text-[15px] font-semibold text-content">{title}</h3>
        {subtitle && <p className="m-0 mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>

      <div className="relative m-auto size-[180px]">
        <svg className="size-full" viewBox="0 0 160 160" aria-hidden>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent-light)" />
              <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
          </defs>
          <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--border)" strokeWidth="12" />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={drawn ? strokeDashoffset : circumference}
            transform="rotate(-90 80 80)"
            className="transition-[stroke-dashoffset] duration-[1200ms] ease-[cubic-bezier(0.2,0.7,0.2,1)]"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-semibold text-content">
            {shown}%
          </span>
        </div>
      </div>
    </div>
  )
}
