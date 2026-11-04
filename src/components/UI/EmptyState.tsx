import React from 'react'
import { FiInbox, FiLoader } from 'react-icons/fi'

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

/** Estado de carga con spinner. */
export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-muted" role="status">
      <FiLoader className="animate-spin" aria-hidden />
      {label}
    </div>
  )
}

export default EmptyState
