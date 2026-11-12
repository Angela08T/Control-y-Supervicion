import React from 'react'
import type { Lead } from '@/types'
import { FiSlash, FiEdit2, FiRotateCcw, FiBriefcase } from 'react-icons/fi'
import { actionBtn, actionBtnDanger, actions, cn, incTable, incTableTd, incTableTh, incTableTr } from '@/utils/classes'
import { colorAvatar, iniciales } from '@/utils/incidenciaFormat'

export interface LeadTableProps {
  data?: Lead[];
  onToggleStatus: (item: Lead) => void;
  onEdit: (item: Lead) => void;
  startIndex?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

/** Fecha corta de deshabilitacion */
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

const nombreDe = (item: Lead) => `${item.name} ${item.lastname}`.trim()

/** Estado con punto de color: verde con pulso suave si esta activo, rojo con la fecha si no */
function Estado({ item }: { item: Lead }) {
  if (!item.deleted_at) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-lime-ink">
        <span className="relative flex size-2.5" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-40 [animation-duration:2.4s]" />
          <span className="relative inline-flex size-2.5 rounded-full bg-success" />
        </span>
        Activo
      </span>
    )
  }
  return (
    <span className="inline-flex flex-col">
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-red-ink">
        <span className="size-2.5 rounded-full bg-danger" aria-hidden />
        Deshabilitado
      </span>
      <span className="pl-4 text-xs text-muted">desde {formatDate(item.deleted_at)}</span>
    </span>
  )
}

/** Etiqueta del cargo */
function Cargo({ item }: { item: Lead }) {
  return item.job?.name ? (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-accent-light">
      <FiBriefcase className="shrink-0" aria-hidden />
      <span className="truncate">{item.job.name}</span>
    </span>
  ) : (
    <span className="text-xs text-muted">Sin cargo</span>
  )
}

/** Botones editar / habilitar-deshabilitar */
function Acciones({ item, onEdit, onToggleStatus, canEdit, canDelete }: Required<Pick<LeadTableProps, 'onEdit' | 'onToggleStatus' | 'canEdit' | 'canDelete'>> & { item: Lead }) {
  const isEnabled = !item.deleted_at
  const nombre = nombreDe(item)
  return (
    <div className={actions}>
      {canEdit && (
        <button type="button" title="Editar" aria-label={`Editar a ${nombre}`} onClick={() => onEdit(item)} className={actionBtn}>
          <FiEdit2 aria-hidden />
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          title={isEnabled ? 'Deshabilitar' : 'Habilitar'}
          aria-label={`${isEnabled ? 'Deshabilitar' : 'Habilitar'} a ${nombre}`}
          onClick={() => onToggleStatus(item)}
          className={isEnabled ? actionBtnDanger : cn(actionBtn, 'text-lime-ink hover:bg-success/12 hover:text-lime-ink')}
        >
          {isEnabled ? <FiSlash aria-hidden /> : <FiRotateCcw aria-hidden />}
        </button>
      )}
      {!canEdit && !canDelete && <span className="text-xs text-muted">Solo lectura</span>}
    </div>
  )
}

/** Vista de lista */
export default function LeadTable({ data = [], onToggleStatus, onEdit, canEdit = true, canDelete = true }: LeadTableProps) {
  const showActions = canEdit || canDelete

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className={incTable}>
        <thead>
          <tr>
            <th className={incTableTh}>Persona</th>
            <th className={cn(incTableTh, 'max-sm:hidden')}>Cargo</th>
            <th className={incTableTh}>Estado</th>
            {showActions && <th className={cn(incTableTh, 'text-right!')}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const isEnabled = !item.deleted_at
            const nombre = nombreDe(item)
            return (
              <tr key={item.id} className={incTableTr}>
                <td className={incTableTd}>
                  <div className={cn('flex items-center gap-3', !isEnabled && 'opacity-55')}>
                    <span
                      className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white', !isEnabled && 'grayscale')}
                      style={{ background: colorAvatar(String(item.id)) }}
                      aria-hidden
                    >
                      {iniciales(nombre)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-semibold text-content">{nombre}</div>
                      <div className="truncate text-xs text-muted sm:hidden">{item.job?.name || 'Sin cargo'}</div>
                    </div>
                  </div>
                </td>
                <td className={cn(incTableTd, 'max-sm:hidden', !isEnabled && 'opacity-60')}>
                  <Cargo item={item} />
                </td>
                <td className={incTableTd}>
                  <Estado item={item} />
                </td>
                {showActions && (
                  <td className={incTableTd}>
                    <Acciones item={item} onEdit={onEdit} onToggleStatus={onToggleStatus} canEdit={canEdit} canDelete={canDelete} />
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

/** Vista de tarjetas: un directorio con avatar grande, cargo y estado */
export function LeadGrid({ data = [], onToggleStatus, onEdit, canEdit = true, canDelete = true }: LeadTableProps) {
  return (
    <div className="min-h-0 flex-1 overflow-auto p-4 max-sm:p-3">
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3 p-0">
        {data.map(item => {
          const isEnabled = !item.deleted_at
          const nombre = nombreDe(item)
          return (
            <li
              key={item.id}
              className={cn(
                'group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_14px_30px_-16px_rgba(12,26,75,0.35)]',
                !isEnabled && 'bg-subtle'
              )}
            >
              {/* Franja superior con el color de la persona */}
              <span
                aria-hidden
                className={cn('absolute inset-x-0 top-0 h-1', !isEnabled && 'grayscale')}
                style={{ background: colorAvatar(String(item.id)) }}
              />
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white shadow-sm', !isEnabled && 'opacity-60 grayscale')}
                  style={{ background: colorAvatar(String(item.id)) }}
                  aria-hidden
                >
                  {iniciales(nombre)}
                </span>
                {(canEdit || canDelete) && (
                  <div className="opacity-70 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <Acciones item={item} onEdit={onEdit} onToggleStatus={onToggleStatus} canEdit={canEdit} canDelete={canDelete} />
                  </div>
                )}
              </div>
              <div className={cn('min-w-0', !isEnabled && 'opacity-60')}>
                <p className="m-0 truncate text-[15px] font-bold text-content" title={nombre}>{nombre}</p>
                <div className="mt-1.5">
                  <Cargo item={item} />
                </div>
              </div>
              <div className="mt-auto border-t border-line pt-2.5">
                <Estado item={item} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
