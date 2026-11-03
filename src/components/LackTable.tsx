import React, { useState } from 'react'
import type { Lack } from '@/types'
import { FaEdit, FaCheckCircle, FaBan, FaInfoCircle, FaFolder, FaFileAlt, FaEye } from 'react-icons/fa'
import ModalViewContent from './ModalViewContent'
import { actionBtn, actions, cn, incTable, incTableTd, incTableTh, incTableTr, tableCard, tableScroll } from '@/utils/classes'

/** Los bordes del encabezado y de las filas solo llevan ancho en un lado: se anulan los demas */
const headerCell = `${incTableTh} border-x-0 border-t-0`
const bodyRow = `${incTableTr} border-x-0 border-t-0 ease-[ease]`

export interface LackTableProps {
  data?: Lack[];
  onToggleStatus: (item: Lack) => void;
  onEdit: (item: Lack) => void;
  startIndex?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function LackTable({ data = [], onToggleStatus, onEdit, startIndex = 0, canEdit = true, canDelete = true }: LackTableProps) {
  const showActions = canEdit || canDelete
  const [viewingContent, setViewingContent] = useState<Lack | null>(null)

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

  // Función para truncar texto largo
  const truncateText = (text: string | null | undefined, maxLength = 100): string => {
    if (!text) return 'Sin contenido'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className={tableCard}>
      <div className={tableScroll}>
        <table className={incTable}>
          <thead>
            <tr>
              <th className={cn(headerCell, 'w-[50px] min-w-[50px]')}>#</th>
              {showActions && <th className={cn(headerCell, 'w-[120px] min-w-[120px]')}>Acciones</th>}
              <th className={cn(headerCell, 'w-[280px] min-w-[280px]')}>Nombre de la Falta</th>
              <th className={cn(headerCell, 'w-[280px] min-w-[280px]')}>Asunto</th>
              <th className={cn(headerCell, 'w-[100px] min-w-[90px] text-center!')}>Artículo</th>
              <th className={cn(headerCell, 'w-[200px] min-w-[180px]')}>Descripción</th>
              <th className={cn(headerCell, 'w-[320px] min-w-[300px]')}>Contenido</th>
              <th className={cn(headerCell, 'w-[150px] min-w-[150px]')}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr className={bodyRow}>
                <td colSpan={showActions ? 8 : 7} className={cn(incTableTd, 'text-center text-content! p-10!')}>
                  No hay faltas registradas
                </td>
              </tr>
            )}
            {data.map((item, index) => {
              const isEnabled = !item.deleted_at
              return (
                <tr key={item.id} className={bodyRow}>
                  <td className={cn(incTableTd, 'w-[50px] text-center font-bold text-muted!')}>
                    {startIndex + index + 1}
                  </td>
                  {showActions && (
                    <td className={cn(incTableTd, actions, 'w-[120px]')}>
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
                  <td className={cn(incTableTd, 'font-semibold text-content! w-[280px] min-w-[280px] max-w-[280px] pr-5! align-top')}>
                    <div
                      title={item.name}
                      className="line-clamp-3 text-ellipsis leading-[1.4] [word-break:break-word] max-w-[260px] cursor-help"
                    >
                      {item.name}
                    </div>
                  </td>
                  <td className={cn(incTableTd, 'w-[280px] min-w-[280px] max-w-[280px] px-5! align-top')}>
                    {item.subject ? (
                      <div className="line-clamp-3 text-ellipsis leading-[1.4] [word-break:break-word] max-w-[240px]">
                        <span
                          className="inline-flex max-w-full items-center gap-[5px] rounded-[12px] bg-[rgba(59,130,246,0.1)] px-3 py-1 text-[0.85rem] font-medium text-secondary"
                          title={item.subject.name}
                        >
                          <FaFolder className="shrink-0 text-[0.7rem]" />
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                            {item.subject.name}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted text-[0.85rem] italic">
                        Sin asunto
                      </span>
                    )}
                  </td>
                  <td className={cn(incTableTd, 'w-[100px] min-w-[90px] pt-3! text-center align-top')}>
                    {item.article ? (
                      <span className="rounded-lg border border-[rgba(234,179,8,0.2)] bg-[rgba(234,179,8,0.1)] px-2.5 py-[3px] text-[0.8rem] font-semibold text-[#eab308]">
                        Art. {item.article}
                      </span>
                    ) : (
                      <span className="text-muted text-[0.8rem] italic">
                        -
                      </span>
                    )}
                  </td>
                  <td className={cn(incTableTd, 'w-[200px] min-w-[180px] max-w-[200px] pr-[15px]! text-[0.85rem] align-top')}>
                    {item.description ? (
                      <div className="line-clamp-2 text-ellipsis leading-[1.4]">
                        {item.description}
                      </div>
                    ) : (
                      <span className="text-muted italic">
                        Sin descripción
                      </span>
                    )}
                  </td>
                  <td className={cn(incTableTd, 'w-[320px] min-w-[300px] max-w-[320px] text-[0.85rem] align-top')}>
                    {item.content ? (
                      <div className="flex items-center gap-2.5">
                        <div className="line-clamp-3 text-ellipsis leading-[1.4] flex-1">
                          <FaFileAlt className="mr-[5px] text-[0.7rem] text-primary" />
                          {item.content}
                        </div>
                        <button
                          onClick={() => setViewingContent(item)}
                          title="Ver contenido completo"
                          className="flex cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-md border border-primary bg-[rgba(59,130,246,0.1)] px-3 py-1.5 text-[0.8rem] font-medium text-primary transition-all duration-200 ease-[ease]"
                          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.background = 'var(--primary)'
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
                            e.currentTarget.style.color = 'var(--primary)'
                          }}
                        >
                          <FaEye />
                          Ver
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted italic">
                        Sin contenido
                      </span>
                    )}
                  </td>
                  <td className={cn(incTableTd, 'w-[150px] min-w-[150px]')}>
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

      {/* Modal de vista de contenido */}
      {viewingContent && (
        <ModalViewContent
          content={viewingContent.content}
          title={`Contenido: ${viewingContent.name}`}
          onClose={() => setViewingContent(null)}
        />
      )}
    </div>
  )
}
