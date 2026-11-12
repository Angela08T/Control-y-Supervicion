import React from 'react'
import type { Job, Lead } from '@/types'
import { FiSlash, FiEdit2, FiRotateCcw, FiBriefcase, FiUsers } from 'react-icons/fi'
import { actionBtn, actionBtnDanger, actions, cn, incTable, incTableTd, incTableTh, incTableTr } from '@/utils/classes'
import { colorAvatar, iniciales } from '@/utils/incidenciaFormat'

export interface JobTableProps {
  data?: Job[];
  onToggleStatus: (item: Job) => void;
  onEdit: (item: Job) => void;
  startIndex?: number;
  canEdit?: boolean;
  canDelete?: boolean;
  /** Personal activo de cada cargo (por id de cargo); undefined mientras carga */
  personas?: Record<string, Lead[]>;
}

/** Fecha corta de deshabilitacion */
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Estado con punto de color */
function Estado({ item }: { item: Job }) {
  if (!item.deleted_at) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-lime-ink">
        <span className="size-2.5 rounded-full bg-success" aria-hidden />
        Habilitado
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

/** Avatares superpuestos de las personas del cargo (maximo 5 y "+N") */
function Equipo({ gente, cargando }: { gente?: Lead[]; cargando: boolean }) {
  if (cargando) return <span className="h-7 w-20 animate-pulse rounded-full bg-subtle" aria-hidden />
  if (!gente || gente.length === 0) return <span className="text-xs text-muted">Nadie asignado</span>
  const visibles = gente.slice(0, 5)
  const resto = gente.length - visibles.length
  const nombres = gente.map(l => `${l.name} ${l.lastname}`.trim())
  return (
    <span className="flex items-center" title={nombres.slice(0, 12).join(', ') + (nombres.length > 12 ? '…' : '')}>
      {visibles.map((l, i) => (
        <span
          key={l.id}
          className={cn('flex size-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-surface', i > 0 && '-ml-2')}
          style={{ background: colorAvatar(String(l.id)) }}
          aria-hidden
        >
          {iniciales(`${l.name} ${l.lastname}`)}
        </span>
      ))}
      {resto > 0 && (
        <span className="-ml-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-subtle px-1.5 text-[10px] font-bold text-content-2 ring-2 ring-surface">
          +{resto}
        </span>
      )}
      <span className="sr-only">{nombres.join(', ')}</span>
    </span>
  )
}

/** Botones editar / habilitar-deshabilitar */
function Acciones({ item, onEdit, onToggleStatus, canEdit, canDelete }: Required<Pick<JobTableProps, 'onEdit' | 'onToggleStatus' | 'canEdit' | 'canDelete'>> & { item: Job }) {
  const isEnabled = !item.deleted_at
  return (
    <div className={actions}>
      {canEdit && (
        <button type="button" title="Editar" aria-label={`Editar el cargo ${item.name}`} onClick={() => onEdit(item)} className={actionBtn}>
          <FiEdit2 aria-hidden />
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          title={isEnabled ? 'Deshabilitar' : 'Habilitar'}
          aria-label={`${isEnabled ? 'Deshabilitar' : 'Habilitar'} el cargo ${item.name}`}
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

const cuantos = (n: number) => `${n} ${n === 1 ? 'persona' : 'personas'}`

/** Vista de lista */
export default function JobTable({ data = [], onToggleStatus, onEdit, canEdit = true, canDelete = true, personas }: JobTableProps) {
  const showActions = canEdit || canDelete

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className={incTable}>
        <thead>
          <tr>
            <th className={incTableTh}>Cargo</th>
            <th className={cn(incTableTh, 'max-sm:hidden')}>Personal asignado</th>
            <th className={incTableTh}>Estado</th>
            {showActions && <th className={cn(incTableTh, 'text-right!')}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const isEnabled = !item.deleted_at
            const gente = personas?.[String(item.id)]
            return (
              <tr key={item.id} className={incTableTr}>
                <td className={incTableTd}>
                  <div className={cn('flex items-center gap-3', !isEnabled && 'opacity-55')}>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary dark:bg-primary/25 dark:text-accent-light" aria-hidden>
                      <FiBriefcase />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-semibold text-content">{item.name}</div>
                      <div className="text-xs text-muted">{personas ? cuantos(gente?.length ?? 0) : 'Contando…'}</div>
                    </div>
                  </div>
                </td>
                <td className={cn(incTableTd, 'max-sm:hidden')}>
                  <Equipo gente={gente} cargando={!personas} />
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

/** Vista de tarjetas: cada cargo con su cantidad de personal y quienes lo ocupan */
export function JobGrid({ data = [], onToggleStatus, onEdit, canEdit = true, canDelete = true, personas }: JobTableProps) {
  return (
    <div className="min-h-0 flex-1 overflow-auto p-4 max-sm:p-3">
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3 p-0">
        {data.map(item => {
          const isEnabled = !item.deleted_at
          const gente = personas?.[String(item.id)]
          const n = gente?.length ?? 0
          return (
            <li
              key={item.id}
              className={cn(
                'group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_14px_30px_-16px_rgba(12,26,75,0.35)]',
                !isEnabled && 'bg-subtle'
              )}
            >
              <span aria-hidden className={cn('absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#1e3a8a,#6250d6)]', !isEnabled && 'grayscale')} />
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn('flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl text-primary dark:bg-primary/25 dark:text-accent-light', !isEnabled && 'opacity-60 grayscale')}
                  aria-hidden
                >
                  <FiBriefcase />
                </span>
                {(canEdit || canDelete) && (
                  <div className="opacity-70 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <Acciones item={item} onEdit={onEdit} onToggleStatus={onToggleStatus} canEdit={canEdit} canDelete={canDelete} />
                  </div>
                )}
              </div>
              <div className={cn('min-w-0', !isEnabled && 'opacity-60')}>
                <p className="m-0 truncate text-[15px] font-bold text-content" title={item.name}>{item.name}</p>
                <p className="m-0 mt-0.5 flex items-center gap-1.5 text-[13px] text-content-2">
                  <FiUsers className="text-muted" aria-hidden />
                  {personas ? (
                    <>
                      <strong className="font-bold text-content">{n}</strong> {n === 1 ? 'persona asignada' : 'personas asignadas'}
                    </>
                  ) : (
                    'Contando personal…'
                  )}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2.5">
                <Equipo gente={gente} cargando={!personas} />
                <Estado item={item} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
