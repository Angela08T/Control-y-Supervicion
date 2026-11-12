import React, { useEffect, useRef, useState } from 'react'
import { FiCalendar, FiChevronDown, FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi'
import Popover from '@/components/UI/Popover'
import { cn } from '@/utils/classes'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIAS_CORTOS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** 'YYYY-MM-DD' -> Date local (sin desfase de zona horaria) */
function parseISO(v?: string | null): Date | null {
  const m = v ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(v) : null
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}
const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const mismoDia = (a: Date | null, b: Date | null) => !!a && !!b && toISO(a) === toISO(b)
const inicioDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** Celdas de un mes empezando en lunes (null = hueco) */
function celdas(mes: Date): (Date | null)[] {
  const primero = new Date(mes.getFullYear(), mes.getMonth(), 1)
  const huecos = (primero.getDay() + 6) % 7
  const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const out: (Date | null)[] = Array.from({ length: huecos }, () => null)
  for (let d = 1; d <= total; d++) out.push(new Date(mes.getFullYear(), mes.getMonth(), d))
  while (out.length % 7) out.push(null)
  return out
}

/** Disparador comun: parece un campo, con icono y flecha */
const trigger = (open: boolean, invalid?: boolean, disabled?: boolean) =>
  cn(
    'flex h-[38px] w-full cursor-pointer items-center gap-2.5 rounded-lg border bg-surface px-3 text-left text-sm transition-[border-color,box-shadow] duration-150 outline-none',
    'focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]',
    open ? 'border-accent shadow-[0_0_0_3px_var(--focus-ring)]' : 'border-line-strong hover:border-line-hover',
    invalid && 'border-danger!',
    disabled && 'cursor-not-allowed bg-subtle opacity-70'
  )

const navBtn =
  'flex size-8 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-0 text-base text-content-2 transition-colors hover:bg-subtle hover:text-content disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent'

const pieBtn =
  'cursor-pointer rounded-lg border-none bg-transparent px-2.5 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/8 dark:text-accent-light dark:hover:bg-primary/20'

// ==================== Fecha ====================

export interface DatePickerProps {
  /** Fecha en formato 'YYYY-MM-DD' */
  value: string
  onChange: (value: string) => void
  /** Fecha maxima 'YYYY-MM-DD' (p. ej. hoy, para no registrar hechos futuros) */
  max?: string
  min?: string
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  'aria-label'?: string
}

/** Selector de fecha con calendario propio (lunes primero, hoy marcado, dias fuera de rango atenuados) */
export function DatePicker({ value, onChange, max, min, placeholder = 'Elige la fecha', invalid, disabled, ...aria }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const seleccion = parseISO(value)
  const hoy = inicioDia(new Date())
  const maxD = parseISO(max)
  const minD = parseISO(min)
  const [mes, setMes] = useState(() => {
    const base = seleccion ?? hoy
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const [foco, setFoco] = useState<Date>(seleccion ?? hoy)

  const fuera = (d: Date) => (!!maxD && d > maxD) || (!!minD && d < minD)

  const abrir = () => {
    if (disabled) return
    const base = seleccion ?? hoy
    setMes(new Date(base.getFullYear(), base.getMonth(), 1))
    setFoco(base)
    setOpen(true)
  }
  const elegir = (d: Date) => {
    if (fuera(d)) return
    onChange(toISO(d))
    setOpen(false)
    ref.current?.focus()
  }

  // El dia con foco se mantiene visible y enfocado al navegar con teclado
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => gridRef.current?.querySelector<HTMLElement>(`[data-dia="${toISO(foco)}"]`)?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open, foco])

  const moverFoco = (dias: number) => {
    const n = new Date(foco.getFullYear(), foco.getMonth(), foco.getDate() + dias)
    setFoco(n)
    if (n.getMonth() !== mes.getMonth() || n.getFullYear() !== mes.getFullYear()) setMes(new Date(n.getFullYear(), n.getMonth(), 1))
  }

  const mesSiguiente = new Date(mes.getFullYear(), mes.getMonth() + 1, 1)
  const puedeAvanzar = !maxD || mesSiguiente <= maxD
  const puedeRetroceder = !minD || new Date(mes.getFullYear(), mes.getMonth(), 0) >= minD

  const texto = seleccion
    ? `${DIAS[seleccion.getDay()].slice(0, 3)}, ${seleccion.getDate()} ${MESES[seleccion.getMonth()].slice(0, 3)} ${seleccion.getFullYear()}`
    : placeholder

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : abrir())}
        onKeyDown={e => {
          if (!open && e.key === 'ArrowDown') {
            e.preventDefault()
            abrir()
          }
        }}
        className={trigger(open, invalid, disabled)}
        {...aria}
      >
        <FiCalendar className={cn('shrink-0', open ? 'text-accent' : 'text-muted')} aria-hidden />
        <span className={cn('min-w-0 flex-1 truncate', seleccion ? 'font-medium text-content first-letter:uppercase' : 'text-muted')}>{texto}</span>
        <FiChevronDown className={cn('shrink-0 text-muted transition-transform duration-150', open && 'rotate-180 text-accent')} aria-hidden />
      </button>

      <Popover anchorRef={ref} open={open} onClose={() => setOpen(false)} width={300} maxHeight={420} role="dialog">
        <div className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" className={navBtn} aria-label="Mes anterior" disabled={!puedeRetroceder} onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>
              <FiChevronLeft />
            </button>
            <span className="text-sm font-bold text-content capitalize" aria-live="polite">
              {MESES[mes.getMonth()]} <span className="font-semibold text-content-2">{mes.getFullYear()}</span>
            </span>
            <button type="button" className={navBtn} aria-label="Mes siguiente" disabled={!puedeAvanzar} onClick={() => setMes(mesSiguiente)}>
              <FiChevronRight />
            </button>
          </div>

          <div className="grid grid-cols-7 rounded-lg bg-subtle py-1 text-center text-[11px] font-bold text-muted">
            {DIAS_CORTOS.map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div
            ref={gridRef}
            role="grid"
            className="mt-1 grid grid-cols-7 gap-0.5"
            onKeyDown={e => {
              const mapa: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
              if (e.key in mapa) {
                e.preventDefault()
                moverFoco(mapa[e.key])
              } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                elegir(foco)
              }
            }}
          >
            {celdas(mes).map((d, i) => {
              if (!d) return <span key={`h${i}`} />
              const sel = mismoDia(d, seleccion)
              const esHoy = mismoDia(d, hoy)
              const off = fuera(d)
              const finde = i % 7 >= 5
              return (
                <button
                  key={toISO(d)}
                  type="button"
                  data-dia={toISO(d)}
                  tabIndex={mismoDia(d, foco) ? 0 : -1}
                  disabled={off}
                  aria-pressed={sel}
                  aria-label={`${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`}
                  onClick={() => elegir(d)}
                  className={cn(
                    'mx-auto flex size-9 cursor-pointer items-center justify-center rounded-full border-none p-0 text-[13px] tabular-nums transition-[background-color,color,transform] duration-100 outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    sel
                      ? 'scale-105 bg-[linear-gradient(135deg,#1e3a8a,#2563eb)] font-bold text-white shadow-[0_6px_14px_-6px_rgba(30,58,138,0.8)]'
                      : cn('bg-transparent font-medium hover:bg-primary/10 hover:text-primary dark:hover:text-accent-light', finde ? 'text-content-2' : 'text-content'),
                    esHoy && !sel && 'font-bold text-primary ring-2 ring-primary/30 ring-inset dark:text-accent-light dark:ring-accent-light/40',
                    off && 'cursor-default font-normal text-muted opacity-35 hover:bg-transparent hover:text-muted'
                  )}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-line bg-subtle px-2 py-1.5">
          <button type="button" className={pieBtn} disabled={fuera(hoy)} onClick={() => elegir(hoy)}>
            Hoy
          </button>
          <button
            type="button"
            className={pieBtn}
            onClick={() => elegir(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1))}
          >
            Ayer
          </button>
        </div>
      </Popover>
    </>
  )
}

// ==================== Hora ====================

export interface TimePickerProps {
  /** Hora en formato 'HH:mm' */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  'aria-label'?: string
}

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

/** Columna desplazable de horas o minutos */
function TimeColumn({ titulo, items, actual, onPick }: { titulo: string; items: string[]; actual: string; onPick: (v: string) => void }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="py-1.5 text-center text-[11px] font-bold tracking-[0.08em] text-muted uppercase">{titulo}</span>
      <div role="listbox" aria-label={titulo} className="relative flex h-[216px] flex-col gap-0.5 overflow-y-auto pb-1 [scrollbar-width:thin]">
        {items.map(v => (
          <button
            key={v}
            type="button"
            role="option"
            aria-selected={v === actual}
            onClick={() => onPick(v)}
            className={cn(
              'mx-1 flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none text-[13px] tabular-nums transition-colors duration-100',
              v === actual
                ? 'bg-[linear-gradient(135deg,#1e3a8a,#2563eb)] font-bold text-white'
                : 'bg-transparent font-medium text-content hover:bg-primary/10 hover:text-primary dark:hover:text-accent-light'
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Selector de hora: dos columnas desplazables (horas y minutos) y un atajo "Ahora" */
export function TimePicker({ value, onChange, placeholder = 'Elige la hora', invalid, disabled, ...aria }: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement | null>(null)
  const colsRef = useRef<HTMLDivElement | null>(null)
  const m = /^(\d{2}):(\d{2})/.exec(value || '')
  const hh = m?.[1] ?? ''
  const mm = m?.[2] ?? ''

  // Al abrir, la hora y el minuto elegidos quedan centrados en su columna
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      // Se mueve solo la columna (scrollIntoView tambien desplazaria el modal de fondo)
      colsRef.current?.querySelectorAll<HTMLElement>('[aria-selected="true"]').forEach(el => {
        const col = el.parentElement
        if (col) col.scrollTop = el.offsetTop - col.clientHeight / 2 + el.clientHeight / 2
      })
    }, 0)
    return () => window.clearTimeout(t)
  }, [open])

  const set = (h: string, min: string) => onChange(`${h}:${min}`)
  const ahora = () => {
    const d = new Date()
    set(String(d.getHours()).padStart(2, '0'), String(d.getMinutes()).padStart(2, '0'))
    setOpen(false)
    ref.current?.focus()
  }

  function elegirMinuto(min: string) {
    set(hh || '00', min)
    setOpen(false)
    ref.current?.focus()
  }

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={trigger(open, invalid, disabled)}
        {...aria}
      >
        <FiClock className={cn('shrink-0', open ? 'text-accent' : 'text-muted')} aria-hidden />
        <span className={cn('min-w-0 flex-1 truncate tabular-nums', m ? 'font-medium text-content' : 'text-muted')}>
          {m ? `${hh}:${mm} h` : placeholder}
        </span>
        <FiChevronDown className={cn('shrink-0 text-muted transition-transform duration-150', open && 'rotate-180 text-accent')} aria-hidden />
      </button>

      <Popover anchorRef={ref} open={open} onClose={() => setOpen(false)} width={220} maxHeight={330} role="dialog">
        <div ref={colsRef} className="flex divide-x divide-line">
          <TimeColumn titulo="Hora" items={HORAS} actual={hh} onPick={h => set(h, mm || '00')} />
          <TimeColumn titulo="Min" items={MINUTOS} actual={mm} onPick={elegirMinuto} />
        </div>
        <div className="flex items-center justify-between border-t border-line bg-subtle px-2 py-1.5">
          <button type="button" className={pieBtn} onClick={ahora}>
            Ahora
          </button>
          <button
            type="button"
            className={pieBtn}
            onClick={() => {
              setOpen(false)
              ref.current?.focus()
            }}
          >
            Listo
          </button>
        </div>
      </Popover>
    </>
  )
}
