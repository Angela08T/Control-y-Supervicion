import React, { useEffect, useState } from 'react'
import type { ID, Incidencia, IncidenciaStatus } from '@/types'
import { FiInbox, FiPaperclip, FiHash } from 'react-icons/fi'
import { StatusBadge } from '@/components/UI/Badge'
import { EmptyState } from '@/components/UI/EmptyState'
import IncidenciaDetailDrawer from '@/components/IncidenciaDetailDrawer'
import IncidenciaDetailPanel from '@/components/IncidenciaDetailPanel'
import { cn, scrollSoft } from '@/utils/classes'
import { DASH, colorAvatar, formatAbsenceDates, formatTurno, iniciales } from '@/utils/incidenciaFormat'

/** Tarjeta de la bandeja: blanca, con borde y sombra como las de Inicio */
const panelCard =
  'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#d3dceb] bg-surface shadow-[0_1px_2px_rgba(12,26,75,0.06),0_12px_28px_-14px_rgba(12,26,75,0.28)] dark:border-line'

const ANCHO_BANDEJA = '(min-width: 1100px)'

/** true si la pantalla es lo bastante ancha para mostrar lista y detalle lado a lado */
function useBandejaAncha(): boolean {
  const [ancha, setAncha] = useState(() => typeof window !== 'undefined' && window.matchMedia(ANCHO_BANDEJA).matches)
  useEffect(() => {
    const mq = window.matchMedia(ANCHO_BANDEJA)
    const onChange = () => setAncha(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return ancha
}

export interface IncidenciasTableProps {
  data?: Incidencia[]
  onDelete: (id: ID, status: IncidenciaStatus) => void
  onEdit: (item: Incidencia) => void
  onSend: (id: ID) => void
  onApprove: (id: ID) => void
  onReject: (id: ID) => void
  /** @deprecated La bandeja no numera filas; se ignora. */
  startIndex?: number
  canDelete?: boolean
  canSend?: boolean
  canValidate?: boolean
  /** Pie de la lista (la paginacion) */
  footer?: React.ReactNode
}

/**
 * Bandeja de incidencias: la lista a la izquierda y el detalle de la elegida a la derecha.
 * En pantallas angostas solo se ve la lista y el detalle se abre como panel lateral.
 */
export default function IncidenciasTable({
  data = [],
  onDelete,
  onEdit,
  onSend,
  onApprove,
  onReject,
  canDelete = true,
  canSend = false,
  canValidate = false,
  footer,
}: IncidenciasTableProps) {
  const ancha = useBandejaAncha()
  const [selectedId, setSelectedId] = useState<ID | null>(null)
  const elegida = selectedId === null ? null : data.find((item) => item.id === selectedId) ?? null
  // En la bandeja ancha siempre hay una elegida: si la anterior ya no esta (otra pagina o filtro), la primera
  const selected = elegida ?? (ancha ? data[0] ?? null : null)

  /** Reglas de acciones (las mismas para la lista y el detalle) */
  const flagsOf = (item: Incidencia) => {
    const itemStatus = item.status ? item.status.toLowerCase() : 'draft'
    return {
      canSendToValidator: !item.deletedAt && canSend && item.evidences?.length > 0 && itemStatus === 'draft',
      canValidateReport: !item.deletedAt && canValidate && itemStatus === 'pending',
    }
  }

  const detalleProps = selected && {
    item: selected,
    onEdit,
    onDelete,
    onSend,
    onApprove,
    onReject,
    canDelete,
    canSendToValidator: flagsOf(selected).canSendToValidator,
    canValidateReport: flagsOf(selected).canValidateReport,
  }

  const lista = (
    <div className={cn(panelCard, ancha ? 'w-[400px] shrink-0' : 'flex-1')}>
      {data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            title="No hay incidencias"
            description="Prueba cambiando los filtros o agrega una nueva con el botón “Nueva incidencia”."
          />
        </div>
      ) : (
        <ul className={`m-0 min-h-0 flex-1 list-none overflow-y-auto p-0 ${scrollSoft}`} aria-label="Incidencias">
          {data.map((item) => {
            const activa = selected?.id === item.id
            const deshabilitada = !!item.deletedAt
            const nombre = item.nombreCompleto || item.dni || DASH
            const fecha = item.isAbsenceReport ? formatAbsenceDates(item) : item.fechaIncidente || DASH
            const detalle = item.isAbsenceReport
              ? item.absenceMode === 'JUSTIFIED' ? 'Justificada' : 'Injustificada'
              : `${item.horaIncidente || DASH} · ${formatTurno(item.turno)}`
            return (
              <li key={item.id} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  aria-current={activa ? 'true' : undefined}
                  className={cn(
                    'relative flex w-full cursor-pointer gap-3 border-none px-4 py-3.5 text-left transition-colors duration-150',
                    activa ? 'bg-primary/8 shadow-[inset_4px_0_0_var(--primary)]' : 'bg-transparent hover:bg-subtle',
                    deshabilitada && 'opacity-60'
                  )}
                >
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ background: colorAvatar(item.dni || item.nombreCompleto) }}
                    aria-hidden
                  >
                    {iniciales(item.nombreCompleto, item.dni)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[14.5px] font-bold text-ink dark:text-content" title={nombre}>
                        {nombre}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-content-2 tabular-nums">{fecha}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[13.5px] font-medium text-content" title={item.falta || undefined}>
                      {item.falta || DASH}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <StatusBadge status={item.status} disabled={deshabilitada} />
                      <span className="text-xs text-content-2">{detalle}</span>
                      {item.code && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary dark:text-accent-light">
                          <FiHash className="size-3" aria-hidden />
                          {item.code}
                        </span>
                      )}
                      {item.evidences?.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-content-2" title="Evidencias">
                          <FiPaperclip className="size-3" aria-hidden />
                          {item.evidences.length}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {footer}
    </div>
  )

  if (!ancha) {
    return (
      <>
        <div className="flex min-h-0 flex-1">{lista}</div>
        {elegida && detalleProps && <IncidenciaDetailDrawer {...detalleProps} onClose={() => setSelectedId(null)} />}
      </>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      {lista}
      <div className={cn(panelCard, 'min-w-0 flex-1')}>
        {detalleProps ? (
          <IncidenciaDetailPanel key={String(detalleProps.item.id)} {...detalleProps} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-subtle text-2xl text-content-2" aria-hidden>
              <FiInbox />
            </span>
            <p className="m-0 text-[15px] font-semibold text-ink dark:text-content">Elige una incidencia</p>
            <p className="m-0 text-sm text-content-2">Su detalle aparecerá aquí.</p>
          </div>
        )}
      </div>
    </div>
  )
}
