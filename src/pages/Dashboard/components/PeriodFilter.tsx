import React from 'react'
import { FiCalendar } from 'react-icons/fi'
import { cn } from '@/utils/classes'

export type PeriodPreset = 'hoy' | '7D' | '15D' | '30D' | 'mes' | 'custom'

export interface Periodo {
  preset: PeriodPreset
  /** Inicio del dia de la primera fecha (hora local) */
  start: Date
  /** Fin del dia de la ultima fecha (hora local) */
  end: Date
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

/** Calcula el rango de un atajo, contando el dia de hoy */
export function periodoDesde(preset: Exclude<PeriodPreset, 'custom'>, hoy = new Date()): Periodo {
  const end = endOfDay(hoy)
  const start = startOfDay(hoy)
  if (preset === '7D') start.setDate(start.getDate() - 6)
  if (preset === '15D') start.setDate(start.getDate() - 14)
  if (preset === '30D') start.setDate(start.getDate() - 29)
  if (preset === 'mes') start.setDate(1)
  return { preset, start, end }
}

/** Rango personalizado: de inicio del primer dia a fin del ultimo */
export function periodoPersonalizado(start: Date, end: Date): Periodo {
  return { preset: 'custom', start: startOfDay(start), end: endOfDay(end) }
}

/** Fecha local en formato YYYY-MM-DD (sin pasar por UTC, que adelanta un dia por la noche en Peru) */
export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "6 oct – 4 nov 2026", o "11 nov 2026" si es un solo dia */
export function etiquetaPeriodo({ start, end }: Periodo): string {
  const dia = (d: Date) => `${d.getDate()} ${MESES[d.getMonth()]}`
  if (toISODate(start) === toISODate(end)) return `${dia(start)} ${start.getFullYear()}`
  const anioInicio = start.getFullYear() !== end.getFullYear() ? ` ${start.getFullYear()}` : ''
  return `${dia(start)}${anioInicio} – ${dia(end)} ${end.getFullYear()}`
}

const ATAJOS: Array<{ preset: Exclude<PeriodPreset, 'custom'>; label: string }> = [
  { preset: 'hoy', label: 'Hoy' },
  { preset: '7D', label: '7 días' },
  { preset: '15D', label: '15 días' },
  { preset: '30D', label: '30 días' },
  { preset: 'mes', label: 'Este mes' },
]

export interface PeriodFilterProps {
  periodo: Periodo
  onChange: (periodo: Periodo) => void
  /** Abre el selector de fechas personalizado */
  onCustom: () => void
  className?: string
  /** 'inline': sin tarjeta propia, para ir en la linea del titulo */
  variant?: 'card' | 'inline'
}

/** Barra de periodo del inicio: un solo filtro para toda la pagina */
export default function PeriodFilter({ periodo, onChange, onCustom, className, variant = 'card' }: PeriodFilterProps) {
  const pill =
    'h-9 cursor-pointer whitespace-nowrap rounded-lg border-none px-3.5 text-[13px] font-medium transition-colors duration-150'

  if (variant === 'inline') {
    const small = 'h-10 cursor-pointer whitespace-nowrap rounded-full border-none px-4 text-[13.5px] font-medium transition-colors duration-150'
    const on = 'bg-[#14296b] font-semibold text-white shadow-[0_6px_14px_-6px_rgba(20,41,107,0.8)] dark:bg-primary'
    const off = 'bg-transparent text-ink hover:bg-[#eef3fb] dark:text-content-2 dark:hover:bg-subtle dark:hover:text-content'
    return (
      <div className={cn('flex flex-col items-end gap-2 max-md:items-start', className)}>
        <p className="m-0 text-[14px] text-ink dark:text-content-2">
          Periodo: <span className="font-bold text-ink dark:text-content">{etiquetaPeriodo(periodo)}</span>
        </p>
        <div role="group" aria-label="Periodo" className="flex flex-wrap items-center gap-0.5 rounded-full border border-[#e3e9f4] bg-surface p-1 shadow-[0_1px_2px_rgba(12,26,75,0.05),0_10px_24px_-14px_rgba(12,26,75,0.3)] dark:border-line">
          {ATAJOS.map(({ preset, label }) => (
            <button
              key={preset}
              type="button"
              aria-pressed={periodo.preset === preset}
              onClick={() => onChange(periodoDesde(preset))}
              className={cn(small, periodo.preset === preset ? on : off)}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={periodo.preset === 'custom'}
            onClick={onCustom}
            className={cn(small, 'inline-flex items-center gap-1.5', periodo.preset === 'custom' ? on : off)}
          >
            <FiCalendar aria-hidden />
            Personalizado
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-18px_rgba(30,58,138,0.25)]',
        className
      )}
    >
      <div className="min-w-0">
        <p className="m-0 text-[12px] font-medium tracking-[0.04em] text-muted uppercase">Periodo</p>
        <p className="m-0 mt-0.5 text-[15px] font-semibold text-content">{etiquetaPeriodo(periodo)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Atajos de periodo" className="inline-flex flex-wrap gap-0.5 rounded-xl bg-subtle p-1">
          {ATAJOS.map(({ preset, label }) => {
            const active = periodo.preset === preset
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(periodoDesde(preset))}
                className={cn(
                  pill,
                  active
                    ? 'bg-primary text-btn shadow-[0_4px_10px_-4px_rgba(30,58,138,0.6)]'
                    : 'bg-transparent text-content-2 hover:bg-surface hover:text-content'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          aria-pressed={periodo.preset === 'custom'}
          onClick={onCustom}
          className={cn(
            pill,
            'inline-flex items-center gap-2 border border-solid',
            periodo.preset === 'custom'
              ? 'border-primary bg-primary text-btn'
              : 'border-line-strong bg-surface text-content-2 hover:bg-subtle hover:text-content'
          )}
        >
          <FiCalendar aria-hidden />
          Personalizado
        </button>
      </div>
    </div>
  )
}
