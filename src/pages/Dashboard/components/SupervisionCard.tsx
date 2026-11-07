import React, { useEffect, useId, useState } from 'react'

export interface SupervisionCardProps {
  serenosEnCampo: number
  serenosSinConexion: number
  /** Porcentaje 0-100 */
  nivelCumplimiento: number
}

export default function SupervisionCard({ serenosEnCampo, serenosSinConexion, nivelCumplimiento }: SupervisionCardProps) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (nivelCumplimiento / 100) * circumference
  const gradientId = useId()

  // Empieza vacio y pasa a su valor en el siguiente cuadro para que la transicion se vea
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5">
      <div>
        <h3 className="m-0 text-[15px] font-semibold text-content">Supervisión de campo</h3>
        <p className="m-0 mt-0.5 text-xs text-muted">Estado actual del equipo</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="m-0 text-xs text-muted">En campo</p>
          <p className="m-0 mt-1 text-lg font-semibold text-content">{serenosEnCampo} serenos</p>
        </div>
        <div>
          <p className="m-0 text-xs text-muted">Sin conexión</p>
          <p className="m-0 mt-1 text-lg font-semibold text-danger">{serenosSinConexion}</p>
        </div>
      </div>

      <div className="relative mx-auto size-[140px]">
        <svg viewBox="0 0 140 140" className="size-full" aria-hidden>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent-light)" />
              <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
          </defs>
          <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={drawn ? strokeDashoffset : circumference}
            transform="rotate(-90 70 70)"
            className="transition-[stroke-dashoffset] duration-[1200ms] ease-[cubic-bezier(0.2,0.7,0.2,1)]"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="m-0 text-xs text-muted">Seguridad</p>
          <p className="m-0 text-2xl font-semibold text-content">
            {(nivelCumplimiento / 10).toFixed(1)}
          </p>
          <p className="m-0 text-xs text-muted">Puntaje total</p>
        </div>
      </div>
    </div>
  )
}
