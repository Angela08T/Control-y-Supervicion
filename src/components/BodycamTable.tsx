import type { BodycamView, Cam } from '@/types'
import { FiEdit2, FiRotateCcw, FiSlash } from 'react-icons/fi'
import Badge from '@/components/UI/Badge'
import { actionBtn, actionBtnDanger, actions, cn, incTable, incTableTd, incTableTh, incTableTr } from '@/utils/classes'

/** Fila que la tabla necesita (los resultados de busqueda traen el mismo subconjunto) */
export type BodycamTableRow = Pick<BodycamView, 'id' | 'name' | 'serie' | 'cam' | 'deleted_at'>

const camLabels: Record<Cam, string> = {
  BODYCAM: 'Bodycam',
  CAMERA: 'Cámara',
  RADIO: 'Radio',
  PHONE: 'Teléfono'
}

export interface BodycamTableProps {
  data?: BodycamTableRow[];
  onToggleStatus: (item: BodycamTableRow) => void;
  onEdit: (item: BodycamTableRow) => void;
  /** Ya no se muestra numeración de fila; se mantiene por compatibilidad con la página */
  startIndex?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

/** Solo la tabla: la tarjeta, el estado vacío y la paginación los pone la página. */
export default function BodycamTable({ data = [], onToggleStatus, onEdit, canEdit = true, canDelete = true }: BodycamTableProps) {
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
    <div className="overflow-x-auto">
      <table className={incTable}>
        <thead>
          <tr>
            <th className={incTableTh}>Dispositivo</th>
            <th className={incTableTh}>Tipo</th>
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
                  <div className="font-medium text-content">{item.name}</div>
                  {item.serie && <div className="text-xs text-muted">{item.serie}</div>}
                </td>
                <td className={incTableTd}>
                  {item.cam ? <Badge tone="info">{camLabels[item.cam]}</Badge> : <span className="text-muted">Sin tipo</span>}
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
                  <td className={incTableTd}>
                    <div className={actions}>
                      {canEdit && (
                        <button
                          type="button"
                          title="Editar"
                          aria-label={`Editar ${item.name}`}
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
                          aria-label={`${isEnabled ? 'Deshabilitar' : 'Habilitar'} ${item.name}`}
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
