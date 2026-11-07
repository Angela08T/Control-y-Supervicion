import React from 'react';
import type { Audit } from '@/types';
import Badge, { type BadgeTone } from '@/components/UI/Badge';
import { EmptyState } from '@/components/UI/EmptyState';
import { cn, incTable, incTableTd, incTableTh, incTableTr } from '@/utils/classes';

/** Nombres en español de las acciones (el valor original se muestra si no hay nombre) */
export const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Inicio de sesión',
  LOGOUT: 'Cierre de sesión',
  CREATE: 'Crear',
  UPDATE: 'Actualizar',
  DELETE: 'Eliminar',
  GET_ALL: 'Consultar todos',
  GET_ONE: 'Consultar uno',
  APPROVE: 'Aprobar',
  REJECT: 'Rechazar',
  DOWNLOAD: 'Descargar',
  RESTORE: 'Restaurar',
  REVOKE: 'Revocar',
  SEND: 'Enviar'
};

/** Nombres en español de los módulos */
export const MODEL_LABELS: Record<string, string> = {
  AUTH: 'Autenticación',
  AUDIT: 'Auditoría',
  BODYCAM: 'Dispositivos',
  JOB: 'Cargos',
  JURISDICTION: 'Jurisdicciones',
  LACK: 'Faltas',
  LEAD: 'Personal',
  OFFENDER: 'Infractores',
  REPORT: 'Incidencias',
  ROLE: 'Roles',
  SESSION: 'Sesiones',
  SUBJECT: 'Asuntos',
  USER: 'Usuarios'
};

/** Estado de la acción: texto + color */
const STATUS_BADGE: Record<string, { label: string; tone: BadgeTone }> = {
  SUCCESS: { label: 'Exitoso', tone: 'success' },
  FAILED: { label: 'Fallido', tone: 'danger' },
  BLOCKED: { label: 'Bloqueado', tone: 'warning' },
  ERROR: { label: 'Error', tone: 'warning' }
};

/** Bloque de contenido JSON (antes/después) */
const preClass = 'm-0 mt-1 max-h-[150px] overflow-auto rounded-md border border-line bg-subtle p-2 text-xs text-content-2';

/** Muestra JSON formateado; si no es JSON, devuelve el texto tal cual */
function prettyContent(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export interface AuditoriaTableProps {
  data?: Audit[];
  /** Ya no se muestra numeración de filas; se conservan por compatibilidad de props. */
  currentPage?: number;
  itemsPerPage?: number;
}

/** Tabla de solo lectura del registro de auditoría. Va dentro de una tarjeta que pone la pagina. */
export default function AuditoriaTable({ data = [] }: AuditoriaTableProps) {
  if (data.length === 0) {
    return <EmptyState title="Sin registros" description="No hay registros de auditoría para mostrar." />;
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className={incTable}>
        <thead>
          <tr>
            <th className={incTableTh}>Fecha y hora</th>
            <th className={incTableTh}>Usuario</th>
            <th className={incTableTh}>Acción</th>
            <th className={incTableTh}>Módulo</th>
            <th className={incTableTh}>Descripción</th>
            <th className={incTableTh}>IP</th>
            <th className={incTableTh}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const date = item.created_at ? new Date(item.created_at) : null;
            const status = STATUS_BADGE[item.status] ?? { label: item.status, tone: 'neutral' as BadgeTone };

            return (
              <tr key={item.id} className={incTableTr}>
                <td className={incTableTd}>
                  <div className="text-content-2">{date ? date.toLocaleDateString('es-PE') : '-'}</div>
                  <div className="text-xs text-muted">
                    {date ? date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </td>

                <td className={cn(incTableTd, 'font-medium text-content')}>{item.user?.username || 'N/A'}</td>

                <td className={incTableTd}>{ACTION_LABELS[item.action] ?? item.action}</td>

                <td className={incTableTd}>{MODEL_LABELS[item.model] ?? item.model}</td>

                <td className={`${incTableTd} max-w-[360px]`}>
                  <p className="m-0 line-clamp-2 text-content-2" title={item.description}>
                    {item.description}
                  </p>
                  {item.field && (
                    <div className="mt-1 text-xs text-muted">
                      Campo: <span className="font-medium text-content-2">{item.field}</span>
                    </div>
                  )}
                  {item.register_id && (
                    <div className="mt-0.5 text-xs text-muted">
                      Registro: <code className="font-mono">{item.register_id.substring(0, 8)}…</code>
                    </div>
                  )}
                  {item.preview_content && (
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-xs text-primary">Ver contenido anterior</summary>
                      <pre className={preClass}>{prettyContent(item.preview_content)}</pre>
                    </details>
                  )}
                  {item.new_content && (
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-xs text-primary">Ver contenido nuevo</summary>
                      <pre className={preClass}>{prettyContent(item.new_content)}</pre>
                    </details>
                  )}
                </td>

                <td className={cn(incTableTd, 'text-xs text-muted')}>{item.ip}</td>

                <td className={incTableTd}>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
