import React, { useState } from 'react';
import {
  FiCheckCircle,
  FiChevronDown,
  FiDownload,
  FiEdit2,
  FiEye,
  FiGitCommit,
  FiGlobe,
  FiLogIn,
  FiLogOut,
  FiPlus,
  FiRotateCcw,
  FiSend,
  FiSlash,
  FiTrash2,
  FiXCircle,
} from 'react-icons/fi';
import type { Audit } from '@/types';
import { EmptyState } from '@/components/UI/EmptyState';
import { cn } from '@/utils/classes';
import { colorAvatar, iniciales } from '@/utils/incidenciaFormat';

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

/** Verbo en pasado, icono y color de cada accion (para la frase de la linea de tiempo) */
export const ACTION_STYLE: Record<string, { verbo: string; icon: React.ReactNode; tono: string }> = {
  LOGIN: { verbo: 'inició sesión', icon: <FiLogIn />, tono: 'bg-brand-cyan/15 text-cyan-ink' },
  LOGOUT: { verbo: 'cerró sesión', icon: <FiLogOut />, tono: 'bg-subtle text-content-2' },
  CREATE: { verbo: 'creó un registro en', icon: <FiPlus />, tono: 'bg-success/14 text-lime-ink' },
  UPDATE: { verbo: 'actualizó un registro en', icon: <FiEdit2 />, tono: 'bg-primary/12 text-primary dark:bg-primary/25 dark:text-accent-light' },
  DELETE: { verbo: 'eliminó un registro en', icon: <FiTrash2 />, tono: 'bg-danger/10 text-red-ink' },
  GET_ALL: { verbo: 'consultó la lista de', icon: <FiEye />, tono: 'bg-subtle text-content-2' },
  GET_ONE: { verbo: 'consultó un registro de', icon: <FiEye />, tono: 'bg-subtle text-content-2' },
  APPROVE: { verbo: 'aprobó un registro en', icon: <FiCheckCircle />, tono: 'bg-success/14 text-lime-ink' },
  REJECT: { verbo: 'rechazó un registro en', icon: <FiXCircle />, tono: 'bg-danger/10 text-red-ink' },
  DOWNLOAD: { verbo: 'descargó un documento de', icon: <FiDownload />, tono: 'bg-brand-amber/16 text-amber-ink' },
  RESTORE: { verbo: 'restauró un registro en', icon: <FiRotateCcw />, tono: 'bg-success/14 text-lime-ink' },
  REVOKE: { verbo: 'revocó un acceso en', icon: <FiSlash />, tono: 'bg-danger/10 text-red-ink' },
  SEND: { verbo: 'envió un registro en', icon: <FiSend />, tono: 'bg-brand-pink/12 text-pink-ink' },
};
const ESTILO_OTRO = { verbo: 'hizo una acción en', icon: <FiGitCommit />, tono: 'bg-subtle text-content-2' };

/** Estado de la accion: solo se muestra cuando NO fue exitosa */
const STATUS_STYLE: Record<string, { label: string; cls: string; fila: string }> = {
  FAILED: { label: 'Fallido', cls: 'bg-danger/12 text-red-ink', fila: 'border-l-danger bg-danger/4' },
  BLOCKED: { label: 'Bloqueado', cls: 'bg-warning/16 text-amber-ink', fila: 'border-l-warning bg-warning/5' },
  ERROR: { label: 'Error', cls: 'bg-warning/16 text-amber-ink', fila: 'border-l-warning bg-warning/5' },
};

/** Intenta leer JSON; si no lo es, devuelve null */
function parseJson(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const mostrar = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

/** Comparacion Antes / Despues: campo por campo cuando ambos son JSON; si no, los dos textos lado a lado */
function Cambios({ antes, despues }: { antes: string | null; despues: string | null }) {
  const a = parseJson(antes);
  const d = parseJson(despues);

  if (a || d) {
    const claves = [...new Set([...Object.keys(a ?? {}), ...Object.keys(d ?? {})])];
    const filas = claves.map(k => ({ k, va: a?.[k], vd: d?.[k], cambio: JSON.stringify(a?.[k]) !== JSON.stringify(d?.[k]) }));
    const cambiadas = filas.filter(f => f.cambio).length;
    // Primero lo que cambio
    filas.sort((x, y) => Number(y.cambio) - Number(x.cambio));
    return (
      <div className="overflow-hidden rounded-xl border border-line">
        <p className="m-0 border-b border-line bg-subtle px-3 py-1.5 text-xs text-content-2">
          <strong className="font-semibold text-content">{cambiadas}</strong> {cambiadas === 1 ? 'campo cambió' : 'campos cambiaron'} de {filas.length}
        </p>
        <div className="max-h-[260px] overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-muted">
                <th className="sticky top-0 bg-surface px-3 py-1.5">Campo</th>
                <th className="sticky top-0 bg-surface px-3 py-1.5">Antes</th>
                <th className="sticky top-0 bg-surface px-3 py-1.5">Después</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(f => (
                <tr key={f.k} className={cn('border-t border-line align-top', !f.cambio && 'text-muted')}>
                  <td className="px-3 py-1.5 font-mono font-semibold whitespace-nowrap">
                    {f.cambio && <span className="mr-1.5 inline-block size-1.5 rounded-full bg-warning align-middle" aria-label="cambió" />}
                    {f.k}
                  </td>
                  <td className={cn('max-w-[260px] px-3 py-1.5 break-words', f.cambio && a && 'bg-danger/6 text-red-ink line-through decoration-1')}>
                    {a ? mostrar(f.va) : '—'}
                  </td>
                  <td className={cn('max-w-[260px] px-3 py-1.5 break-words', f.cambio && d && 'bg-success/8 font-semibold text-lime-ink')}>
                    {d ? mostrar(f.vd) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const bloque = 'm-0 max-h-[200px] overflow-auto rounded-lg border p-2.5 text-xs whitespace-pre-wrap break-words';
  return (
    <div className="grid grid-cols-2 gap-2 max-md:grid-cols-1">
      <div>
        <p className="m-0 mb-1 text-[11px] font-semibold text-muted">Antes</p>
        <pre className={cn(bloque, 'border-danger/25 bg-danger/5 text-content-2')}>{antes || '—'}</pre>
      </div>
      <div>
        <p className="m-0 mb-1 text-[11px] font-semibold text-muted">Después</p>
        <pre className={cn(bloque, 'border-success/30 bg-success/6 text-content-2')}>{despues || '—'}</pre>
      </div>
    </div>
  );
}

/** "Hoy", "Ayer" o la fecha larga */
function etiquetaDia(d: Date): string {
  const hoy = new Date();
  const ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);
  const mismo = (x: Date, y: Date) => x.toDateString() === y.toDateString();
  if (mismo(d, hoy)) return 'Hoy';
  if (mismo(d, ayer)) return 'Ayer';
  const t = d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: d.getFullYear() !== hoy.getFullYear() ? 'numeric' : undefined });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export interface AuditoriaTableProps {
  data?: Audit[];
  /** Ya no se muestra numeración de filas; se conservan por compatibilidad de props. */
  currentPage?: number;
  itemsPerPage?: number;
}

/**
 * Registro de auditoria como linea de tiempo: agrupado por dia, cada evento es una frase
 * ("@usuario actualizo un registro en Incidencias") con su hora, IP y, si tiene, la comparacion
 * Antes / Despues de los datos.
 */
export default function AuditoriaTable({ data = [] }: AuditoriaTableProps) {
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());

  if (data.length === 0) {
    return <EmptyState title="Sin registros" description="No hay registros de auditoría para mostrar." />;
  }

  const alternar = (id: string) =>
    setAbiertos(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // Agrupar por dia, conservando el orden en que llegan (del mas reciente al mas antiguo)
  const dias: { clave: string; fecha: Date | null; items: Audit[] }[] = [];
  data.forEach(item => {
    const fecha = item.created_at ? new Date(item.created_at) : null;
    const clave = fecha ? fecha.toDateString() : 'sin-fecha';
    const ultimo = dias[dias.length - 1];
    if (ultimo && ultimo.clave === clave) ultimo.items.push(item);
    else dias.push({ clave, fecha, items: [item] });
  });

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      {dias.map(dia => (
        <section key={dia.clave} aria-label={dia.fecha ? etiquetaDia(dia.fecha) : 'Sin fecha'}>
          <h3 className="sticky top-0 z-10 m-0 flex items-center gap-2 border-b border-line bg-subtle/95 px-5 py-2 text-xs font-bold text-content backdrop-blur-sm max-sm:px-3">
            {dia.fecha ? etiquetaDia(dia.fecha) : 'Sin fecha'}
            <span className="rounded-full bg-surface px-2 py-px text-[11px] font-semibold text-muted ring-1 ring-line">{dia.items.length}</span>
          </h3>

          <ol className="m-0 list-none p-0">
            {dia.items.map((item, idx) => {
              const id = String(item.id);
              const fecha = item.created_at ? new Date(item.created_at) : null;
              const estilo = ACTION_STYLE[item.action] ?? ESTILO_OTRO;
              const estado = STATUS_STYLE[item.status];
              const modulo = MODEL_LABELS[item.model] ?? item.model;
              const usuario = item.user?.username;
              const tieneCambios = !!(item.preview_content || item.new_content);
              const abierto = abiertos.has(id);
              const sinModulo = item.action === 'LOGIN' || item.action === 'LOGOUT';

              return (
                <li
                  key={item.id}
                  className={cn(
                    'relative grid grid-cols-[52px_36px_minmax(0,1fr)] gap-x-3 border-l-[3px] px-5 py-3 transition-colors hover:bg-card-hover max-sm:grid-cols-[30px_minmax(0,1fr)] max-sm:px-3',
                    // Solo los eventos no exitosos llevan el borde de color (y una sola clase de color de borde)
                    estado ? estado.fila : 'border-l-transparent'
                  )}
                >
                  {/* Hora */}
                  <time
                    dateTime={item.created_at}
                    className="pt-2 text-right text-xs font-semibold text-content-2 tabular-nums max-sm:hidden"
                    title={fecha?.toLocaleString('es-PE')}
                  >
                    {fecha ? fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : '—'}
                  </time>

                  {/* Nodo de la linea de tiempo */}
                  <div className="relative flex justify-center">
                    {idx < dia.items.length - 1 && <span aria-hidden className="absolute top-9 -bottom-3 w-px bg-line-strong" />}
                    <span className={cn('relative z-[1] flex size-8 items-center justify-center rounded-full text-sm ring-4 ring-surface', estilo.tono)} aria-hidden>
                      {estilo.icon}
                    </span>
                  </div>

                  {/* El evento */}
                  <div className="min-w-0 pt-1">
                    <p className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13.5px] leading-snug text-content-2">
                      {usuario ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-content">
                          <span
                            className="flex size-5 items-center justify-center rounded-md text-[9px] font-bold text-white"
                            style={{ background: colorAvatar(String(item.user?.id ?? usuario)) }}
                            aria-hidden
                          >
                            {iniciales(usuario)}
                          </span>
                          @{usuario}
                        </span>
                      ) : (
                        <span className="font-semibold text-muted">Usuario desconocido</span>
                      )}
                      <span>{estilo.verbo}</span>
                      {!sinModulo && <strong className="font-semibold text-content">{modulo}</strong>}
                      {estado && <span className={cn('rounded-full px-2 py-px text-[11px] font-bold', estado.cls)}>{estado.label}</span>}
                      <span className="text-xs text-muted sm:hidden">· {fecha ? fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : ''}</span>
                    </p>

                    {item.description && <p className="m-0 mt-1 line-clamp-2 text-[13px] text-content-2" title={item.description}>{item.description}</p>}

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
                      <span className="inline-flex items-center gap-1 font-mono" title="Dirección IP">
                        <FiGlobe aria-hidden /> {item.ip || '—'}
                      </span>
                      {item.field && (
                        <span>
                          Campo: <span className="font-semibold text-content-2">{item.field}</span>
                        </span>
                      )}
                      {item.register_id && (
                        <span title={item.register_id}>
                          Registro: <code className="font-mono text-content-2">{item.register_id.substring(0, 8)}…</code>
                        </span>
                      )}
                      {tieneCambios && (
                        <button
                          type="button"
                          onClick={() => alternar(id)}
                          aria-expanded={abierto}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-md border-none bg-primary/8 px-2 py-0.5 text-[11.5px] font-semibold text-primary transition-colors hover:bg-primary/14 dark:bg-primary/20 dark:text-accent-light"
                        >
                          {abierto ? 'Ocultar cambios' : 'Ver cambios'}
                          <FiChevronDown className={cn('transition-transform', abierto && 'rotate-180')} aria-hidden />
                        </button>
                      )}
                    </div>

                    {abierto && tieneCambios && (
                      <div className="mt-2.5">
                        <Cambios antes={item.preview_content} despues={item.new_content} />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
