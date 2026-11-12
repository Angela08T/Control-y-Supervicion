import React from 'react'
import { TbFileSearch, TbStack2 } from 'react-icons/tb'
import { ASUNTOS, nombreCorto } from '../asuntos'
import { cardBase } from '../cardStyles'
import SectionHeader, { EmptyIllustration } from './SectionHeader'

export interface AsuntoRankingProps {
  /** Conteo por asunto (nombre completo del asunto -> cantidad) */
  data: Record<string, number>
  subtitle?: string
}

/** Asuntos ordenados de mayor a menor con una barra proporcional; reemplaza al radar. */
export default function AsuntoRanking({ data, subtitle }: AsuntoRankingProps) {
  const filas = Object.entries(data)
    .map(([asunto, cantidad]) => ({ asunto, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
  const max = Math.max(1, ...filas.map((f) => f.cantidad))
  const total = filas.reduce((a, f) => a + f.cantidad, 0)

  return (
    <div className={`flex h-full flex-col p-5 ${cardBase}`}>
      <SectionHeader title="Incidencias por asunto" subtitle={subtitle} icon={<TbStack2 />} color="#d20b80" />

      {total === 0 ? (
        <EmptyIllustration icon={<TbFileSearch className="[stroke-width:1.3]" />} message="Sin incidencias en este periodo" />
      ) : (
        <ul className="m-0 mt-4 flex flex-1 list-none flex-col justify-around gap-3 p-0">
          {filas.map(({ asunto, cantidad }, i) => {
            const color = ASUNTOS[asunto]?.color ?? 'var(--primary)'
            return (
              <li key={asunto} title={asunto}>
                <div className="flex items-center gap-2.5 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate font-medium text-content">{nombreCorto(asunto)}</span>
                  <span className="text-[15px] font-bold text-ink tabular-nums dark:text-content">{cantidad}</span>
                </div>
                <div className="mt-1.5 ml-5 h-2 overflow-hidden rounded-full bg-subtle">
                  <div
                    className="h-full origin-left rounded-full"
                    style={{
                      width: `${(cantidad / max) * 100}%`,
                      background: color,
                      animation: `fillIn 900ms cubic-bezier(0.2, 0.7, 0.2, 1) ${i * 80}ms both`,
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
