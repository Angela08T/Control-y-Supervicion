import React, { useCallback, useEffect, useState } from 'react'
import { FiCheck, FiX } from 'react-icons/fi'
import { cn } from '@/utils/classes'

/**
 * Piezas de los formularios largos por pasos (nueva incidencia, vista previa del informe):
 * cabecera azul, indice lateral que sigue el scroll y tarjetas numeradas por seccion.
 */

/** Entrada del indice */
export interface StepInfo {
  id: string
  title: string
  icon: React.ReactNode
  /** Marca el paso como completo (check verde en el indice) */
  done?: boolean
}

/**
 * Seccion visible mientras se desplaza el formulario y funcion para saltar a una seccion.
 * Usa la ventana como raiz: el navegador ya descuenta lo que recorta el contenedor con scroll.
 */
export function useActiveStep(ids: string[]): [string, (id: string) => void] {
  const [active, setActive] = useState(ids[0] ?? '')
  const key = ids.join('|')

  useEffect(() => {
    const elements = ids.map(id => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
    if (elements.length === 0 || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-15% 0px -65% 0px' }
    )
    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const goTo = useCallback((id: string) => {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return [active, goTo]
}

/** Pastilla de dato dentro de la cabecera azul */
export const heroChip =
  'inline-flex max-w-full items-center gap-1.5 rounded-lg bg-white/12 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/20'

/** Cabecera azul del modal: icono, antetitulo, titulo, subtitulo y una fila de pastillas */
export function ModalHero({
  icon,
  eyebrow,
  title,
  subtitle,
  onClose,
  children,
}: {
  icon: React.ReactNode
  eyebrow: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  onClose: () => void
  /** Pastillas o barra de progreso bajo el titulo */
  children?: React.ReactNode
}) {
  return (
    <header className="relative shrink-0 overflow-hidden bg-[linear-gradient(135deg,#0a163d_0%,#14296b_55%,#1e3a8a_100%)] px-6 pt-5 pb-4 text-white max-sm:px-4 max-sm:pt-4">
      <span aria-hidden className="pointer-events-none absolute -top-20 -right-12 size-56 rounded-full bg-white/6" />
      <span aria-hidden className="pointer-events-none absolute right-40 -bottom-28 size-44 rounded-full bg-white/4" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-[22px] ring-1 ring-white/20 max-sm:hidden"
            aria-hidden
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-bold tracking-[0.14em] text-white/70 uppercase">{eyebrow}</p>
            <h3 className="m-0 mt-1 line-clamp-2 text-lg leading-snug font-bold text-white max-sm:text-base">{title}</h3>
            {subtitle && <p className="m-0 mt-1 truncate text-[13px] text-white/75">{subtitle}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none bg-white/10 p-0 text-lg text-white transition-colors hover:bg-white/20"
        >
          <FiX aria-hidden />
        </button>
      </div>
      {children && <div className="relative mt-4">{children}</div>}
    </header>
  )
}

/** Barra de progreso para la cabecera azul */
export function HeroProgress({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label="Pasos completos"
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#8ebc22,#b5e04a)] transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs font-semibold text-white/85 tabular-nums">
        {done} de {total} pasos
      </span>
    </div>
  )
}

/**
 * Cuerpo con indice: columna fija a la izquierda en escritorio; en movil y tablet el indice
 * pasa a una fila de pestañas que queda pegada arriba al desplazarse.
 */
export function StepLayout({
  steps,
  active,
  onSelect,
  aside,
  children,
}: {
  steps: StepInfo[]
  active: string
  onSelect: (id: string) => void
  /** Contenido extra bajo el indice (solo escritorio) */
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="z-10 border-line bg-surface max-lg:sticky max-lg:top-0 max-lg:border-b lg:border-r">
        <nav aria-label="Secciones" className="lg:sticky lg:top-0 lg:p-4">
          <p className="m-0 mb-2 px-2 text-[11px] font-bold tracking-[0.12em] text-muted uppercase max-lg:hidden">Secciones</p>
          <ol className="m-0 flex list-none gap-1 p-0 max-lg:overflow-x-auto max-lg:px-4 max-lg:py-2.5 lg:flex-col [&::-webkit-scrollbar]:hidden">
            {steps.map((s, i) => {
              const isActive = s.id === active
              return (
                <li key={s.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelect(s.id)}
                    aria-current={isActive ? 'step' : undefined}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-none px-2.5 py-2 text-left text-[13px] whitespace-nowrap transition-colors duration-150 max-lg:rounded-full max-lg:px-3 max-lg:py-1.5',
                      isActive
                        ? 'bg-primary/10 font-semibold text-primary dark:bg-primary/25 dark:text-accent-light'
                        : 'bg-transparent font-medium text-content-2 hover:bg-subtle hover:text-content'
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tabular-nums max-lg:size-4.5 max-lg:rounded-full max-lg:text-[10px]',
                        s.done
                          ? 'bg-success text-white'
                          : isActive
                            ? 'bg-primary text-white max-lg:hidden'
                            : 'bg-subtle text-muted max-lg:hidden'
                      )}
                      aria-hidden
                    >
                      {s.done ? <FiCheck /> : i + 1}
                    </span>
                    {s.title}
                    {s.done && <span className="sr-only"> (completo)</span>}
                  </button>
                </li>
              )
            })}
          </ol>
          {aside && <div className="mt-5 border-t border-line pt-4 max-lg:hidden">{aside}</div>}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-col gap-4 p-6 max-sm:gap-3 max-sm:p-3">{children}</div>
    </div>
  )
}

/** Tarjeta de una seccion: paso, icono, titulo y una linea de ayuda */
export function StepSection({
  id,
  n,
  title,
  description,
  icon,
  done,
  children,
}: {
  id: string
  n: number
  title: string
  description?: string
  icon: React.ReactNode
  done?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="flex min-w-0 scroll-mt-16 flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_var(--shadow)] max-sm:gap-3 max-sm:p-4 lg:scroll-mt-4"
    >
      <header className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary dark:bg-primary/25 dark:text-accent-light"
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[11px] font-bold tracking-[0.12em] text-muted uppercase">Paso {n}</p>
          <h4 id={`${id}-titulo`} className="m-0 text-[15px] leading-tight font-semibold text-content">
            {title}
          </h4>
          {description && <p className="m-0 mt-0.5 text-xs text-muted">{description}</p>}
        </div>
        {done && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 text-xs font-semibold text-lime-ink">
            <FiCheck aria-hidden />
            <span className="max-sm:sr-only">Completo</span>
          </span>
        )}
      </header>
      {children}
    </section>
  )
}
