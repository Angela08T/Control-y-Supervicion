import type { ISODateString, Offender } from '@/types'
import { FiEdit2, FiRotateCcw, FiSlash } from 'react-icons/fi'
import Badge from '@/components/UI/Badge'
import { actionBtn, actionBtnDanger, actions, cn, incTable, incTableTd, incTableTh, incTableTr } from '@/utils/classes'

/** Offender row; `deleted_at` is read by the table but not selected by GET /offender. */
export type OffenderRow = Offender & { deleted_at?: ISODateString | null };

export interface OffenderTableProps {
  data?: OffenderRow[];
  onToggleStatus: (item: OffenderRow) => void;
  onEdit: (item: OffenderRow) => void;
  /** Ya no se muestra numeración de fila; se mantiene por compatibilidad con la página */
  startIndex?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

/** Solo la tabla: la tarjeta, el estado vacío y la paginación los pone la página. */
export default function OffenderTable({ data = [], onToggleStatus, onEdit, canEdit = true, canDelete = true }: OffenderTableProps) {
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
    <div className="min-h-0 flex-1 overflow-auto">
      <table className={incTable}>
        <thead>
          <tr>
            <th className={incTableTh}>Infractor</th>
            <th className={incTableTh}>Cargo</th>
            <th className={incTableTh}>Subgerencia</th>
            <th className={incTableTh}>Régimen</th>
            <th className={incTableTh}>Estado</th>
            {showActions && <th className={cn(incTableTh, 'text-right!')}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const isEnabled = !item.deleted_at
            return (
              <tr key={item.id} className={cn(incTableTr, !isEnabled && 'opacity-60')}>
                <td className={incTableTd}>
                  <div className="font-medium text-content">
                    {item.name} {item.lastname}
                  </div>
                  <div className="text-xs text-muted tabular-nums">DNI {item.dni}</div>
                </td>
                <td className={incTableTd}>
                  <div className="text-content-2">{item.job || 'Sin cargo'}</div>
                  <div className="text-xs text-muted">Turno {item.shift || '-'}</div>
                </td>
                <td className={cn(incTableTd, 'min-w-[180px]')}>{item.subgerencia || '-'}</td>
                <td className={incTableTd}>{item.regime || '-'}</td>
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
                  <td className={incTableTd}>
                    <div className={actions}>
                      {canEdit && (
                        <button
                          type="button"
                          title="Editar"
                          aria-label={`Editar a ${item.name} ${item.lastname}`}
                          onClick={() => onEdit(item)}
                          className={actionBtn}
                        >
                          <FiEdit2 aria-hidden />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          title={isEnabled ? 'Deshabilitar' : 'Habilitar'}
                          aria-label={`${isEnabled ? 'Deshabilitar' : 'Habilitar'} a ${item.name} ${item.lastname}`}
                          onClick={() => onToggleStatus(item)}
                          className={isEnabled ? actionBtnDanger : actionBtn}
                        >
                          {isEnabled ? <FiSlash aria-hidden /> : <FiRotateCcw aria-hidden />}
                        </button>
                      )}
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
