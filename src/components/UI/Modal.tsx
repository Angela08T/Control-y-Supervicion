import React, { useEffect } from 'react'
import { FiX } from 'react-icons/fi'
import { cn } from '@/utils/classes'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalProps {
  title: React.ReactNode
  /** Texto corto bajo el titulo que explica para que sirve el formulario */
  description?: React.ReactNode
  onClose: () => void
  /** Botones de accion; se muestran fijos al pie del modal */
  footer?: React.ReactNode
  size?: ModalSize
  /** Cerrar al hacer clic fuera. Por defecto NO, para no perder lo escrito en un formulario */
  closeOnBackdrop?: boolean
  children: React.ReactNode
}

const widths: Record<ModalSize, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[520px]',
  lg: 'max-w-[760px]',
  xl: 'max-w-[1040px]',
}

export default function Modal({
  title,
  description,
  onClose,
  footer,
  size = 'md',
  closeOnBackdrop = false,
  children,
}: ModalProps) {
  // Cierra con Escape y evita que la pagina de fondo haga scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/45 p-4 animate-[fadeInSoft_0.15s_ease-out]"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'flex max-h-[calc(100vh-32px)] w-full flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[0_16px_48px_rgba(15,23,42,0.18)] animate-[popIn_0.18s_ease-out]',
          widths[size]
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0">
            <h3 className="m-0 text-base font-semibold text-content">{title}</h3>
            {description && <p className="m-0 mt-1 text-[13px] text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-lg text-muted transition-colors duration-150 hover:bg-subtle hover:text-content"
          >
            <FiX />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">{children}</div>
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-line bg-subtle px-6 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
