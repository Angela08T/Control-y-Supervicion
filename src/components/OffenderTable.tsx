import React from 'react'
import type { ISODateString, Offender } from '@/types'
import { FaEdit, FaCheckCircle, FaBan, FaInfoCircle } from 'react-icons/fa'
import { actionBtn, actions, cn, incTable, incTableTd, incTableTh, incTableTr, tableCard, tableScroll } from '@/utils/classes'

/** Los bordes del encabezado y de las filas solo llevan ancho en un lado: se anulan los demas */
const headerCell = `${incTableTh} border-x-0 border-t-0`
const bodyRow = `${incTableTr} border-x-0 border-t-0 ease-[ease]`

/** Offender row; `deleted_at` is read by the table but not selected by GET /offender. */
export type OffenderRow = Offender & { deleted_at?: ISODateString | null };

export interface OffenderTableProps {
  data?: OffenderRow[];
  onToggleStatus: (item: OffenderRow) => void;
  onEdit: (item: OffenderRow) => void;
  startIndex?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function OffenderTable({ data = [], onToggleStatus, onEdit, startIndex = 0, canEdit = true, canDelete = true }: OffenderTableProps) {
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

  // Configuración de colores para turnos
  const shiftConfig: Record<string, { color: string; bg: string }> = {
    'Mañana': { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    'Tarde': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    'Noche': { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' }
  }

  return (
    <div className={tableCard}>
      <div className={tableScroll}>
        <table className={incTable}>
          <thead>
            <tr>
              <th className={headerCell}>#</th>
              {showActions && <th className={headerCell}>Acciones</th>}
              <th className={headerCell}>Nombre</th>
              <th className={headerCell}>Apellido</th>
              <th className={headerCell}>DNI</th>
              <th className={headerCell}>Cargo</th>
              <th className={headerCell}>Régimen</th>
              <th className={headerCell}>Turno</th>
              <th className={headerCell}>Subgerencia</th>
              <th className={headerCell}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr className={bodyRow}>
                <td colSpan={showActions ? 10 : 9} className={cn(incTableTd, 'text-center text-content! p-10!')}>
                  No hay infractores registrados
                </td>
              </tr>
            )}
            {data.map((item, index) => {
              const isEnabled = !item.deleted_at
              const shiftStyle = shiftConfig[item.shift] || { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' }

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
                  <td className={cn(incTableTd, 'font-semibold text-content!')}>{item.name}</td>
                  <td className={cn(incTableTd, 'font-semibold text-content!')}>{item.lastname}</td>
                  <td className={incTableTd}>
                    <span className="rounded-lg bg-[rgba(99,102,241,0.1)] px-2.5 py-[3px] text-[0.85rem] font-medium text-[#6366f1] [font-family:monospace]">
                      {item.dni}
                    </span>
                  </td>
                  <td className={incTableTd}>
                    <span className="rounded-[12px] bg-[rgba(59,130,246,0.1)] px-3 py-1 text-[0.85rem] font-medium text-secondary">
                      {item.job || 'Sin cargo'}
                    </span>
                  </td>
                  <td className={incTableTd}>
                    <span className="text-[0.85rem] text-content-2">
                      {item.regime || '-'}
                    </span>
                  </td>
                  <td className={incTableTd}>
                    <span
                      className="rounded-[12px] px-3 py-1 text-[0.85rem] font-medium"
                      style={{ backgroundColor: shiftStyle.bg, color: shiftStyle.color }}
                    >
                      {item.shift || '-'}
                    </span>
                  </td>
                  <td className={cn(incTableTd, 'text-[0.85rem]')}>
                    {item.subgerencia || '-'}
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
