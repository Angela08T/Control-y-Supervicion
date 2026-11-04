import React, { useState } from 'react'
import type { ID, Incidencia, IncidenciaStatus } from '@/types'
import { FiCheck, FiFileText, FiSend, FiX } from 'react-icons/fi'
import { StatusBadge } from '@/components/UI/Badge'
import { EmptyState } from '@/components/UI/EmptyState'
import IncidenciaDetailDrawer from '@/components/IncidenciaDetailDrawer'
import { actionBtn, actionBtnDanger, actions, cardClass, cn, incTable, incTableTd, incTableTh, incTableTr } from '@/utils/classes'

const DASH = '—'

const TURNOS: Record<string, string> = {
  M: 'Mañana',
  T: 'Tarde',
  N: 'Noche',
  MAÑANA: 'Mañana',
  TARDE: 'Tarde',
  NOCHE: 'Noche',
}

/** Turno en sentence case para mostrar (los datos pueden venir en mayusculas o como inicial). */
function formatTurno(turno?: string | null): string {
  const v = (turno ?? '').trim()
  if (!v) return DASH
  return TURNOS[v.toUpperCase()] ?? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
}

function formatAbsenceDates(item: Incidencia): string {
  if (!item.absenceStart || !item.absenceEnd) return DASH
  const fmt = (d: string): string => new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${fmt(item.absenceStart)} - ${fmt(item.absenceEnd)}`
}

/** Texto de la celda de medio: bodycam asignada o tipo de medio */
function medioLabel(item: Incidencia): string {
  if (item.isAbsenceReport) return 'Reporte'
  if (item.bodycamNumber) return `Bodycam ${item.bodycamNumber}`
  return item.medio || DASH
}

/** Detiene la propagacion para que el clic en un boton no abra el panel */
const stop = (action: () => void) => (e: React.MouseEvent) => {
  e.stopPropagation()
  action()
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
  canDelete = true,
  canSend = false,
  canValidate = false
}: IncidenciasTableProps) {
  const [selectedId, setSelectedId] = useState<ID | null>(null)
  const selected = selectedId === null ? null : data.find(item => item.id === selectedId) ?? null

  /** Reglas de acciones por fila (las mismas para la fila y el panel) */
  const flagsOf = (item: Incidencia) => {
    const itemStatus = item.status ? item.status.toLowerCase() : 'draft'
    return {
      isDisabled: !!item.deletedAt,
      canSendToValidator: !item.deletedAt && canSend && item.evidences?.length > 0 && itemStatus === 'draft',
      canValidateReport: !item.deletedAt && canValidate && itemStatus === 'pending',
    }
  }

  const onRowKey = (e: React.KeyboardEvent<HTMLTableRowElement>, id: ID) => {
    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      setSelectedId(id)
    }
  }

  return (
    <>
      <div className={cardClass}>
        {data.length === 0 ? (
          <EmptyState
            title="No hay incidencias"
            description="Prueba cambiando los filtros o agrega una nueva con el botón “Nueva incidencia”."
          />
        ) : (
          <div className="max-h-[calc(100vh-300px)] min-h-0 overflow-y-auto">
            <table className={cn(incTable, 'table-fixed')}>
              <thead>
                <tr>
                  <th className={cn(incTableTh, 'w-[120px]')}>Estado</th>
                  <th className={cn(incTableTh, 'w-[190px]')}>Infractor</th>
                  <th className={incTableTh}>Falta</th>
                  <th className={cn(incTableTh, 'w-[110px]')}>Fecha</th>
                  <th className={cn(incTableTh, 'w-[130px]')}>Medio</th>
                  <th className={cn(incTableTh, 'w-[150px]')}>Registrado por</th>
                  <th className={cn(incTableTh, 'w-[168px] text-right')}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.map(item => {
                  const { isDisabled, canSendToValidator, canValidateReport } = flagsOf(item)
                  const isAbsence = item.isAbsenceReport

                  return (
                    <tr
                      key={item.id}
                      tabIndex={0}
                      onClick={() => setSelectedId(item.id)}
                      onKeyDown={e => onRowKey(e, item.id)}
                      className={cn(
                        incTableTr,
                        'cursor-pointer focus-visible:bg-subtle focus-visible:outline-none',
                        isDisabled && 'opacity-60'
                      )}
                    >
                      {/* Estado */}
                      <td className={incTableTd}>
                        <StatusBadge status={item.status} disabled={isDisabled} />
                      </td>

                      {/* Infractor: nombre, o DNI si no hay nombre */}
                      <td className={incTableTd}>
                        <div className="min-w-0">
                          <p
                            className="m-0 truncate text-sm font-medium text-content"
                            title={item.nombreCompleto || item.dni || DASH}
                          >
                            {item.nombreCompleto || item.dni || DASH}
                          </p>
                          {item.nombreCompleto && item.dni && (
                            <p className="m-0 truncate text-xs text-muted">{item.dni}</p>
                          )}
                        </div>
                      </td>

                      {/* Falta y asunto */}
                      <td className={incTableTd}>
                        <div className="min-w-0">
                          <p className="m-0 truncate text-sm font-medium text-content" title={item.falta || DASH}>
                            {item.falta || DASH}
                          </p>
                          <p className="m-0 line-clamp-1 text-xs text-muted" title={item.asunto || undefined}>
                            {item.asunto || DASH}
                          </p>
                        </div>
                      </td>

                      {/* Fecha, hora y turno */}
                      <td className={incTableTd}>
                        <p className="m-0 text-sm text-content">
                          {isAbsence ? formatAbsenceDates(item) : item.fechaIncidente || DASH}
                        </p>
                        <p className="m-0 truncate text-xs text-muted">
                          {isAbsence
                            ? item.absenceMode === 'JUSTIFIED' ? 'Justificada' : 'Injustificada'
                            : `${item.horaIncidente || DASH} · ${formatTurno(item.turno)}`}
                        </p>
                      </td>

                      {/* Medio */}
                      <td className={cn(incTableTd, 'text-sm')}>
                        <span className="block truncate" title={medioLabel(item)}>{medioLabel(item)}</span>
                      </td>

                      {/* Registrado por */}
                      <td className={cn(incTableTd, 'text-sm')}>
                        <span className="block truncate" title={item.registradoPor || DASH}>{item.registradoPor || DASH}</span>
                      </td>

                      {/* Acciones */}
                      <td className={incTableTd}>
                        <div className={actions}>
                          <button
                            type="button"
                            title="Ver PDF"
                            aria-label="Ver PDF"
                            onClick={stop(() => onEdit(item))}
                            className={actionBtn}
                          >
                            <FiFileText aria-hidden />
                          </button>

                          {canSendToValidator && (
                            <button
                              type="button"
                              title="Enviar a validación"
                              aria-label="Enviar a validación"
                              onClick={stop(() => onSend(item.id))}
                              className={actionBtn}
                            >
                              <FiSend aria-hidden />
                            </button>
                          )}

                          {canValidateReport && (
                            <>
                              <button
                                type="button"
                                title="Aprobar"
                                aria-label="Aprobar"
                                onClick={stop(() => onApprove(item.id))}
                                className={actionBtn}
                              >
                                <FiCheck aria-hidden />
                              </button>
                              <button
                                type="button"
                                title="Rechazar"
                                aria-label="Rechazar"
                                onClick={stop(() => onReject(item.id))}
                                className={actionBtnDanger}
                              >
                                <FiX aria-hidden />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <IncidenciaDetailDrawer
          item={selected}
          onClose={() => setSelectedId(null)}
          onEdit={onEdit}
          onDelete={onDelete}
          onSend={onSend}
          onApprove={onApprove}
          onReject={onReject}
          canDelete={canDelete}
          canSendToValidator={flagsOf(selected).canSendToValidator}
          canValidateReport={flagsOf(selected).canValidateReport}
        />
      )}
    </>
  )
}
