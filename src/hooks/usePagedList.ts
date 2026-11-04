import { useEffect, useMemo, useState } from 'react'

/** Maximo de filas por pagina en todas las tablas de la aplicacion. */
export const PAGE_SIZE = 10

export interface PagedList<T> {
  /** Filas de la pagina actual (maximo PAGE_SIZE) */
  pageItems: T[]
  page: number
  setPage: (page: number) => void
  totalPages: number
  total: number
  /** Posicion (1-based) de la primera y la ultima fila mostradas; 0 si no hay filas */
  from: number
  to: number
}

/**
 * Pagina en el navegador una lista que ya esta completa en memoria.
 *
 * `resetKey` es un valor que, al cambiar, devuelve la tabla a la pagina 1 (el texto de busqueda,
 * el filtro de rol, etc.). No hace falta memoizar `items`: el reinicio depende solo de `resetKey`.
 * Si la lista se acorta (p. ej. al eliminar un registro) la pagina actual se ajusta sola.
 */
export function usePagedList<T>(items: T[], resetKey: unknown = null): PagedList<T> {
  const [page, setPage] = useState(1)
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    setPage(1)
  }, [resetKey])

  const current = Math.min(page, totalPages)

  const pageItems = useMemo(
    () => items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [items, current]
  )

  return {
    pageItems,
    page: current,
    setPage,
    totalPages,
    total,
    from: total === 0 ? 0 : (current - 1) * PAGE_SIZE + 1,
    to: Math.min(current * PAGE_SIZE, total),
  }
}
