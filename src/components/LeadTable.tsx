import React from 'react'
import type { Lead } from '@/types'
import { FiSlash, FiEdit2, FiRotateCcw } from 'react-icons/fi'
import Badge from '@/components/UI/Badge'
import { actionBtn, actionBtnDanger, actions, cn, incTable, incTableTd, incTableTh, incTableTr } from '@/utils/classes'

export interface LeadTableProps {
  data?: Lead[];
  onToggleStatus: (item: Lead) => void;
  onEdit: (item: Lead) => void;
  startIndex?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function LeadTable({ data = [], onToggleStatus, onEdit, canEdit = true, canDelete = true }: LeadTableProps) {
  const showActions = canEdit || canDelete

  // Fecha de deshabilitación, para el tooltip del estado
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
    <div className="min-h-0 flex-1 overflow-auto">
      <table className={incTable}>
        <thead>
          <tr>
            <th className={incTableTh}>Nombre y apellido</th>
            <th className={incTableTh}>Estado</th>
            {showActions && <th className={cn(incTableTh, 'text-right')}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const isEnabled = !item.deleted_at
            return (
              <tr key={item.id} className={cn(incTableTr, !isEnabled && 'opacity-60')}>
                <td className={incTableTd}>
                  <div className="font-medium text-content">{`${item.name} ${item.lastname}`}</div>
                  <div className="text-xs text-muted">{item.job?.name || 'Sin cargo'}</div>
                </td>
                <td className={incTableTd}>
                  {isEnabled ? (
                    <Badge tone="success">Activo</Badge>
                  ) : (
                    <span title={`Deshabilitado el: ${formatDate(item.deleted_at)}`}>
                      <Badge tone="danger">Deshabilitado</Badge>
                    </span>
                  )}
                </td>
                {showActions && (
                  <td className={incTableTd}>
                    <div className={actions}>
                      {canEdit && (
                        <button type="button" title="Editar" aria-label="Editar" onClick={() => onEdit(item)} className={actionBtn}>
                          <FiEdit2 />
                        </button>
                      )}
                      {canDelete &&
                        (isEnabled ? (
                          <button
                            type="button"
                            title="Deshabilitar"
                            aria-label="Deshabilitar"
                            onClick={() => onToggleStatus(item)}
                            className={actionBtnDanger}
                          >
                            <FiSlash />
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Habilitar"
                            aria-label="Habilitar"
                            onClick={() => onToggleStatus(item)}
                            className={actionBtn}
                          >
                            <FiRotateCcw />
                          </button>
                        ))}
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
