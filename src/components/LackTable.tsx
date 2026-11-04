import React, { useState } from 'react'
import type { Lack } from '@/types'
import { FiCheckCircle, FiEdit2, FiEye, FiSlash } from 'react-icons/fi'
import Badge from '@/components/UI/Badge'
import ModalViewContent from './ModalViewContent'
import { actionBtn, actionBtnDanger, actions, cn, incTable, incTableTd, incTableTh, incTableTr } from '@/utils/classes'

export interface LackTableProps {
  data?: Lack[];
  onToggleStatus: (item: Lack) => void;
  onEdit: (item: Lack) => void;
  startIndex?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

/** Tabla de faltas. Muestra pocos campos; el resto se ve en el formulario o en "Ver contenido". */
export default function LackTable({ data = [], onToggleStatus, onEdit, canEdit = true, canDelete = true }: LackTableProps) {
  const [viewingContent, setViewingContent] = useState<Lack | null>(null)

  // Fecha de deshabilitacion, mostrada como ayuda al pasar el cursor sobre el estado
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className={incTable}>
          <thead>
            <tr>
              <th className={incTableTh}>Nombre de la falta</th>
              <th className={cn(incTableTh, '!text-center')}>Artículo</th>
              <th className={incTableTh}>Contenido</th>
              <th className={incTableTh}>Estado</th>
              <th className={cn(incTableTh, '!text-right')}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const isEnabled = !item.deleted_at
              return (
                <tr key={item.id} className={cn(incTableTr, !isEnabled && 'opacity-60')}>
                  <td className={incTableTd}>
                    <div className="font-semibold text-content">{item.name}</div>
                    <div className="mt-0.5 text-xs text-muted">{item.subject ? item.subject.name : 'Sin asunto'}</div>
                  </td>
                  <td className={cn(incTableTd, 'text-center text-[13px]')}>
                    {item.article ? `Art. ${item.article}` : <span className="text-muted">—</span>}
                  </td>
                  <td className={cn(incTableTd, 'max-w-[360px]')}>
                    {item.content ? (
                      <div className="line-clamp-2 text-[13px]" title={item.content}>
                        {item.content}
                      </div>
                    ) : (
                      <span className="text-[13px] text-muted">Sin contenido</span>
                    )}
                  </td>
                  <td className={incTableTd}>
                    {isEnabled ? (
                      <Badge tone="success">Habilitado</Badge>
                    ) : (
                      <span title={`Deshabilitado el: ${formatDate(item.deleted_at)}`}>
                        <Badge tone="danger">Deshabilitado</Badge>
                      </span>
                    )}
                  </td>
                  <td className={cn(incTableTd, actions)}>
                      {canEdit && (
                        <button type="button" title="Editar" aria-label="Editar falta" onClick={() => onEdit(item)} className={actionBtn}>
                          <FiEdit2 aria-hidden />
                        </button>
                      )}
                      {item.content && (
                        <button
                          type="button"
                          title="Ver contenido completo"
                          aria-label="Ver contenido completo"
                          onClick={() => setViewingContent(item)}
                          className={actionBtn}
                        >
                          <FiEye aria-hidden />
                        </button>
                      )}
                      {canDelete &&
                        (isEnabled ? (
                          <button
                            type="button"
                            title="Deshabilitar"
                            aria-label="Deshabilitar falta"
                            onClick={() => onToggleStatus(item)}
                            className={actionBtnDanger}
                          >
                            <FiSlash aria-hidden />
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Habilitar"
                            aria-label="Habilitar falta"
                            onClick={() => onToggleStatus(item)}
                            className={actionBtn}
                          >
                            <FiCheckCircle aria-hidden />
                          </button>
                        ))}
                      {!canEdit && !canDelete && !item.content && <span className="text-[13px] text-muted">Solo lectura</span>}
                    </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de vista de contenido (componente aparte, pendiente de estilo) */}
      {viewingContent && (
        <ModalViewContent
          content={viewingContent.content}
          title={`Contenido: ${viewingContent.name}`}
          onClose={() => setViewingContent(null)}
        />
      )}
    </>
  )
}
