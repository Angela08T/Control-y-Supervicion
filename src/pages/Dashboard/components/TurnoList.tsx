import React from 'react'
import { FiSun, FiCloud, FiMoon } from 'react-icons/fi'

export interface TurnoListProps {
  /** Conteo por turno: claves 'Mañana', 'Tarde' y 'Noche'. */
  data: Record<string, number>
}

export default function TurnoList({ data }: TurnoListProps) {
  const turnos = [
    { nombre: 'Mañana', icon: <FiSun />, cantidad: data['Mañana'] || 0 },
    { nombre: 'Tarde', icon: <FiCloud />, cantidad: data['Tarde'] || 0 },
    { nombre: 'Noche', icon: <FiMoon />, cantidad: data['Noche'] || 0 }
  ]

  const total = Object.values(data).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <div>
        <h3 className="m-0 text-[15px] font-semibold text-content">Incidencias por turno</h3>
        <p className="m-0 mt-0.5 text-xs text-muted">
          <span className="font-semibold text-success">+30%</span> este mes
        </p>
      </div>

      <div className="flex flex-col">
        {turnos.map((turno) => {
          const porcentaje = total > 0 ? Math.round((turno.cantidad / total) * 100) : 0

          return (
            <div key={turno.nombre} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
              <span className="flex size-4 shrink-0 items-center justify-center text-base text-muted" aria-hidden>
                {turno.icon}
              </span>
              <span className="flex-1 text-sm text-content">{turno.nombre}</span>
              <span className="text-base font-semibold text-content">{turno.cantidad}</span>
              <span className="w-10 text-right text-xs text-muted">{porcentaje}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
