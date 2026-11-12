import React, { useState } from 'react'
import type { Lack } from '@/types'
import { FiCheckCircle, FiEdit2, FiFileText, FiSlash } from 'react-icons/fi'
import ModalViewContent from './ModalViewContent'
import { actionBtn, actionBtnDanger, cn } from '@/utils/classes'
import { colorAsunto } from './SubjectTable'
import { nombreCorto } from '@/pages/Dashboard/asuntos'
import { TemplateText, marcadoresEn } from './lackTemplate'

export interface LackTableProps {
  data?: Lack[];
  onToggleStatus: (item: Lack) => void;
  onEdit: (item: Lack) => void;
  startIndex?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

/** Fecha corta de deshabilitacion */
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Registro de faltas, como un indice normativo: el articulo en un sello a la izquierda, la falta con
 * su asunto y descripcion, y un extracto de la plantilla del informe con los marcadores resaltados.
 */
export default function LackTable({ data = [], onToggleStatus, onEdit, canEdit = true, canDelete = true }: LackTableProps) {
  const [viewingContent, setViewingContent] = useState<Lack | null>(null)

  return (
    <>
      <div className="min-h-0 flex-1 overflow-auto">
        <ol className="m-0 list-none p-0">
          {data.map((item) => {
            const isEnabled = !item.deleted_at
            const asunto = item.subject?.name
            const color = asunto ? colorAsunto(asunto) : 'var(--border-strong)'
            const marcadores = marcadoresEn(item.content)

            return (
              <li
                key={item.id}
                className={cn(
                  'group grid grid-cols-[88px_minmax(0,1fr)_minmax(0,1.1fr)_auto] items-start gap-5 border-b border-line px-5 py-4 transition-colors last:border-b-0 hover:bg-card-hover',
                  'max-xl:grid-cols-[88px_minmax(0,1fr)_auto] max-sm:grid-cols-[64px_minmax(0,1fr)] max-sm:gap-3 max-sm:px-3',
                  !isEnabled && 'bg-subtle/60'
                )}
              >
                {/* Sello del articulo */}
                <div
                  className={cn(
                    'flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center',
                    item.article ? 'border-primary/35 bg-primary/5 dark:border-accent-light/35 dark:bg-primary/12' : 'border-line bg-subtle',
                    !isEnabled && 'opacity-50 grayscale'
                  )}
                  aria-label={item.article ? `Artículo ${item.article}` : 'Sin artículo'}
                >
                  <span className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">Art.</span>
                  <span className={cn('text-[17px] leading-tight font-bold tabular-nums max-sm:text-sm', item.article ? 'text-primary dark:text-accent-light' : 'text-muted')}>
                    {item.article || '—'}
                  </span>
                </div>

                {/* La falta: nombre, asunto y descripcion */}
                <div className={cn('min-w-0', !isEnabled && 'opacity-60')}>
                  <h3 className="m-0 text-[15px] leading-snug font-bold text-content">{item.name}</h3>
                  <p className="m-0 mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-subtle py-0.5 pr-2 pl-1.5 text-xs font-medium text-content-2" title={asunto}>
                    <span className="size-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
                    <span className="truncate">{asunto ? nombreCorto(asunto) : 'Sin asunto'}</span>
                  </p>
                  {item.description && <p className="m-0 mt-2 line-clamp-2 text-[13px] leading-relaxed text-content-2">{item.description}</p>}
                  {/* En pantallas medianas el extracto va aqui, debajo */}
                  {item.content && (
                    <p className="m-0 mt-2 hidden line-clamp-2 text-[13px] leading-relaxed text-content-2 max-xl:block max-sm:hidden">
                      <TemplateText texto={item.content} />
                    </p>
                  )}
                </div>

                {/* Extracto de la plantilla (pantallas anchas) */}
                <div className={cn('min-w-0 max-xl:hidden', !isEnabled && 'opacity-60')}>
                  {item.content ? (
                    <button
                      type="button"
                      onClick={() => setViewingContent(item)}
                      className="block w-full cursor-pointer rounded-xl border border-line bg-subtle/70 px-3.5 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-subtle"
                      title="Ver la plantilla completa"
                    >
                      <span className="mb-1 flex items-center justify-between gap-2 text-[10px] font-bold tracking-[0.12em] text-muted uppercase">
                        <span className="inline-flex items-center gap-1"><FiFileText aria-hidden /> Plantilla del informe</span>
                        <span className="font-semibold tracking-normal normal-case">{marcadores.length} {marcadores.length === 1 ? 'dato' : 'datos'}</span>
                      </span>
                      <span className="line-clamp-3 text-[13px] leading-relaxed text-content-2">
                        <TemplateText texto={item.content} />
                      </span>
                    </button>
                  ) : (
                    <span className="text-[13px] text-muted">Sin plantilla</span>
                  )}
                </div>

                {/* Estado y acciones */}
                <div className="flex flex-col items-end gap-2 max-sm:col-span-2 max-sm:flex-row max-sm:items-center max-sm:justify-between max-sm:pl-[76px]">
                  {isEnabled ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-lime-ink">
                      <span className="size-1.5 rounded-full bg-success" aria-hidden /> Habilitada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-red-ink" title={`Deshabilitada el ${formatDate(item.deleted_at)}`}>
                      <span className="size-1.5 rounded-full bg-danger" aria-hidden /> Deshabilitada
                    </span>
                  )}
                  <div className="flex items-center gap-0.5">
                    {item.content && (
                      <button type="button" title="Ver plantilla" aria-label={`Ver la plantilla de ${item.name}`} onClick={() => setViewingContent(item)} className={actionBtn}>
                        <FiFileText aria-hidden />
                      </button>
                    )}
                    {canEdit && (
                      <button type="button" title="Editar" aria-label={`Editar ${item.name}`} onClick={() => onEdit(item)} className={actionBtn}>
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
                        {isEnabled ? <FiSlash aria-hidden /> : <FiCheckCircle aria-hidden />}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {viewingContent && (
        <ModalViewContent
          content={viewingContent.content}
          title={viewingContent.name}
          article={viewingContent.article}
          subject={viewingContent.subject?.name}
          onClose={() => setViewingContent(null)}
        />
      )}
    </>
  )
}
