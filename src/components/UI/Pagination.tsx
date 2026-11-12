import React from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { cn } from '@/utils/classes'

export interface PaginationProps {
  page: number
  totalPages: number
  total: number
  from: number
  to: number
  onPageChange: (page: number) => void
  /** @deprecated Las tablas siempre muestran un maximo de 10 filas; se ignora. */
  perPage?: number
  /** @deprecated Ya no hay selector de filas por pagina; se ignora. */
  onPerPageChange?: (perPage: number) => void
  /** @deprecated Ya no hay selector de filas por pagina; se ignora. */
  perPageOptions?: number[]
}

/** Boton del control segmentado (numeros y flechas) */
const segBtn =
  'inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg border-none px-2 text-[13px] font-semibold tabular-nums transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-35 @max-[560px]:min-w-0 @max-[560px]:flex-1'

/**
 * Paginas a mostrar: siempre la primera y la ultima, la actual con sus vecinas y "…" en los huecos.
 * Nunca mas de 7 posiciones, para que entre en paneles angostos.
 */
function paginas(page: number, total: number): Array<number | 'izq' | 'der'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, 'der', total]
  if (page >= total - 3) return [1, 'izq', total - 4, total - 3, total - 2, total - 1, total]
  return [1, 'izq', page - 1, page, page + 1, 'der', total]
}

/** Paginacion estandar de las tablas (10 filas por pagina): contador con barra de avance y navegacion. */
export default function Pagination({ page, totalPages, total, from, to, onPageChange }: PaginationProps) {
  const avance = total > 0 ? Math.min(100, Math.max(4, (to / total) * 100)) : 0

  return (
    <div className="@container shrink-0 border-t border-line bg-subtle/50 px-4 py-3">
      <div className="flex flex-col gap-3 @[560px]:flex-row @[560px]:items-center @[560px]:justify-between">
        {/* Contador y avance */}
        <div className="min-w-0 @[560px]:w-56">
          {total === 0 ? (
            <span className="text-[13px] text-muted">Sin registros</span>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="text-content-2">
                  <strong className="font-bold text-content tabular-nums">{from}–{to}</strong> de{' '}
                  <strong className="font-semibold text-content tabular-nums">{total.toLocaleString('es-PE')}</strong>
                </span>
                {totalPages > 1 && (
                  <span className="shrink-0 text-xs font-medium text-muted tabular-nums">
                    Página {page} de {totalPages}
                  </span>
                )}
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line" aria-hidden>
                <div className="h-full rounded-full bg-primary transition-[width] duration-300 dark:bg-accent" style={{ width: `${avance}%` }} />
              </div>
            </>
          )}
        </div>

        {/* Navegacion: control segmentado */}
        {totalPages > 1 && (
          <nav
            className="flex items-center gap-0.5 rounded-xl border border-line bg-surface p-1 shadow-[0_1px_2px_var(--shadow)] @max-[560px]:w-full"
            aria-label="Paginación"
          >
            <button
              type="button"
              className={cn(segBtn, 'bg-subtle text-content hover:bg-line hover:text-ink dark:hover:text-content')}
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Página anterior"
            >
              <FiChevronLeft className="text-base" />
            </button>

            {paginas(page, totalPages).map((n) =>
              typeof n === 'number' ? (
                <button
                  key={n}
                  type="button"
                  onClick={() => onPageChange(n)}
                  aria-current={n === page ? 'page' : undefined}
                  aria-label={`Página ${n}`}
                  className={cn(
                    segBtn,
                    n === page
                      ? 'bg-primary text-white shadow-[0_4px_10px_-4px_rgba(30,58,138,0.8)]'
                      : 'bg-transparent text-content-2 hover:bg-subtle hover:text-content'
                  )}
                >
                  {n}
                </button>
              ) : (
                // Salta 5 paginas hacia ese lado
                <button
                  key={n}
                  type="button"
                  onClick={() => onPageChange(n === 'izq' ? Math.max(1, page - 5) : Math.min(totalPages, page + 5))}
                  aria-label={n === 'izq' ? 'Retroceder 5 páginas' : 'Avanzar 5 páginas'}
                  title={n === 'izq' ? 'Retroceder 5 páginas' : 'Avanzar 5 páginas'}
                  className={cn(segBtn, 'bg-transparent tracking-widest text-muted hover:bg-subtle hover:text-content')}
                >
                  …
                </button>
              )
            )}

            <button
              type="button"
              className={cn(segBtn, 'bg-subtle text-content hover:bg-line hover:text-ink dark:hover:text-content')}
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Página siguiente"
            >
              <FiChevronRight className="text-base" />
            </button>
          </nav>
        )}
      </div>
    </div>
  )
}
