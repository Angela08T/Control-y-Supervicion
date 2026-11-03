import React from 'react'
import type { BodycamView } from '@/types'
import { FaEdit, FaCheckCircle, FaBan, FaInfoCircle } from 'react-icons/fa'
import { actionBtn, actions, cn, incTable, incTableTd, incTableTh, incTableTr, tableCard, tableScroll } from '@/utils/classes'

/** Fila que la tabla necesita (los resultados de busqueda no traen `cam`) */
export type BodycamTableRow = Pick<BodycamView, 'id' | 'name' | 'serie' | 'deleted_at'>;

/** Los bordes del encabezado y de las filas solo llevan ancho en un lado: se anulan los demas */
const headerCell = `${incTableTh} border-x-0 border-t-0 py-4! px-3.5! text-[13px]!`
const bodyRow = `${incTableTr} border-x-0 border-t-0 ease-[ease]`
/** Celdas de bodycam: mas padding y letra de 15px (antes .bodycam-table) */
const cell = `${incTableTd} py-4! px-3.5! text-[15px]`

export interface BodycamTableProps {
  data?: BodycamTableRow[];
  onToggleStatus: (item: BodycamTableRow) => void;
  onEdit: (item: BodycamTableRow) => void;
  startIndex?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function BodycamTable({ data = [], onToggleStatus, onEdit, startIndex = 0, canEdit = true, canDelete = true }: BodycamTableProps) {
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
        <table className={cn(incTable, 'text-[15px]!')}>
          <thead>
            <tr>
              <th className={headerCell}>#</th>
              {showActions && <th className={headerCell}>Acciones</th>}
              <th className={headerCell}>Nombre</th>
              <th className={headerCell}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr className={bodyRow}>
                <td colSpan={showActions ? 4 : 3} className={cn(cell, 'text-center text-content! p-10!')}>
                  No hay bodycams registradas
                </td>
              </tr>
            )}
            {data.map((item, index) => {
              const isEnabled = !item.deleted_at
              return (
                <tr key={item.id} className={bodyRow}>
                  <td className={cn(cell, 'w-10 text-center font-bold text-muted!')}>
                    {startIndex + index + 1}
                  </td>
                  {showActions && (
                    <td className={cn(cell, actions)}>
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
                  <td className={cell}>{item.name}</td>
                  <td className={cell}>
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
