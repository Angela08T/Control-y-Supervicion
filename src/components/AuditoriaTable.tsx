import React from 'react';
import type { Action, Audit, Status } from '@/types';
import { cn, incTable, incTableTd, incTableTh, incTableTr, tableCard, tableScroll } from '@/utils/classes';

/** Los bordes del encabezado y de las filas solo llevan ancho en un lado: se anulan los demas */
const headerCell = `${incTableTh} border-x-0 border-t-0`;
const bodyRow = `${incTableTr} border-x-0 border-t-0 ease-[ease]`;

// Función para formatear fecha
function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

/** Badges (antes .badge + .badge-*) */
const badgeBase =
  'inline-block rounded-[12px] border px-3 py-1 text-[11px] font-semibold uppercase leading-[1.5] tracking-[0.5px]';

const badgeVariant = {
  success: 'border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.15)] text-success',
  danger: 'border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.15)] text-danger',
  warning: 'border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.15)] text-warning',
  info: 'border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.15)] text-secondary',
  primary: 'border-[rgba(30,58,138,0.3)] bg-[rgba(30,58,138,0.15)] text-primary',
  secondary: 'border-[rgba(100,116,139,0.3)] bg-[rgba(100,116,139,0.15)] text-muted',
  default: 'border-[rgba(148,163,184,0.3)] bg-[rgba(148,163,184,0.15)] text-content-2',
};

// Función para obtener badge de estado
function getStatusBadge(status: Status): React.ReactElement {
  const statusColors: Record<string, string> = {
    SUCCESS: badgeVariant.success,
    BLOCKED: badgeVariant.danger,
    ERROR: badgeVariant.warning,
    FAILED: badgeVariant.danger
  };

  return (
    <span className={cn(badgeBase, statusColors[status] || badgeVariant.default)}>
      {status}
    </span>
  );
}

// Función para obtener badge de acción
function getActionBadge(action: Action): React.ReactElement {
  const actionColors: Partial<Record<Action, string>> = {
    LOGIN: badgeVariant.info,
    LOGOUT: badgeVariant.secondary,
    CREATE: badgeVariant.success,
    UPDATE: badgeVariant.warning,
    DELETE: badgeVariant.danger,
    GET_ALL: badgeVariant.primary,
    GET_ONE: badgeVariant.primary
  };

  return (
    <span className={cn(badgeBase, actionColors[action] || badgeVariant.default)}>
      {action}
    </span>
  );
}

/** Bloque <pre> de contenido JSON (antes inline) */
const preClass =
  'text-[0.75em] [background:var(--bg)] p-2 rounded mt-1 overflow-auto max-h-[150px] border border-line';

export interface AuditoriaTableProps {
  data?: Audit[];
  currentPage?: number;
  itemsPerPage?: number;
}

export default function AuditoriaTable({ data = [], currentPage = 1, itemsPerPage = 10 }: AuditoriaTableProps) {
  return (
    <div className={tableCard}>
      <div className={tableScroll}>
        <table className={incTable}>
          <thead>
            <tr>
              <th className={headerCell}>#</th>
              <th className={headerCell}>Usuario</th>
              <th className={headerCell}>IP</th>
              <th className={headerCell}>Acción</th>
              <th className={headerCell}>Modelo</th>
              <th className={headerCell}>Estado</th>
              <th className={headerCell}>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr className={bodyRow}>
                <td colSpan={7} className={cn(incTableTd, 'text-center text-content! p-10!')}>
                  No hay registros de auditoría disponibles
                </td>
              </tr>
            )}
            {data.map((item, index) => (
              <tr key={item.id} className={bodyRow}>
                <td className={cn(incTableTd, 'w-10 text-center font-bold text-muted!')}>
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className={incTableTd}>
                  <strong>{item.user?.username || 'N/A'}</strong>
                  <br />
                  <small className="text-muted text-[0.85em]">
                    ID: {item.user?.id?.substring(0, 8) || 'N/A'}...
                  </small>
                </td>
                <td className={incTableTd}>{item.ip}</td>
                <td className={incTableTd}>{getActionBadge(item.action)}</td>
                <td className={incTableTd}>
                  <span className={cn(badgeBase, badgeVariant.default)}>{item.model}</span>
                </td>
                <td className={incTableTd}>{getStatusBadge(item.status)}</td>
                <td className={incTableTd}>
                  {item.description}
                  {(item.preview_content || item.new_content) && (
                    <div className="mt-2">
                      {item.preview_content && (
                        <details>
                          <summary className="cursor-pointer text-primary text-[0.85em]">
                            📄 Contenido anterior
                          </summary>
                          <pre className={preClass}>
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(item.preview_content ?? ''), null, 2);
                            } catch {
                              return item.preview_content;
                            }
                          })()}
                          </pre>
                        </details>
                      )}
                      {item.new_content && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-success text-[0.85em]">
                            ✅ Contenido nuevo
                          </summary>
                          <pre className={preClass}>
                            {(() => {
                            try {
                              return JSON.stringify(JSON.parse(item.new_content ?? ''), null, 2);
                            } catch {
                              return item.new_content;
                            }
                          })()}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                  {item.register_id && (
                    <div className="mt-1">
                      <small className="text-muted text-[0.85em]">
                        Registro: <code className="text-[0.85em] [background:var(--bg)] px-1.5 py-0.5 rounded">
                          {item.register_id.substring(0, 8)}...
                        </code>
                      </small>
                    </div>
                  )}
                  {item.field && (
                    <div className="mt-1">
                      <small className="text-muted text-[0.85em]">
                        Campo: <strong>{item.field}</strong>
                      </small>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
