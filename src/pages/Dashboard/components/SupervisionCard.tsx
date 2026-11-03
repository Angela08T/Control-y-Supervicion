import React from 'react'

export interface SupervisionCardProps {
  serenosEnCampo: number
  serenosSinConexion: number
  /** Porcentaje 0-100 */
  nivelCumplimiento: number
}

export default function SupervisionCard({ serenosEnCampo, serenosSinConexion, nivelCumplimiento }: SupervisionCardProps) {
  const circumference = 2 * Math.PI * 60
  const strokeDashoffset = circumference - (nivelCumplimiento / 100) * circumference

  return (
    <div className="rounded-[16px] border border-line bg-transparent! p-6 shadow-[0_4px_20px_var(--shadow)] [backdrop-filter:blur(10px)]">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="mb-1 text-[16px] font-semibold text-content">Supervisión de Campo</h3>
          <p className="text-[12px] text-content-2">Estado actual del equipo</p>
        </div>
        <button className="cursor-pointer border-none bg-transparent p-0 text-[20px] text-content-2">⋮</button>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex gap-5">
          <div className="flex-1">
            <p className="mb-1 text-[11px] uppercase text-content-2">En campo</p>
            <h4 className="m-0 text-[18px] font-semibold text-content">{serenosEnCampo} serenos</h4>
          </div>

          <div className="flex-1">
            <p className="mb-1 text-[11px] uppercase text-content-2">Sin conexión</p>
            <h4 className="m-0 text-[18px] font-semibold text-danger">{serenosSinConexion}</h4>
          </div>
        </div>

        <div className="relative mx-auto h-[140px] w-[140px]">
          <svg viewBox="0 0 140 140" className="h-full w-full">
            <defs>
              <linearGradient id="supervisionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4a6cf7" />
                <stop offset="100%" stopColor="#8a4af3" />
              </linearGradient>
            </defs>

            {/* Círculo de fondo */}
            <circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke="rgba(74, 108, 247, 0.1)"
              strokeWidth="10"
            />

            {/* Círculo de progreso */}
            <circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke="url(#supervisionGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 70 70)"
              className="[stroke:var(--secondary)] [transition:stroke-dashoffset_1s_ease]"
            />
          </svg>

          <div className="absolute top-1/2 left-1/2 text-center [transform:translate(-50%,-50%)]">
            <p className="text-[11px] text-content-2">Safety</p>
            <h2 className="m-0 my-1 text-[36px] font-bold text-success">{(nivelCumplimiento / 10).toFixed(1)}</h2>
            <p className="text-[10px] text-content-2">Total Score</p>
          </div>
        </div>
      </div>
    </div>
  )
}
