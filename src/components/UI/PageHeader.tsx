import React from 'react'

export interface PageHeaderProps {
  title: string
  /** Una linea que explica que se hace en esta pantalla */
  description?: string
  /** Acciones principales (a la derecha): maximo UN boton primario */
  actions?: React.ReactNode
  /** Barra de busqueda y filtros bajo el titulo */
  children?: React.ReactNode
}

/** Encabezado estandar de pagina: titulo + descripcion + accion principal + filtros. */
export default function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <header className="mb-5 flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 text-[22px] font-semibold tracking-[-0.01em] text-content">{title}</h2>
          {description && <p className="m-0 mt-1 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}
