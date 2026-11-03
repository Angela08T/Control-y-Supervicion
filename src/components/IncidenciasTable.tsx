import React from 'react'
import type { ID, Incidencia, IncidenciaStatus } from '@/types'
import { FaFilePdf, FaBan, FaPaperPlane, FaCheck, FaTimes, FaClock, FaCheckCircle, FaTimesCircle, FaUndo } from 'react-icons/fa'
import { MdBlock } from 'react-icons/md'
import { actionBtn, actions, cn, incTable, incTableTd, incTableTh, incTableTr, tableCard, tableScroll } from '@/utils/classes'

/** Los bordes del encabezado y de las filas solo llevan ancho en un lado: se anulan los demas */
const headerCell = `${incTableTh} border-x-0 border-t-0`
const bodyRow = `${incTableTr} border-x-0 border-t-0 ease-[ease]`

function formatDeletedDate(isoDate: string | null | undefined): string {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  return `Deshabilitado el ${d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })} a las ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
}

function formatAbsenceDates(item: Incidencia): string {
  if (!item.absenceStart || !item.absenceEnd) return '-'
  const fmt = (d: string): string => new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${fmt(item.absenceStart)} - ${fmt(item.absenceEnd)}`
}

interface EstadoIncidenciaProps {
  status: string | null | undefined;
  disabled: boolean;
}

function EstadoIncidencia({ status, disabled }: EstadoIncidenciaProps) {
  if (disabled) {
    return (
      <span className="inline-flex items-center gap-[5px] rounded-[12px] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.12)] px-2.5 py-1 text-[0.82rem] font-bold text-[#ef4444]">
        <MdBlock size={13} /> Deshabilitado
      </span>
    )
  }

  const estados: Record<string, { label: string; icon: React.ReactElement; color: string }> = {
    pending:  { label: 'Pendiente',  icon: <FaClock />,       color: '#f59e0b' },
    approved: { label: 'Aprobado',   icon: <FaCheckCircle />, color: '#22c55e' },
    rejected: { label: 'Rechazado',  icon: <FaTimesCircle />, color: '#ef4444' },
    draft:    { label: 'Borrador',   icon: <FaClock />,       color: '#94a3b8' },
  }
  const statusLower = status ? status.toLowerCase() : 'draft'
  const estado = estados[statusLower] || estados.draft

  return (
    <span
      className="inline-flex items-center gap-[5px] rounded-[12px] px-3 py-1 text-[0.85rem] font-semibold"
      style={{ backgroundColor: `${estado.color}20`, color: estado.color }}
    >
      {estado.icon} {estado.label}
    </span>
  )
}

export interface IncidenciasTableProps {
  data?: Incidencia[];
  onDelete: (id: ID, status: IncidenciaStatus) => void;
  onEdit: (item: Incidencia) => void;
  onSend: (id: ID) => void;
  onApprove: (id: ID) => void;
  onReject: (id: ID) => void;
  startIndex?: number;
  canDelete?: boolean;
  canSend?: boolean;
  canValidate?: boolean;
}

export default function IncidenciasTable({
  data = [],
  onDelete,
  onEdit,
  onSend,
  onApprove,
  onReject,
  startIndex = 0,
  canDelete = true,
  canSend = false,
  canValidate = false
}: IncidenciasTableProps) {
  return (
    <div className={tableCard}>
      <div className={tableScroll}>
        <table className={incTable}>
          <thead>
            <tr>
              <th className={headerCell}>#</th>
              <th className={headerCell}>Acciones</th>
              <th className={headerCell}>Estado</th>
              <th className={headerCell}>DNI</th>
              <th className={headerCell}>Asunto</th>
              <th className={headerCell}>Falta</th>
              <th className={headerCell}>Medio</th>
              <th className={headerCell}>Fecha</th>
              <th className={headerCell}>Hora</th>
              <th className={headerCell}>Turno</th>
              <th className={headerCell}>Subgerencia</th>
              <th className={headerCell}>Cargo</th>
              <th className={headerCell}>Reg. Lab</th>
              <th className={headerCell}>Jurisdicción</th>
              <th className={headerCell}>Bodycam Asignada</th>
              <th className={headerCell}>Dirigido a</th>
              <th className={headerCell}>Destinatario</th>
              <th className={headerCell}>Registrado Por</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr className={bodyRow}>
                <td colSpan={18} className={cn(incTableTd, 'text-center text-content! p-10!')}>
                  No hay incidencias registradas
                </td>
              </tr>
            )}
            {data.map((item, index) => {
              const isDisabled = !!item.deletedAt
              const isAbsence  = item.isAbsenceReport
              const itemStatus = item.status ? item.status.toLowerCase() : 'draft'
              const canSendToValidator  = !isDisabled && canSend     && item.evidences?.length > 0 && itemStatus === 'draft'
              const canValidateReport   = !isDisabled && canValidate && itemStatus === 'pending'

              // Estilo de fila según estado habilitado/deshabilitado (! porque el estilo inline anterior ganaba al hover)
              const rowTone = isDisabled && 'bg-[rgba(239,68,68,0.06)]! opacity-[0.72]'

              // Estilo de texto en celdas de una fila deshabilitada
              const cellTone = isDisabled && 'line-through text-muted!'

              return (
                <tr key={item.id} className={cn(bodyRow, rowTone)}>

                  {/* Número */}
                  <td className={cn(incTableTd, 'w-10 text-center font-bold text-muted!')}>
                    {startIndex + index + 1}
                  </td>

                  {/* Acciones */}
                  <td className={cn(incTableTd, actions)}>
                    <button title="Ver/Generar PDF" onClick={() => onEdit(item)} className={actionBtn}>
                      <FaFilePdf />
                    </button>

                    {canSendToValidator && (
                      <button title="Enviar a validador" onClick={() => onSend(item.id)} className={actionBtn}>
                        <FaPaperPlane />
                      </button>
                    )}

                    {canValidateReport && (
                      <>
                        <button title="Aprobar" onClick={() => onApprove(item.id)} className={actionBtn}>
                          <FaCheck />
                        </button>
                        <button title="Rechazar" onClick={() => onReject(item.id)} className={actionBtn}>
                          <FaTimes />
                        </button>
                      </>
                    )}

                    {canDelete && (
                      isDisabled ? (
                        <button
                          title="Habilitar incidencia"
                          onClick={() => onDelete(item.id, item.status)}
                          className={actionBtn}
                        >
                          <FaUndo />
                        </button>
                      ) : (
                        <button
                          title="Deshabilitar incidencia"
                          onClick={() => onDelete(item.id, item.status)}
                          className={actionBtn}
                        >
                          <FaBan />
                        </button>
                      )
                    )}
                  </td>

                  {/* Estado — muestra "Deshabilitado" si está eliminada */}
                  <td className={incTableTd}>
                    <div className="flex flex-col items-start gap-1">
                      <EstadoIncidencia status={item.status} disabled={isDisabled} />
                      {isDisabled && (
                        <span title={formatDeletedDate(item.deletedAt)} className="cursor-help whitespace-nowrap text-[0.7rem] text-[#94a3b8]">
                          {formatDeletedDate(item.deletedAt)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Resto de celdas con tachado si está deshabilitada */}
                  <td className={cn(incTableTd, cellTone)}>{isAbsence ? '-' : (item.dni || '-')}</td>
                  <td className={cn(incTableTd, cellTone)}>{item.asunto}</td>
                  <td className={cn(incTableTd, cellTone)}>{item.falta}</td>
                  <td className={cn(incTableTd, cellTone)}>
                    {isAbsence ? 'Reporte' : (item.medio + (item.bodycamNumber ? ` (${item.bodycamNumber})` : ''))}
                  </td>
                  <td className={cn(incTableTd, cellTone)}>{isAbsence ? formatAbsenceDates(item) : item.fechaIncidente}</td>
                  <td className={cn(incTableTd, cellTone)}>
                    {isAbsence ? (item.absenceMode === 'JUSTIFIED' ? 'Justificada' : 'Injustificada') : item.horaIncidente}
                  </td>
                  <td className={cn(incTableTd, cellTone)}>{isAbsence ? '-' : item.turno}</td>
                  <td className={cn(incTableTd, cellTone)}>{item.subgerencia || '-'}</td>
                  <td className={cn(incTableTd, cellTone)}>{item.cargo || '-'}</td>
                  <td className={cn(incTableTd, cellTone)}>{item.regLab || '-'}</td>
                  <td className={cn(incTableTd, cellTone)}>{item.jurisdiccion || '-'}</td>
                  <td className={cn(incTableTd, cellTone)}>{isAbsence ? '-' : (item.bodycamAsignadaA || '-')}</td>
                  <td className={cn(incTableTd, cellTone)}>{item.dirigidoA || '-'}</td>
                  <td className={cn(incTableTd, cellTone)}>{item.destinatario || '-'}</td>
                  <td className={cn(incTableTd, cellTone)}>{item.registradoPor || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
