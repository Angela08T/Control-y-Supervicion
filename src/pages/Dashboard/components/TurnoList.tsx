import React from 'react'
import { FiSun, FiCloud, FiMoon } from 'react-icons/fi'
import { useCountUp } from '@/hooks/useCountUp'

export interface TurnoListProps {
  /** Conteo por turno: claves 'Mañana', 'Tarde' y 'Noche'. */
  data: Record<string, number>
}

/** Fila de un turno: icono con su color, cantidad que cuenta y una barra que se llena. */
function TurnoRow({
  nombre,
  icon,
  color,
  cantidad,
  porcentaje,
  index,
}: {
  nombre: string
  icon: React.ReactNode
  color: string
  cantidad: number
  porcentaje: number
  index: number
}) {
  const shown = useCountUp(cantidad)
  return (
    <div className="border-b border-line py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-base"
          style={{ backgroundColor: `${color}24`, color }}
          aria-hidden
        >
          {icon}
        </span>
        <span className="flex-1 text-sm font-medium text-content">{nombre}</span>
        <span className="text-base font-semibold text-content tabular-nums">{shown}</span>
        <span className="w-10 text-right text-xs text-muted tabular-nums">{porcentaje}%</span>
      </div>
      <div className="mt-2 ml-11 h-1.5 overflow-hidden rounded-full bg-subtle">
        <div
          className="h-full origin-left rounded-full"
          style={{
            width: `${porcentaje}%`,
            background: color,
            animation: `fillIn 900ms cubic-bezier(0.2, 0.7, 0.2, 1) ${index * 120}ms both`,
          }}
        />
      </div>
    </div>
  )
}

export default function TurnoList({ data }: TurnoListProps) {
  const turnos = [
    { nombre: 'Mañana', icon: <FiSun />, color: '#60a5fa', cantidad: data['Mañana'] || 0 },
    { nombre: 'Tarde', icon: <FiCloud />, color: '#2563eb', cantidad: data['Tarde'] || 0 },
    { nombre: 'Noche', icon: <FiMoon />, color: '#1e3a8a', cantidad: data['Noche'] || 0 }
  ]

  const total = Object.values(data).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
      <div>
        <h3 className="m-0 text-[15px] font-semibold text-content">Incidencias por turno</h3>
        <p className="m-0 mt-0.5 text-xs text-muted">
          <span className="font-semibold text-lime-ink">+30%</span> este mes
        </p>
      </div>

      <div className="flex flex-col">
        {turnos.map((turno, index) => (
          <TurnoRow
            key={turno.nombre}
            nombre={turno.nombre}
            icon={turno.icon}
            color={turno.color}
            cantidad={turno.cantidad}
            porcentaje={total > 0 ? Math.round((turno.cantidad / total) * 100) : 0}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}
