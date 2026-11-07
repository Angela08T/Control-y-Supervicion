import React from 'react'
import ContourMap from './ContourMap'

export interface PageHeaderProps {
  title: string
  /** Una linea que explica que se hace en esta pantalla */
  description?: string
  /** Acciones principales (a la derecha): maximo UN boton primario */
  actions?: React.ReactNode
  /** Barra de busqueda y filtros bajo el titulo */
  children?: React.ReactNode
}

/**
 * Encabezado de pagina: una franja azul institucional con el fondo cartografico en movimiento,
 * y debajo la busqueda y los filtros.
 */
export default function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <header className="mb-5 flex w-full flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl bg-[var(--page-color)] px-7 py-5 text-[var(--page-fg)] max-sm:px-5">
        <ContourMap tone="dark" align="xMaxYMid" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="m-0 text-2xl leading-tight font-semibold tracking-[-0.01em]">{title}</h2>
            {description && <p className="m-0 mt-1 max-w-[62ch] text-sm text-white/75">{description}</p>}
          </div>
          {actions && <div className="band-actions flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}
