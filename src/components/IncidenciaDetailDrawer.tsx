import React, { useEffect } from 'react'
import IncidenciaDetailPanel, { type IncidenciaDetailPanelProps } from '@/components/IncidenciaDetailPanel'

const TITLE_ID = 'incidencia-detalle-titulo'

export interface IncidenciaDetailDrawerProps extends Omit<IncidenciaDetailPanelProps, 'onClose' | 'titleId'> {
  onClose: () => void
}

/** Panel lateral (pantallas angostas) con el mismo detalle que la bandeja muestra a la derecha. */
export default function IncidenciaDetailDrawer({ onClose, ...props }: IncidenciaDetailDrawerProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-[2000] bg-[rgba(10,22,61,0.5)]" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="fixed inset-y-0 right-0 z-[2000] flex w-[480px] max-w-full flex-col bg-surface shadow-[0_16px_48px_rgba(15,23,42,0.25)] animate-[drawerIn_0.2s_ease-out]"
      >
        <IncidenciaDetailPanel {...props} onClose={onClose} titleId={TITLE_ID} />
      </aside>
    </>
  )
}
