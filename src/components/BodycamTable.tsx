import React from 'react'
import type { BodycamView, Cam } from '@/types'
import { FiCamera, FiEdit2, FiHash, FiRadio, FiRotateCcw, FiSlash, FiSmartphone, FiVideo } from 'react-icons/fi'
import { actionBtn, actionBtnDanger, actions, cn, incTable, incTableTd, incTableTh, incTableTr } from '@/utils/classes'

/** Fila que la tabla necesita (los resultados de busqueda traen el mismo subconjunto) */
export type BodycamTableRow = Pick<BodycamView, 'id' | 'name' | 'serie' | 'cam' | 'deleted_at'>

/** Nombre, icono y color de cada tipo de equipo (colores del logo) */
const camInfo: Record<Cam, { label: string; icon: React.ReactNode; tile: string; chip: string }> = {
  BODYCAM: {
    label: 'Bodycam',
    icon: <FiVideo />,
    tile: 'bg-primary/10 text-primary dark:bg-primary/25 dark:text-accent-light',
    chip: 'bg-primary/8 text-primary dark:bg-primary/20 dark:text-accent-light',
  },
  CAMERA: { label: 'Cámara', icon: <FiCamera />, tile: 'bg-brand-cyan/14 text-cyan-ink', chip: 'bg-brand-cyan/12 text-cyan-ink' },
  RADIO: { label: 'Radio', icon: <FiRadio />, tile: 'bg-brand-amber/16 text-amber-ink', chip: 'bg-brand-amber/14 text-amber-ink' },
  PHONE: { label: 'Teléfono', icon: <FiSmartphone />, tile: 'bg-brand-pink/12 text-pink-ink', chip: 'bg-brand-pink/10 text-pink-ink' },
}

/** Subtipo de bodycam segun el prefijo del nombre */
const subtipo = (row: BodycamTableRow): string | null => {
  if (row.cam !== 'BODYCAM') return null
  const n = row.name.toUpperCase()
  if (n.startsWith('FISCA')) return 'FISCA'
  if (n.startsWith('SG')) return 'SG'
  return null
}

export interface BodycamTableProps {
  data?: BodycamTableRow[];
  onToggleStatus: (item: BodycamTableRow) => void;
  onEdit: (item: BodycamTableRow) => void;
  /** Ya no se muestra numeración de fila; se mantiene por compatibilidad con la página */
  startIndex?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

/** Fecha corta de deshabilitacion */
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Solo la tabla: la tarjeta, el estado vacío y la paginación los pone la página. */
export default function BodycamTable({ data = [], onToggleStatus, onEdit, canEdit = true, canDelete = true }: BodycamTableProps) {
  const showActions = canEdit || canDelete

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className={incTable}>
        <thead>
          <tr>
            <th className={incTableTh}>Dispositivo</th>
            <th className={cn(incTableTh, 'max-sm:hidden')}>N.º de serie</th>
            <th className={incTableTh}>Tipo</th>
            <th className={incTableTh}>Estado</th>
            {showActions && <th className={cn(incTableTh, 'text-right!')}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const isEnabled = !item.deleted_at
            const info = item.cam ? camInfo[item.cam] : null
            const sub = subtipo(item)
            return (
              <tr key={item.id} className={cn(incTableTr, 'group')}>
                <td className={incTableTd}>
                  <div className={cn('flex items-center gap-3', !isEnabled && 'opacity-55')}>
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl text-lg',
                        info ? info.tile : 'bg-subtle text-muted',
                        !isEnabled && 'grayscale'
                      )}
                      aria-hidden
                    >
                      {info?.icon ?? <FiVideo />}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-bold tracking-[0.02em] text-content">{item.name}</div>
                      {/* En movil la serie va bajo el nombre */}
                      {item.serie && <div className="truncate font-mono text-xs text-muted sm:hidden">{item.serie}</div>}
                    </div>
                  </div>
                </td>
                <td className={cn(incTableTd, 'max-sm:hidden')}>
                  {item.serie ? (
                    <span className={cn('inline-flex items-center gap-1 rounded-md bg-subtle px-2 py-0.5 font-mono text-[12.5px] text-content-2', !isEnabled && 'opacity-60')}>
                      <FiHash className="text-muted" aria-hidden />
                      {item.serie}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className={incTableTd}>
                  {info ? (
                    <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap', info.chip)}>
                      {info.label}
                      {sub && <span className="rounded bg-surface/70 px-1.5 text-[10px] font-bold tracking-[0.06em] dark:bg-black/20">{sub}</span>}
                    </span>
                  ) : (
                    <span className="text-muted">Sin tipo</span>
                  )}
                </td>
                <td className={incTableTd}>
                  {isEnabled ? (
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-lime-ink">
                      <span className="relative flex size-2.5" aria-hidden>
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-40 [animation-duration:2.4s]" />
                        <span className="relative inline-flex size-2.5 rounded-full bg-success" />
                      </span>
                      Habilitado
                    </span>
                  ) : (
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-red-ink">
                        <span className="size-2.5 rounded-full bg-danger" aria-hidden />
                        Deshabilitado
                      </span>
                      {item.deleted_at && <span className="pl-4 text-xs text-muted">desde {formatDate(item.deleted_at)}</span>}
                    </div>
                  )}
                </td>
                {showActions && (
                  <td className={incTableTd}>
                    <div className={actions}>
                      {canEdit && (
                        <button
                          type="button"
                          title="Editar"
                          aria-label={`Editar ${item.name}`}
                          onClick={() => onEdit(item)}
                          className={actionBtn}
                        >
                          <FiEdit2 aria-hidden />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          title={isEnabled ? 'Deshabilitar' : 'Habilitar'}
                          aria-label={`${isEnabled ? 'Deshabilitar' : 'Habilitar'} ${item.name}`}
                          onClick={() => onToggleStatus(item)}
                          className={isEnabled ? actionBtnDanger : cn(actionBtn, 'text-lime-ink hover:bg-success/12 hover:text-lime-ink')}
                        >
                          {isEnabled ? <FiSlash aria-hidden /> : <FiRotateCcw aria-hidden />}
                        </button>
                      )}
                      {!canEdit && !canDelete && <span className="text-xs text-muted">Solo lectura</span>}
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
