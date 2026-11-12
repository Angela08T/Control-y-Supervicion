import React from 'react'
import { TbClock, TbMoon, TbSunHigh, TbSunset2 } from 'react-icons/tb'
import { useCountUp } from '@/hooks/useCountUp'
import { cardBase } from '../cardStyles'
import SectionHeader, { HeaderTotal } from './SectionHeader'

export interface TurnoListProps {
  /** Conteo por turno: claves 'Mañana', 'Tarde' y 'Noche'. */
  data: Record<string, number>
  /** Texto bajo el titulo (por ejemplo el periodo filtrado) */
  subtitle?: string
}

/** Recuadro de un turno: icono y nombre, cantidad que cuenta y su porcentaje. */
function TurnoStat({ nombre, icon, color, cantidad, porcentaje }: { nombre: string; icon: React.ReactNode; color: string; cantidad: number; porcentaje: number }) {
  const shown = useCountUp(cantidad)
  return (
    <div className="min-w-0 rounded-2xl bg-[#eef3fb] px-4 py-3.5 dark:bg-subtle">
      <div className="flex items-center gap-2 text-[15px] font-medium text-ink dark:text-content">
        <span className="flex text-[24px]" style={{ color }} aria-hidden>
          {icon}
        </span>
        {nombre}
      </div>
      <div className="mt-2 flex items-baseline gap-2.5">
        <span className="text-[28px] leading-none font-bold text-ink tabular-nums dark:text-content">{shown}</span>
        <span className="text-[15px] font-semibold text-ink/80 tabular-nums dark:text-content-2">{porcentaje}%</span>
      </div>
    </div>
  )
}

/** Tres recuadros, uno por turno, con su cantidad y porcentaje del total. */
export default function TurnoList({ data, subtitle }: TurnoListProps) {
  const turnos = [
    { nombre: 'Mañana', icon: <TbSunHigh />, color: '#2f62d8', cantidad: data['Mañana'] || 0 },
    { nombre: 'Tarde', icon: <TbSunset2 />, color: '#f59e0b', cantidad: data['Tarde'] || 0 },
    { nombre: 'Noche', icon: <TbMoon />, color: '#1e3a8a', cantidad: data['Noche'] || 0 },
  ]

  const total = turnos.reduce((a, t) => a + t.cantidad, 0)
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

  return (
    <div className={`flex h-full flex-col p-5 ${cardBase}`}>
      <SectionHeader
        title="Incidencias por turno"
        subtitle={subtitle}
        icon={<TbClock />}
        color="#2f62d8"
        right={<HeaderTotal value={total} label="en total" />}
      />

      <div className="mt-4 grid flex-1 grid-cols-3 items-center gap-3 max-sm:grid-cols-1">
        {turnos.map((t) => (
          <TurnoStat key={t.nombre} {...t} porcentaje={pct(t.cantidad)} />
        ))}
      </div>
    </div>
  )
}
