import React from 'react'
import type { Subject } from '@/types'
import { FiCheckCircle, FiEdit2, FiSlash } from 'react-icons/fi'
import Badge from '@/components/UI/Badge'
import { actionBtn, actionBtnDanger, actions, cn, incTable, incTableTd, incTableTh, incTableTr } from '@/utils/classes'

export interface SubjectTableProps {
  data?: Subject[];
  onToggleStatus: (item: Subject) => void;
  onEdit: (item: Subject) => void;
  startIndex?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

/** Tabla de asuntos. La tarjeta, el estado vacio y la carga los pone la pagina. */
export default function SubjectTable({ data = [], onToggleStatus, onEdit, canEdit = true, canDelete = true }: SubjectTableProps) {
  const showActions = canEdit || canDelete

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
    <div className="overflow-x-auto">
      <table className={incTable}>
        <thead>
          <tr>
            <th className={incTableTh}>Nombre del asunto</th>
            <th className={incTableTh}>Faltas asociadas</th>
            <th className={incTableTh}>Estado</th>
            {showActions && <th className={cn(incTableTh, '!text-right')}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const isEnabled = !item.deleted_at
            const lackNames = item.lacks?.map((lack) => lack.name) ?? []
            const lackCount = lackNames.length
            return (
              <tr key={item.id} className={cn(incTableTr, !isEnabled && 'opacity-60')}>
                <td className={cn(incTableTd, 'font-semibold text-content')}>{item.name}</td>
                <td className={cn(incTableTd, 'max-w-[360px]')}>
                  {lackCount > 0 ? (
                    <>
                      <div className="line-clamp-2 text-[13px] text-content-2" title={lackNames.join(', ')}>
                        {lackNames.join(', ')}
                      </div>
                      <div className="text-xs text-muted">{lackCount === 1 ? '1 falta' : `${lackCount} faltas`}</div>
                    </>
                  ) : (
                    <span className="text-[13px] text-muted">Sin faltas asociadas</span>
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
                {showActions && (
                  <td className={cn(incTableTd, actions)}>
                    {canEdit && (
                      <button type="button" title="Editar" aria-label="Editar asunto" onClick={() => onEdit(item)} className={actionBtn}>
                        <FiEdit2 aria-hidden />
                      </button>
                    )}
                    {canDelete &&
                      (isEnabled ? (
                        <button
                          type="button"
                          title="Deshabilitar"
                          aria-label="Deshabilitar asunto"
                          onClick={() => onToggleStatus(item)}
                          className={actionBtnDanger}
                        >
                          <FiSlash aria-hidden />
                        </button>
                      ) : (
                        <button
                          type="button"
                          title="Habilitar"
                          aria-label="Habilitar asunto"
                          onClick={() => onToggleStatus(item)}
                          className={actionBtn}
                        >
                          <FiCheckCircle aria-hidden />
                        </button>
                      ))}
                    {!canEdit && !canDelete && <span className="text-[13px] text-muted">Solo lectura</span>}
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
