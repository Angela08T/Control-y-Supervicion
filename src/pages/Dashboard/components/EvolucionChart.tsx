import React, { useId, useState } from 'react'
import { TbTrendingUp } from 'react-icons/tb'
import { cardBase } from '../cardStyles'
import SectionHeader, { HeaderTotal } from './SectionHeader'

export interface EvolucionChartProps {
  subtitle?: string
  /** Etiqueta del dia ("13/10") y cantidad, en orden */
  puntos: Array<{ label: string; total: number }>
}

/**
 * Area de incidencias por dia. Ocupa todo el alto que le da su fila (asi queda a la par
 * de la tarjeta de asuntos) y muestra el dia y la cantidad al pasar el mouse.
 */
export default function EvolucionChart({ subtitle, puntos }: EvolucionChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  const gradId = useId()

  const n = puntos.length
  // Tope del eje: multiplo de 4 para que las marcas sean enteros distintos
  const max = Math.max(4, Math.ceil(Math.max(0, ...puntos.map((p) => p.total)) / 4) * 4)
  const x = (i: number) => (n > 1 ? (i / (n - 1)) * 100 : 50)
  const y = (v: number) => 100 - (v / max) * 100
  const linea = puntos.map((p, i) => `${x(i).toFixed(2)},${y(p.total).toFixed(2)}`).join(' ')
  const area = n > 1 ? `M0,100 L${linea.split(' ').join(' L')} L100,100 Z` : ''
  const marcas = [4, 3, 2, 1, 0].map((k) => (max / 4) * k)

  // Unas 6 fechas en el eje X, siempre con la ultima
  const paso = Math.max(1, Math.ceil(n / 6))
  const fechas = puntos.map((p, i) => ({ ...p, i })).filter(({ i }) => i === n - 1 || (i % paso === 0 && n - 1 - i >= paso / 2))

  const total = puntos.reduce((a, p) => a + p.total, 0)
  const actual = hover !== null ? puntos[hover] : null

  return (
    <div className={`flex h-full min-h-[300px] flex-col p-5 ${cardBase}`}>
      <SectionHeader
        title="Evolución de incidencias"
        subtitle={subtitle}
        icon={<TbTrendingUp />}
        color="#14296b"
        right={<HeaderTotal value={total} label="en el periodo" />}
      />

      <div className="mt-3 flex min-h-[200px] flex-1 gap-3">
        {/* Eje Y */}
        <div className="flex flex-col justify-between pb-6 text-right text-[13px] leading-none font-medium text-ink dark:text-content tabular-nums">
          {marcas.map((m) => (
            <span key={m} className="-my-1">{m}</span>
          ))}
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="relative flex-1" onMouseLeave={() => setHover(null)}>
            {/* Lineas guia */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden>
              {marcas.map((m) => (
                <span key={m} className="block h-px bg-line" />
              ))}
            </div>
            {/* Guias verticales en las fechas del eje X */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              {fechas.map(({ label, i }) => (
                <span key={label} className="absolute top-0 bottom-0 w-px bg-line" style={{ left: `${x(i)}%` }} />
              ))}
            </div>

            {n > 1 && (
              <svg className="absolute inset-0 block size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={area} fill={`url(#${gradId})`} />
                <polyline
                  points={linea}
                  fill="none"
                  className="stroke-[#14296b] dark:stroke-[#93c5fd]"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            )}

            {/* Puntos en las fechas del eje X */}
            {n > 1 &&
              fechas.map(({ label, i, total }) => (
                <span
                  key={label}
                  aria-hidden
                  className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#14296b] ring-2 ring-surface dark:bg-accent-light"
                  style={{ left: `${x(i)}%`, top: `${y(total)}%` }}
                />
              ))}

            {/* Punto y guia del dia senalado */}
            {actual && hover !== null && (
              <>
                <span className="pointer-events-none absolute top-0 bottom-0 w-px bg-line-strong" style={{ left: `${x(hover)}%` }} aria-hidden />
                <span
                  className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-primary shadow"
                  style={{ left: `${x(hover)}%`, top: `${y(actual.total)}%` }}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg bg-content px-2.5 py-1.5 text-xs whitespace-nowrap text-surface shadow-lg"
                  style={{ left: `${Math.min(92, Math.max(8, x(hover)))}%`, top: `${y(actual.total)}%` }}
                >
                  <strong className="tabular-nums">{actual.total}</strong> {actual.total === 1 ? 'incidencia' : 'incidencias'} · {actual.label}
                </div>
              </>
            )}

            {/* Zonas invisibles para el mouse, una por dia */}
            <div className="absolute inset-0 flex">
              {puntos.map((p, i) => (
                <span key={p.label} className="h-full flex-1" onMouseEnter={() => setHover(i)} />
              ))}
            </div>
          </div>

          {/* Eje X */}
          <div className="relative mt-2 h-4 text-[13px] font-medium text-ink dark:text-content">
            {fechas.map(({ label, i }) => (
              <span
                key={label}
                className="absolute whitespace-nowrap"
                style={{ left: `${x(i)}%`, translate: i === n - 1 ? '-100%' : i === 0 ? '0' : '-50%' }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
