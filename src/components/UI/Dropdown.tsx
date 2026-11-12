import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { FiCheck, FiChevronDown, FiLoader, FiSearch } from 'react-icons/fi'
import Popover from '@/components/UI/Popover'
import { cn } from '@/utils/classes'

export interface DropdownOption {
  value: string
  label: string
  /** Segunda linea en gris (cargo, detalle) */
  description?: string
  /** Punto de color a la izquierda (p. ej. el color del asunto) */
  color?: string
  icon?: React.ReactNode
}

export interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  loading?: boolean
  /** Muestra un buscador arriba de la lista (por defecto, con mas de 7 opciones) */
  searchable?: boolean
  emptyText?: string
  /** Icono fijo a la izquierda del disparador */
  icon?: React.ReactNode
  'aria-label'?: string
  className?: string
}

/** Quita tildes y pasa a minusculas para buscar sin importar acentos */
const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Lista desplegable con el estilo del sistema: panel flotante, buscador, puntos de color,
 * descripcion por opcion y navegacion con teclado (flechas, Enter, Escape, escribir para buscar).
 */
export default function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Selecciona',
  disabled,
  invalid,
  loading,
  searchable,
  emptyText = 'Sin opciones',
  icon,
  className,
  ...aria
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const listId = useId()

  const conBuscador = searchable ?? options.length > 7
  const selected = options.find(o => o.value === value)

  const visibles = useMemo(() => {
    const q = normalizar(query.trim())
    if (!q) return options
    return options.filter(o => normalizar(`${o.label} ${o.description ?? ''}`).includes(q))
  }, [options, query])

  const abrir = () => {
    if (disabled || loading) return
    setQuery('')
    setActive(Math.max(0, options.findIndex(o => o.value === value)))
    setOpen(true)
  }
  const cerrar = () => setOpen(false)
  const elegir = (o: DropdownOption) => {
    onChange(o.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  // Al abrir: foco en el buscador y la opcion activa a la vista
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      if (conBuscador) searchRef.current?.focus()
      listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
    }, 0)
    return () => window.clearTimeout(t)
  }, [open, conBuscador])

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const mover = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(i => Math.min(visibles.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(i => Math.max(0, i - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActive(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActive(visibles.length - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const o = visibles[active]
      if (o) elegir(o)
    } else if (e.key === 'Tab') {
      cerrar()
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? cerrar() : abrir())}
        onKeyDown={e => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            abrir()
          } else if (open && e.key === 'Escape') {
            e.preventDefault()
            e.stopPropagation()
            e.nativeEvent.stopImmediatePropagation()
            cerrar()
          } else if (open && !conBuscador) {
            mover(e)
          }
        }}
        className={cn(
          'flex h-[38px] w-full cursor-pointer items-center gap-2.5 rounded-lg border bg-surface px-3 text-left text-sm transition-[border-color,box-shadow] duration-150 outline-none',
          'focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]',
          open ? 'border-accent shadow-[0_0_0_3px_var(--focus-ring)]' : 'border-line-strong hover:border-line-hover',
          invalid && 'border-danger!',
          disabled && 'cursor-not-allowed bg-subtle opacity-70 hover:border-line-strong',
          className
        )}
        {...aria}
      >
        {icon && (
          <span className="shrink-0 text-muted" aria-hidden>
            {icon}
          </span>
        )}
        {selected?.color && <span className="size-2.5 shrink-0 rounded-full" style={{ background: selected.color }} aria-hidden />}
        <span className={cn('min-w-0 flex-1 truncate', selected ? 'font-medium text-content' : 'text-muted')}>
          {loading ? 'Cargando…' : selected ? selected.label : placeholder}
        </span>
        {loading ? (
          <FiLoader className="shrink-0 animate-spin text-muted" aria-hidden />
        ) : (
          <FiChevronDown className={cn('shrink-0 text-muted transition-transform duration-150', open && 'rotate-180 text-accent')} aria-hidden />
        )}
      </button>

      <Popover anchorRef={triggerRef} open={open} onClose={cerrar} width={280} maxHeight={340} onKeyDown={conBuscador ? mover : undefined}>
        {conBuscador && (
          <div className="shrink-0 border-b border-line p-2">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
              <input
                ref={searchRef}
                value={query}
                onChange={e => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                placeholder="Buscar…"
                aria-label="Buscar en la lista"
                aria-controls={listId}
                aria-activedescendant={visibles[active] ? `${listId}-${active}` : undefined}
                className="h-9 w-full rounded-lg border-none bg-subtle pr-3 pl-9 text-sm text-content outline-none placeholder:text-muted focus:shadow-[0_0_0_2px_var(--focus-ring)]"
              />
            </div>
          </div>
        )}
        <ul ref={listRef} id={listId} role="listbox" className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-1.5">
          {visibles.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted">{query ? 'Nada coincide con la búsqueda' : emptyText}</li>
          ) : (
            visibles.map((o, i) => {
              const isSel = o.value === value
              const isAct = i === active
              return (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={isSel}
                  data-active={isAct}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => elegir(o)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-100',
                    isAct && 'bg-subtle',
                    isSel && 'bg-primary/8 dark:bg-primary/20'
                  )}
                >
                  {o.icon && (
                    <span className="shrink-0 text-muted" aria-hidden>
                      {o.icon}
                    </span>
                  )}
                  {o.color && <span className="size-2.5 shrink-0 rounded-full" style={{ background: o.color }} aria-hidden />}
                  <span className="min-w-0 flex-1">
                    <span className={cn('block leading-snug', isSel ? 'font-semibold text-primary dark:text-accent-light' : 'font-medium text-content')}>
                      {o.label}
                    </span>
                    {o.description && <span className="block truncate text-xs text-muted">{o.description}</span>}
                  </span>
                  {isSel && <FiCheck className="shrink-0 text-primary dark:text-accent-light" aria-hidden />}
                </li>
              )
            })
          )}
        </ul>
      </Popover>
    </>
  )
}
