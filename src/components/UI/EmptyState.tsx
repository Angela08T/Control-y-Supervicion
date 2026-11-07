import React from 'react'
import { FiInbox } from 'react-icons/fi'

/** Tres azules del sistema para los puntos de carga */
const DOT_COLORS = ['#1e3a8a', '#2563eb', '#60a5fa']

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  /** Boton opcional para el siguiente paso (ej. "Limpiar filtros") */
  action?: React.ReactNode
}

/** Estado vacio: dice que paso y que hacer a continuacion. */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-subtle text-2xl text-muted">{icon ?? <FiInbox />}</div>
      <p className="m-0 text-[15px] font-semibold text-content">{title}</p>
      {description && <p className="m-0 max-w-[360px] text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Estado de carga: tres puntos azules en ola. */
export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-muted" role="status">
      <span className="flex items-end gap-1" aria-hidden>
        {DOT_COLORS.map((color, i) => (
          <span
            key={color}
            className="size-2 rounded-full"
            style={{ background: color, animation: `dotWave 1.2s ease-in-out ${i * 110}ms infinite` }}
          />
        ))}
      </span>
      {label}
    </div>
  )
}

export default EmptyState
