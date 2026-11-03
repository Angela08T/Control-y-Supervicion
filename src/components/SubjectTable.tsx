import React from 'react'
import type { Subject } from '@/types'
import { FaEdit, FaCheckCircle, FaBan, FaInfoCircle, FaList } from 'react-icons/fa'
import { actionBtn, actions, cn, incTable, incTableTd, incTableTh, incTableTr, tableCard, tableScroll } from '@/utils/classes'

/** Los bordes del encabezado y de las filas solo llevan ancho en un lado: se anulan los demas */
const headerCell = `${incTableTh} border-x-0 border-t-0`
const bodyRow = `${incTableTr} border-x-0 border-t-0 ease-[ease]`

export interface SubjectTableProps {
  data?: Subject[];
  onToggleStatus: (item: Subject) => void;
  onEdit: (item: Subject) => void;
  startIndex?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function SubjectTable({ data = [], onToggleStatus, onEdit, startIndex = 0, canEdit = true, canDelete = true }: SubjectTableProps) {
  const showActions = canEdit || canDelete
  // Función para formatear la fecha de deshabilitación
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
    <div className={tableCard}>
      <div className={tableScroll}>
        <table className={incTable}>
          <thead>
            <tr>
              <th className={headerCell}>#</th>
              {showActions && <th className={headerCell}>Acciones</th>}
              <th className={headerCell}>Nombre del Asunto</th>
              <th className={headerCell}>Cantidad de Faltas</th>
              <th className={headerCell}>Faltas Asociadas</th>
              <th className={headerCell}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr className={bodyRow}>
                <td colSpan={showActions ? 6 : 5} className={cn(incTableTd, 'text-center text-content! p-10!')}>
                  No hay asuntos registrados
                </td>
              </tr>
            )}
            {data.map((item, index) => {
              const isEnabled = !item.deleted_at
              return (
                <tr key={item.id} className={bodyRow}>
                  <td className={cn(incTableTd, 'w-10 text-center font-bold text-muted!')}>
                    {startIndex + index + 1}
                  </td>
                  {showActions && (
                    <td className={cn(incTableTd, actions)}>
                      {canEdit && (
                        <button title="Editar" onClick={() => onEdit(item)} className={actionBtn}>
                          <FaEdit />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          title={isEnabled ? "Deshabilitar" : "Habilitar"}
                          onClick={() => onToggleStatus(item)}
                          className={actionBtn}
                        >
                          {isEnabled ? <FaBan /> : <FaCheckCircle />}
                        </button>
                      )}
                      {!canEdit && !canDelete && (
                        <span className="text-muted text-[0.85rem] italic">
                          Solo lectura
                        </span>
                      )}
                    </td>
                  )}
                  <td className={cn(incTableTd, 'font-semibold text-content!')}>
                    {item.name}
                  </td>
                  <td className={cn(incTableTd, 'text-center')}>
                    <span
                      className={cn(
                        'rounded-[12px] px-3 py-1 text-[0.85rem] font-medium',
                        item.lacks && item.lacks.length > 0 ? 'bg-[rgba(59,130,246,0.1)] text-secondary' : 'bg-[rgba(156,163,175,0.1)] text-[#9ca3af]'
                      )}
                    >
                      {item.lacks ? item.lacks.length : 0}
                    </span>
                  </td>
                  <td className={cn(incTableTd, 'max-w-[350px]')}>
                    {item.lacks && item.lacks.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.lacks.map((lack) => (
                          <span
                            key={lack.id}
                            className="inline-flex max-w-[150px] items-center gap-1 overflow-hidden whitespace-nowrap rounded-lg border border-[rgba(168,85,247,0.2)] bg-[rgba(168,85,247,0.1)] px-2 py-[3px] text-[0.75rem] font-normal text-[#a855f7] text-ellipsis"
                            title={lack.name}
                          >
                            <FaList className="shrink-0 text-[0.65rem]" />
                            <span className="overflow-hidden text-ellipsis">
                              {lack.name}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted text-[0.85rem] italic">
                        Sin faltas asociadas
                      </span>
                    )}
                  </td>
                  <td className={incTableTd}>
                    {isEnabled ? (
                      <span className="inline-flex items-center gap-[5px] font-semibold text-[#22c55e]">
                        <FaCheckCircle /> Habilitado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-[5px] font-semibold text-[#ef4444]">
                        <FaBan /> Deshabilitado
                        <span
                          title={`Deshabilitado el: ${formatDate(item.deleted_at)}`}
                          className="cursor-help text-muted text-[14px] ml-[3px]"
                        >
                          <FaInfoCircle />
                        </span>
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
