import React from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { cn } from '@/utils/classes'
import { controlClass } from './Field'

export interface PaginationProps {
  page: number
  totalPages: number
  total: number
  from: number
  to: number
  perPage: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  perPageOptions?: number[]
}

const navBtn =
  'inline-flex size-8 cursor-pointer items-center justify-center rounded-md border border-line-strong bg-surface text-sm text-content-2 transition-colors duration-150 hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40'

/** Ventana de hasta 5 paginas alrededor de la pagina actual. */
function pageWindow(page: number, totalPages: number): number[] {
  const size = Math.min(5, totalPages)
  let start = Math.max(1, page - 2)
  if (start + size - 1 > totalPages) start = Math.max(1, totalPages - size + 1)
  return Array.from({ length: size }, (_, i) => start + i)
}

/** Paginacion estandar de las tablas: contador, filas por pagina y navegacion. */
export default function Pagination({
  page,
  totalPages,
  total,
  from,
  to,
  perPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 25, 50, 100],
}: PaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
      <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted">
        <span>
          {total === 0 ? 'Sin registros' : <>Mostrando <strong className="font-semibold text-content">{from}–{to}</strong> de {total}</>}
        </span>
        <label className="flex items-center gap-2">
          Filas
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className={cn(controlClass, 'h-8 w-auto cursor-pointer py-0 pr-7 pl-2 text-[13px]')}
          >
            {perPageOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Paginación">
          <button type="button" className={navBtn} onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Página anterior">
            <FiChevronLeft />
          </button>
          {pageWindow(page, totalPages).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPageChange(n)}
              aria-current={n === page ? 'page' : undefined}
              className={cn(
                navBtn,
                'min-w-8 px-2 font-medium',
                n === page && 'border-primary bg-primary text-btn hover:bg-primary'
              )}
            >
              {n}
            </button>
          ))}
          <button type="button" className={navBtn} onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Página siguiente">
            <FiChevronRight />
          </button>
        </nav>
      )}
    </div>
  )
}
