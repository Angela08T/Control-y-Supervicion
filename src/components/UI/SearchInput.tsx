import React from 'react'
import { FiLoader, FiSearch, FiX } from 'react-icons/fi'
import { cn } from '@/utils/classes'
import { controlClass } from './Field'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Muestra un spinner mientras se busca */
  loading?: boolean
  className?: string
}

/** Buscador con lupa, spinner de carga y boton para limpiar. */
export default function SearchInput({ value, onChange, placeholder = 'Buscar', loading = false, className }: SearchInputProps) {
  return (
    <div className={cn('relative w-full min-w-[220px] max-w-[360px]', className)}>
      <FiSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(controlClass, 'h-9 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden')}
      />
      {loading ? (
        <FiLoader className="absolute top-1/2 right-3 -translate-y-1/2 animate-spin text-muted" aria-hidden />
      ) : (
        value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Limpiar búsqueda"
            className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-muted hover:text-content"
          >
            <FiX />
          </button>
        )
      )}
    </div>
  )
}
