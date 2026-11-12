import React, { useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiArrowRight, FiCalendar, FiX, FiCheck, FiRotateCcw } from 'react-icons/fi'
import { cn } from '@/utils/classes'

export interface DateRangeModalProps {
  onClose: () => void
  /** Recibe null, null al limpiar el filtro. */
  onApply: (start: Date | null, end: Date | null) => void
  /** Rango con el que abre (por ejemplo el periodo personalizado activo) */
  initialStart?: Date | null
  initialEnd?: Date | null
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
// La semana empieza el lunes
const ENCABEZADO = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

/** Fecha sin hora (medianoche local) */
const dia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const mismoDia = (a: Date | null, b: Date | null) => !!a && !!b && a.getTime() === b.getTime()
const sumarMeses = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1)
const fechaCorta = (d: Date) => `${d.getDate()} ${MESES_CORTOS[d.getMonth()]} ${d.getFullYear()}`
const diasEntre = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000) + 1

/** Celdas de un mes: null para los huecos antes del dia 1 (semana de lunes a domingo) */
function celdasDelMes(mes: Date): (Date | null)[] {
  const primero = new Date(mes.getFullYear(), mes.getMonth(), 1)
  const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const huecos = (primero.getDay() + 6) % 7
  return [
    ...Array<null>(huecos).fill(null),
    ...Array.from({ length: total }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1)),
  ]
}

const ATAJOS: Array<{ label: string; rango: (hoy: Date) => [Date, Date] }> = [
  { label: 'Últimos 7 días', rango: (h) => [new Date(h.getFullYear(), h.getMonth(), h.getDate() - 6), h] },
  { label: 'Últimos 15 días', rango: (h) => [new Date(h.getFullYear(), h.getMonth(), h.getDate() - 14), h] },
  { label: 'Últimos 30 días', rango: (h) => [new Date(h.getFullYear(), h.getMonth(), h.getDate() - 29), h] },
  { label: 'Este mes', rango: (h) => [new Date(h.getFullYear(), h.getMonth(), 1), h] },
  { label: 'Mes anterior', rango: (h) => [new Date(h.getFullYear(), h.getMonth() - 1, 1), new Date(h.getFullYear(), h.getMonth(), 0)] },
  { label: 'Este año', rango: (h) => [new Date(h.getFullYear(), 0, 1), h] },
]

/**
 * Selector de periodo personalizado: panel azul con atajos y resumen a la izquierda,
 * dos meses a la derecha. El primer clic marca el inicio y el segundo el fin.
 */
export default function DateRangeModal({ onClose, onApply, initialStart = null, initialEnd = null }: DateRangeModalProps) {
  const hoy = dia(new Date())
  const [inicio, setInicio] = useState<Date | null>(initialStart ? dia(initialStart) : null)
  const [fin, setFin] = useState<Date | null>(initialEnd ? dia(initialEnd) : null)
  const [hover, setHover] = useState<Date | null>(null)
  // Mes de la izquierda; el de la derecha es el siguiente. Por defecto, el actual queda a la derecha
  const [mesBase, setMesBase] = useState(() => sumarMeses(initialEnd ?? hoy, -1))

  // Escape cierra y la pagina de fondo no se desplaza mientras esta abierto
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const eligiendoFin = !!inicio && !fin
  // Mientras se elige el fin, el rango se previsualiza hasta el dia bajo el mouse
  const finVisible = fin ?? (eligiendoFin && hover && hover >= inicio ? hover : null)

  const elegir = (d: Date) => {
    if (!inicio || fin || d < inicio) {
      setInicio(d)
      setFin(null)
    } else {
      setFin(d)
    }
  }

  const aplicarAtajo = (label: string) => {
    const atajo = ATAJOS.find((a) => a.label === label)
    if (!atajo) return
    const [a, b] = atajo.rango(hoy)
    setInicio(a)
    setFin(b)
    setMesBase(sumarMeses(b, -1))
  }

  const atajoActivo =
    inicio && fin
      ? ATAJOS.find((a) => {
          const [x, y] = a.rango(hoy)
          return mismoDia(x, inicio) && mismoDia(y, fin)
        })?.label
      : undefined

  const puedeAvanzar = sumarMeses(mesBase, 1) < new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const flecha =
    'flex size-9 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface text-lg text-content-2 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary dark:hover:text-accent-light disabled:cursor-default disabled:opacity-30 disabled:hover:border-line disabled:hover:bg-surface disabled:hover:text-content-2'

  const renderMes = (mes: Date, lado: 'izq' | 'der') => (
    <div className="min-w-0 flex-1">
      <div className="mb-3 flex items-center justify-between">
        {lado === 'izq' ? (
          <button type="button" aria-label="Mes anterior" onClick={() => setMesBase(sumarMeses(mesBase, -1))} className={flecha}>
            <FiChevronLeft />
          </button>
        ) : (
          <span className="size-9" />
        )}
        <span className="text-base font-bold text-ink capitalize dark:text-content">
          {MESES[mes.getMonth()]} <span className="font-semibold text-content-2">{mes.getFullYear()}</span>
        </span>
        {/* En la vista de dos meses la flecha "siguiente" va solo en el de la derecha */}
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => setMesBase(sumarMeses(mesBase, 1))}
          disabled={!puedeAvanzar}
          className={cn(flecha, lado === 'izq' && 'invisible max-sm:visible')}
        >
          <FiChevronRight />
        </button>
      </div>

      <div className="grid grid-cols-7 rounded-lg bg-subtle py-1.5 text-center text-xs font-bold text-content-2">
        {ENCABEZADO.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-y-1" onMouseLeave={() => setHover(null)}>
        {celdasDelMes(mes).map((d, i) => {
          if (!d) return <span key={`h${i}`} />
          const futuro = d > hoy
          const esInicio = mismoDia(d, inicio)
          const esFin = mismoDia(d, finVisible)
          const dentro = !!inicio && !!finVisible && d > inicio && d < finVisible
          const extremo = esInicio || esFin
          const conRango = !!inicio && !!finVisible && !mismoDia(inicio, finVisible)
          const col = i % 7
          const finDeSemana = col >= 5
          return (
            <div
              key={d.getTime()}
              className={cn(
                'relative flex h-10 items-center justify-center',
                // Banda del rango: une los dias; se redondea al inicio/fin de cada semana
                dentro && 'bg-primary/12',
                dentro && col === 0 && 'rounded-l-full',
                dentro && col === 6 && 'rounded-r-full',
                conRango && esInicio && 'bg-[linear-gradient(90deg,transparent_50%,color-mix(in_srgb,var(--primary)_12%,transparent)_50%)]',
                conRango && esFin && 'bg-[linear-gradient(90deg,color-mix(in_srgb,var(--primary)_12%,transparent)_50%,transparent_50%)]'
              )}
            >
              <button
                type="button"
                disabled={futuro}
                onClick={() => elegir(d)}
                onMouseEnter={() => setHover(d)}
                aria-pressed={extremo}
                aria-label={`${DIAS[d.getDay()]} ${fechaCorta(d)}`}
                className={cn(
                  'relative z-1 flex size-10 cursor-pointer items-center justify-center rounded-full border-none text-sm tabular-nums transition-[background-color,color,transform] duration-100',
                  extremo
                    ? 'scale-105 bg-[linear-gradient(135deg,#1e3a8a,#2563eb)] font-bold text-white shadow-[0_8px_16px_-6px_rgba(30,58,138,0.75)]'
                    : dentro
                      ? 'bg-transparent font-semibold text-primary hover:bg-primary/15 dark:text-accent-light'
                      : cn('bg-transparent font-medium hover:bg-primary/8 hover:text-primary dark:hover:text-accent-light', finDeSemana ? 'text-content-2' : 'text-ink dark:text-content'),
                  mismoDia(d, hoy) && !extremo && 'ring-2 ring-primary/35 ring-inset',
                  futuro && 'cursor-default font-normal text-muted opacity-35 hover:bg-transparent hover:text-muted'
                )}
              >
                {d.getDate()}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )

  // Caja "Desde" / "Hasta": resalta la que se va a elegir con el proximo clic
  const caja = (titulo: string, valor: Date | null, activa: boolean) => (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center gap-3 rounded-2xl border-2 px-3.5 py-2.5 transition-[border-color,background-color,box-shadow] duration-150',
        activa ? 'border-primary bg-primary/5 shadow-[0_0_0_4px_rgba(30,58,138,0.08)]' : 'border-line bg-surface'
      )}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl text-lg',
          valor ? 'bg-primary text-white' : 'bg-subtle text-muted'
        )}
        aria-hidden
      >
        <FiCalendar />
      </span>
      <div className="min-w-0">
        <p className="m-0 text-xs font-bold tracking-wide text-content-2 uppercase">{titulo}</p>
        <p className={cn('m-0 mt-0.5 truncate text-[15px] font-bold', valor ? 'text-ink dark:text-content' : 'font-medium text-muted')}>
          {valor ? fechaCorta(valor) : 'Elige una fecha'}
        </p>
        {valor && <p className="m-0 text-xs text-content-2 capitalize">{DIAS[valor.getDay()]}</p>}
      </div>
    </div>
  )

  const nDias = inicio && fin ? diasEntre(inicio, fin) : 0

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[rgba(10,22,61,0.55)] p-4 backdrop-blur-[2px] animate-[fadeInSoft_0.15s_ease-out]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="periodo-titulo"
        className="flex max-h-[calc(100vh-32px)] w-full max-w-[900px] overflow-hidden rounded-3xl bg-surface shadow-[0_30px_80px_-20px_rgba(10,22,61,0.6)] animate-[popIn_0.18s_ease-out] max-md:flex-col max-md:overflow-y-auto"
      >
        {/* Panel azul: titulo, atajos y resumen */}
        <aside className="relative flex w-[240px] shrink-0 flex-col overflow-hidden bg-[linear-gradient(160deg,#0a163d_0%,#14296b_55%,#1e3a8a_100%)] p-6 text-white max-md:w-auto max-md:p-5">
          <span aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-white/5" />
          <span aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 size-52 rounded-full bg-[#60a5fa]/10" />

          <div className="relative flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white/12 text-xl ring-1 ring-white/20" aria-hidden>
              <FiCalendar />
            </span>
            <div>
              <h3 id="periodo-titulo" className="m-0 text-lg leading-tight font-bold">Periodo</h3>
              <p className="m-0 text-[13px] text-white/70">personalizado</p>
            </div>
            {/* En pantallas chicas la X va arriba, en el panel azul */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="ml-auto hidden size-9 cursor-pointer items-center justify-center rounded-xl border-none bg-white/10 text-xl text-white transition-colors hover:bg-white/20 max-md:flex"
            >
              <FiX />
            </button>
          </div>

          <p className="relative m-0 mt-6 mb-2 text-xs font-bold tracking-[0.12em] text-white/60 uppercase">Atajos</p>
          <div className="relative flex flex-col gap-1 max-md:flex-row max-md:flex-wrap">
            {ATAJOS.map(({ label }) => {
              const activo = atajoActivo === label
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => aplicarAtajo(label)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-2 rounded-xl border-none px-3 py-2.5 text-left text-sm font-semibold transition-colors',
                    activo ? 'bg-white text-primary shadow-[0_8px_18px_-8px_rgba(0,0,0,0.5)]' : 'bg-transparent text-white/85 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {label}
                  {activo && <FiCheck aria-hidden />}
                </button>
              )
            })}
          </div>

          {/* Resumen del rango */}
          <div className="relative mt-auto rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 max-md:mt-4">
            <p className="m-0 text-xs font-semibold text-white/65">Seleccionado</p>
            {nDias > 0 && inicio && fin ? (
              <>
                <p className="m-0 mt-1 text-[30px] leading-none font-bold tabular-nums">
                  {nDias} <span className="text-base font-semibold text-white/80">{nDias === 1 ? 'día' : 'días'}</span>
                </p>
                <p className="m-0 mt-1.5 text-[13px] text-white/75">
                  {fechaCorta(inicio)} – {fechaCorta(fin)}
                </p>
              </>
            ) : (
              <p className="m-0 mt-1 text-sm font-medium text-white/85">
                {eligiendoFin ? 'Ahora elige el día de fin' : 'Elige el día de inicio'}
              </p>
            )}
          </div>
        </aside>

        {/* Calendario */}
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start gap-3 px-6 pt-5 max-md:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 max-sm:flex-col max-sm:items-stretch">
              {caja('Desde', inicio, !inicio || !!fin)}
              <FiArrowRight className="shrink-0 text-xl text-primary/50 dark:text-accent-light/50 max-sm:hidden" aria-hidden />
              {caja('Hasta', fin, eligiendoFin)}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-mr-2 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none bg-transparent text-xl text-content-2 transition-colors hover:bg-subtle hover:text-ink dark:hover:text-content max-md:hidden"
            >
              <FiX />
            </button>
          </div>

          {/* Dos meses (uno en pantallas chicas) */}
          <div className="flex gap-7 px-6 pt-5 pb-5 max-md:px-4">
            <div className="flex-1 max-sm:hidden">{renderMes(mesBase, 'izq')}</div>
            <div className="hidden flex-1 max-sm:block">{renderMes(sumarMeses(mesBase, 1), 'izq')}</div>
            <div className="flex-1 max-sm:hidden">{renderMes(sumarMeses(mesBase, 1), 'der')}</div>
          </div>

          <footer className="mt-auto flex flex-wrap items-center gap-3 border-t border-line bg-subtle px-6 py-4 max-md:px-4">
            <button
              type="button"
              onClick={() => onApply(null, null)}
              className="mr-auto inline-flex cursor-pointer items-center gap-2 rounded-xl border-none bg-transparent px-3 py-2 text-sm font-semibold text-content-2 transition-colors hover:bg-surface hover:text-danger"
            >
              <FiRotateCcw aria-hidden />
              Limpiar filtro
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold text-content transition-colors hover:bg-card-hover"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!inicio || !fin}
              onClick={() => inicio && fin && onApply(inicio, fin)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-none bg-[linear-gradient(135deg,#1e3a8a,#2563eb)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_20px_-10px_rgba(30,58,138,0.9)] transition-[transform,opacity] hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              <FiCheck aria-hidden />
              Aplicar periodo
            </button>
          </footer>
        </section>
      </div>
    </div>
  )
}
