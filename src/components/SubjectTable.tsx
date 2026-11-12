import React, { useState } from 'react'
import type { Subject } from '@/types'
import { FiCheckCircle, FiChevronDown, FiEdit2, FiFileText, FiSlash } from 'react-icons/fi'
import { actionBtn, actionBtnDanger, cn } from '@/utils/classes'
import { ASUNTOS, nombreCorto } from '@/pages/Dashboard/asuntos'

export interface SubjectTableProps {
  data?: Subject[];
  onToggleStatus: (item: Subject) => void;
  onEdit: (item: Subject) => void;
  startIndex?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

/** Color del asunto (los conocidos tienen el suyo; el resto usa el azul de datos) */
export const colorAsunto = (nombre: string) => ASUNTOS[nombre]?.color ?? 'var(--viz-accent)'

/** Fecha corta de deshabilitacion */
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Catalogo de asuntos en acordeon: cada fila muestra el asunto, cuantas faltas agrupa (con una barra
 * proporcional) y su estado; al abrirla se ven las faltas numeradas.
 */
export default function SubjectTable({ data = [], onToggleStatus, onEdit, startIndex = 0, canEdit = true, canDelete = true }: SubjectTableProps) {
  // El primero abierto al cargar; luego el usuario abre y cierra los que quiera
  const [abiertos, setAbiertos] = useState<Set<string>>(() => new Set(data[0] ? [String(data[0].id)] : []))
  const maxFaltas = Math.max(1, ...data.map(s => s.lacks?.length ?? 0))

  const alternar = (id: string) =>
    setAbiertos(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  return (
    <div className="min-h-0 flex-1 overflow-auto p-3 max-sm:p-2">
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {data.map((item, i) => {
          const id = String(item.id)
          const isEnabled = !item.deleted_at
          const abierto = abiertos.has(id)
          const faltas = item.lacks ?? []
          const color = colorAsunto(item.name)
          const corto = nombreCorto(item.name)
          const panelId = `asunto-${id}`

          return (
            <li
              key={item.id}
              className={cn(
                'overflow-hidden rounded-2xl border bg-surface transition-[border-color,box-shadow] duration-200',
                abierto ? 'border-line-strong shadow-[0_12px_28px_-18px_rgba(12,26,75,0.4)]' : 'border-line hover:border-line-strong',
                !isEnabled && 'bg-subtle'
              )}
              style={{ borderLeft: `4px solid ${isEnabled ? color : 'var(--border-strong)'}` }}
            >
              <div className="flex items-center gap-3 px-4 py-3 max-sm:flex-wrap max-sm:px-3">
                {/* Encabezado clicable: abre y cierra la lista de faltas */}
                <button
                  type="button"
                  aria-expanded={abierto}
                  aria-controls={panelId}
                  onClick={() => alternar(id)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3.5 border-none bg-transparent p-0 text-left"
                >
                  <span
                    className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-content tabular-nums', !isEnabled && 'text-muted')}
                    style={{ background: `color-mix(in srgb, ${isEnabled ? color : 'var(--border-strong)'} 18%, transparent)` }}
                    aria-hidden
                  >
                    {String(startIndex + i + 1).padStart(2, '0')}
                  </span>
                  <span className={cn('min-w-0 flex-1', !isEnabled && 'opacity-60')}>
                    <span className="block truncate text-[15px] font-bold text-content" title={item.name}>{corto}</span>
                    {corto !== item.name && <span className="block truncate text-xs text-muted" title={item.name}>{item.name}</span>}
                  </span>
                  {/* Faltas: numero + barra proporcional al asunto con mas faltas */}
                  <span className="flex w-[150px] shrink-0 flex-col gap-1 max-md:hidden">
                    <span className="text-xs text-content-2">
                      <strong className="font-bold text-content tabular-nums">{faltas.length}</strong> {faltas.length === 1 ? 'falta' : 'faltas'}
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-r-full bg-subtle">
                      <span
                        className="block h-full rounded-r-full transition-[width] duration-500"
                        style={{ width: `${(faltas.length / maxFaltas) * 100}%`, background: isEnabled ? color : 'var(--viz-muted)' }}
                      />
                    </span>
                  </span>
                  <FiChevronDown className={cn('shrink-0 text-lg text-muted transition-transform duration-200', abierto && 'rotate-180')} aria-hidden />
                </button>

                <div className="flex shrink-0 items-center gap-2 max-sm:w-full max-sm:justify-between max-sm:pl-[54px]">
                  <span className="text-xs text-content-2 md:hidden">
                    <strong className="font-bold text-content">{faltas.length}</strong> faltas
                  </span>
                  {isEnabled ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-semibold text-lime-ink">
                      <span className="size-1.5 rounded-full bg-success" aria-hidden /> Habilitado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-red-ink" title={`Deshabilitado el ${formatDate(item.deleted_at)}`}>
                      <span className="size-1.5 rounded-full bg-danger" aria-hidden /> Deshabilitado
                    </span>
                  )}
                  {(canEdit || canDelete) && (
                    <span className="flex items-center gap-0.5">
                      {canEdit && (
                        <button type="button" title="Editar" aria-label={`Editar el asunto ${corto}`} onClick={() => onEdit(item)} className={actionBtn}>
                          <FiEdit2 aria-hidden />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          title={isEnabled ? 'Deshabilitar' : 'Habilitar'}
                          aria-label={`${isEnabled ? 'Deshabilitar' : 'Habilitar'} el asunto ${corto}`}
                          onClick={() => onToggleStatus(item)}
                          className={isEnabled ? actionBtnDanger : cn(actionBtn, 'text-lime-ink hover:bg-success/12 hover:text-lime-ink')}
                        >
                          {isEnabled ? <FiSlash aria-hidden /> : <FiCheckCircle aria-hidden />}
                        </button>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Faltas del asunto */}
              {abierto && (
                <div id={panelId} className="border-t border-dashed border-line px-4 pt-3 pb-4 animate-[fadeInSoft_0.2s_ease-out] max-sm:px-3">
                  {faltas.length === 0 ? (
                    <p className="m-0 flex items-center gap-2 rounded-xl bg-subtle px-3.5 py-3 text-[13px] text-muted">
                      <FiFileText aria-hidden />
                      Este asunto aún no tiene faltas. Se asocian desde la sección Faltas.
                    </p>
                  ) : (
                    <ol className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-1 p-0 max-md:grid-cols-1">
                      {faltas.map((f, fi) => (
                        <li key={f.id ?? fi} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-content transition-colors hover:bg-subtle">
                          <span
                            className="mt-px flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md px-1 text-[10px] font-bold tabular-nums"
                            style={{ background: `color-mix(in srgb, ${isEnabled ? color : 'var(--border-strong)'} 18%, transparent)` }}
                            aria-hidden
                          >
                            {fi + 1}
                          </span>
                          <span className="min-w-0 leading-snug">{f.name}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
