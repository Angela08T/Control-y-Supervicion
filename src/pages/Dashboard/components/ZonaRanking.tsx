import React from 'react'
import { TbMapPin } from 'react-icons/tb'
import { cardBase } from '../cardStyles'
import SectionHeader, { EmptyIllustration } from './SectionHeader'

export interface ZonaRankingProps {
  /** Jurisdicciones con su cantidad, ya ordenadas de mayor a menor */
  zonas: Array<{ nombre: string; total: number }>
  subtitle?: string
}

/** Top de jurisdicciones con mas incidencias, con una barra proporcional. */
export default function ZonaRanking({ zonas, subtitle }: ZonaRankingProps) {
  const max = Math.max(1, ...zonas.map((z) => z.total))

  return (
    <div className={`flex h-full flex-col p-5 ${cardBase}`}>
      <SectionHeader title="Zonas con más incidencias" subtitle={subtitle} icon={<TbMapPin />} color="#0f8a9a" />

      {zonas.length === 0 ? (
        <EmptyIllustration icon={<TbMapPin className="[stroke-width:1.3]" />} message="Sin incidencias en este periodo" />
      ) : (
        <ol className="m-0 mt-4 flex flex-1 list-none flex-col justify-around gap-2.5 p-0">
          {zonas.map(({ nombre, total }, i) => (
            <li key={nombre}>
              <div className="flex items-center gap-2.5 text-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-content" title={nombre}>{nombre}</span>
                <span className="text-[15px] font-bold text-ink tabular-nums dark:text-content">{total}</span>
              </div>
              <div className="mt-1.5 ml-[38px] h-2 overflow-hidden rounded-full bg-subtle">
                <div
                  className="h-full origin-left rounded-full bg-[#0e7490]"
                  style={{
                    width: `${(total / max) * 100}%`,
                    animation: `fillIn 900ms cubic-bezier(0.2, 0.7, 0.2, 1) ${i * 80}ms both`,
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
