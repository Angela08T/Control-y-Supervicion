import React from 'react'
import type { ISODateString, Offender } from '@/types'
import { FiEdit2, FiMoon, FiRotateCcw, FiSlash, FiSun, FiSunset } from 'react-icons/fi'
import { actionBtn, actionBtnDanger, actions, cn, incTable, incTableTd, incTableTh, incTableTr } from '@/utils/classes'
import { colorAvatar, iniciales } from '@/utils/incidenciaFormat'

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

/** Fecha corta de deshabilitacion */
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

const nombreDe = (o: OffenderRow) => `${o.name ?? ''} ${o.lastname ?? ''}`.trim()

/** Icono y color de cada turno */
const TURNOS: Record<string, { icon: React.ReactNode; cls: string }> = {
  manana: { icon: <FiSun />, cls: 'bg-brand-amber/16 text-amber-ink' },
  tarde: { icon: <FiSunset />, cls: 'bg-brand-pink/10 text-pink-ink' },
  noche: { icon: <FiMoon />, cls: 'bg-primary/10 text-primary dark:bg-primary/25 dark:text-accent-light' },
}
const claveTurno = (t?: string | null) => (t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Etiqueta del turno con su icono */
export function Turno({ turno }: { turno?: string | null }) {
  if (!turno) return <span className="text-xs text-muted">Sin turno</span>
  const t = TURNOS[claveTurno(turno)]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-semibold capitalize', t?.cls ?? 'bg-subtle text-content-2')}>
      {t?.icon}
      {turno.toLowerCase()}
    </span>
  )
}

/** Estado con punto de color */
function Estado({ item }: { item: OffenderRow }) {
  if (!item.deleted_at) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-lime-ink">
        <span className="size-2.5 rounded-full bg-success" aria-hidden />
        Habilitado
      </span>
    )
  }
  return (
    <span className="inline-flex flex-col">
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-red-ink">
        <span className="size-2.5 rounded-full bg-danger" aria-hidden />
        Deshabilitado
      </span>
      <span className="pl-4 text-xs text-muted">desde {formatDate(item.deleted_at)}</span>
    </span>
  )
}

/** Botones editar / habilitar-deshabilitar */
function Acciones({ item, onEdit, onToggleStatus, canEdit, canDelete }: Required<Pick<OffenderTableProps, 'onEdit' | 'onToggleStatus' | 'canEdit' | 'canDelete'>> & { item: OffenderRow }) {
  const isEnabled = !item.deleted_at
  const nombre = nombreDe(item)
  return (
    <div className={actions}>
      {canEdit && (
        <button type="button" title="Editar" aria-label={`Editar a ${nombre}`} onClick={() => onEdit(item)} className={actionBtn}>
          <FiEdit2 aria-hidden />
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          title={isEnabled ? 'Deshabilitar' : 'Habilitar'}
          aria-label={`${isEnabled ? 'Deshabilitar' : 'Habilitar'} a ${nombre}`}
          onClick={() => onToggleStatus(item)}
          className={isEnabled ? actionBtnDanger : cn(actionBtn, 'text-lime-ink hover:bg-success/12 hover:text-lime-ink')}
        >
          {isEnabled ? <FiSlash aria-hidden /> : <FiRotateCcw aria-hidden />}
        </button>
      )}
      {!canEdit && !canDelete && <span className="text-xs text-muted">Solo lectura</span>}
    </div>
  )
}

/** Avatar con iniciales (gris si esta deshabilitado) */
function Avatar({ item, size = 'md' }: { item: OffenderRow; size?: 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center font-bold text-white',
        size === 'lg' ? 'size-12 rounded-2xl text-base shadow-sm' : 'size-10 rounded-xl text-sm',
        item.deleted_at && 'opacity-60 grayscale'
      )}
      style={{ background: colorAvatar(item.dni || String(item.id)) }}
      aria-hidden
    >
      {iniciales(nombreDe(item), item.dni)}
    </span>
  )
}

/** Vista de lista */
export default function OffenderTable({ data = [], onToggleStatus, onEdit, canEdit = true, canDelete = true }: OffenderTableProps) {
  const showActions = canEdit || canDelete

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className={incTable}>
        <thead>
          <tr>
            <th className={incTableTh}>Infractor</th>
            <th className={cn(incTableTh, 'max-md:hidden')}>Cargo y régimen</th>
            <th className={cn(incTableTh, 'max-sm:hidden')}>Turno</th>
            <th className={cn(incTableTh, 'max-lg:hidden')}>Subgerencia</th>
            <th className={incTableTh}>Estado</th>
            {showActions && <th className={cn(incTableTh, 'text-right!')}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const isEnabled = !item.deleted_at
            return (
              <tr key={item.id} className={incTableTr}>
                <td className={incTableTd}>
                  <div className={cn('flex items-center gap-3', !isEnabled && 'opacity-60')}>
                    <Avatar item={item} />
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-semibold text-content">{nombreDe(item) || '—'}</div>
                      <div className="font-mono text-xs text-muted">DNI {item.dni}</div>
                    </div>
                  </div>
                </td>
                <td className={cn(incTableTd, 'max-md:hidden', !isEnabled && 'opacity-60')}>
                  <div className="truncate text-content">{item.job || 'Sin cargo'}</div>
                  <div className="text-xs text-muted">{item.regime || '—'}</div>
                </td>
                <td className={cn(incTableTd, 'max-sm:hidden')}>
                  <Turno turno={item.shift} />
                </td>
                <td className={cn(incTableTd, 'max-w-[260px] max-lg:hidden', !isEnabled && 'opacity-60')}>
                  <span className="line-clamp-2 text-[13px] text-content-2">{item.subgerencia || '—'}</span>
                </td>
                <td className={incTableTd}>
                  <Estado item={item} />
                </td>
                {showActions && (
                  <td className={incTableTd}>
                    <Acciones item={item} onEdit={onEdit} onToggleStatus={onToggleStatus} canEdit={canEdit} canDelete={canDelete} />
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

/** Dato de la credencial: etiqueta pequena en mayusculas y valor */
function DatoCredencial({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', wide && 'col-span-2')}>
      <dt className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">{label}</dt>
      <dd className="m-0 text-sm font-semibold break-words text-content">{children}</dd>
    </div>
  )
}

/**
 * Vista "credencial": a la izquierda la lista compacta de infractores y a la derecha la persona
 * elegida como un carne de identidad. En movil se ve la lista y, al tocar a alguien, su credencial.
 */
export function OffenderMasterDetail({ data = [], onToggleStatus, onEdit, canEdit = true, canDelete = true }: OffenderTableProps) {
  const [elegidoId, setElegidoId] = React.useState<string | null>(null)
  // En movil: true cuando se esta viendo la credencial en vez de la lista
  const [verDetalle, setVerDetalle] = React.useState(false)

  // Si la persona elegida ya no esta en la pagina, se muestra la primera
  const elegido = data.find(o => String(o.id) === elegidoId) ?? data[0]

  if (!elegido) return null
  const isEnabled = !elegido.deleted_at
  const nombre = nombreDe(elegido)
  const color = colorAvatar(elegido.dni || String(elegido.id))

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(260px,340px)_minmax(0,1fr)] max-lg:grid-cols-1">
      {/* Lista compacta */}
      <ul
        className={cn('m-0 min-h-0 list-none overflow-y-auto border-r border-line p-2 max-lg:border-r-0', verDetalle && 'max-lg:hidden')}
        aria-label="Infractores"
      >
        {data.map(o => {
          const activo = o.id === elegido.id
          const t = TURNOS[claveTurno(o.shift)]
          return (
            <li key={o.id}>
              <button
                type="button"
                aria-current={activo ? 'true' : undefined}
                onClick={() => {
                  setElegidoId(String(o.id))
                  setVerDetalle(true)
                }}
                className={cn(
                  'relative flex w-full cursor-pointer items-center gap-3 rounded-xl border-none px-3 py-2.5 text-left transition-colors duration-150',
                  activo ? 'bg-primary/8 dark:bg-primary/20' : 'bg-transparent hover:bg-subtle'
                )}
              >
                {activo && <span aria-hidden className="absolute top-2 bottom-2 left-0 w-1 rounded-full bg-primary dark:bg-accent-light" />}
                <Avatar item={o} />
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-[13.5px] font-semibold', activo ? 'text-primary dark:text-accent-light' : 'text-content', o.deleted_at && 'line-through decoration-1 opacity-60')}>
                    {nombreDe(o) || '—'}
                  </span>
                  <span className="block font-mono text-xs text-muted">{o.dni}</span>
                </span>
                {t && (
                  <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg text-sm', t.cls)} title={`Turno ${o.shift?.toLowerCase()}`} aria-label={`Turno ${o.shift?.toLowerCase()}`}>
                    {t.icon}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {/* Credencial de la persona elegida */}
      <div className={cn('min-h-0 overflow-y-auto bg-subtle/60 p-6 max-sm:p-3', !verDetalle && 'max-lg:hidden')}>
        <button
          type="button"
          onClick={() => setVerDetalle(false)}
          className="mb-3 hidden cursor-pointer items-center gap-1.5 rounded-lg border-none bg-transparent px-2 py-1 text-[13px] font-semibold text-primary hover:bg-primary/8 max-lg:inline-flex dark:text-accent-light"
        >
          ← Volver a la lista
        </button>

        <article
          key={elegido.id}
          aria-label={`Credencial de ${nombre}`}
          className="mx-auto max-w-[620px] overflow-hidden rounded-[22px] border border-line bg-surface shadow-[0_24px_48px_-24px_rgba(12,26,75,0.45)] animate-[popIn_0.2s_ease-out] dark:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)]"
        >
          {/* Cabecera institucional */}
          <header className="relative overflow-hidden bg-[linear-gradient(135deg,#0a163d_0%,#14296b_55%,#1e3a8a_100%)] px-6 py-4 text-white">
            <span aria-hidden className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-white/6" />
            <div className="relative flex items-center justify-between gap-3">
              <div>
                <p className="m-0 text-[10px] font-bold tracking-[0.18em] text-white/70 uppercase">Municipalidad de San Juan de Lurigancho</p>
                <p className="m-0 text-sm font-bold tracking-[0.04em]">Registro de infractores · CECOM</p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.06em] uppercase ring-1',
                  isEnabled ? 'bg-[#8ebc22]/20 text-[#d9f99d] ring-[#8ebc22]/40' : 'bg-[#c71522]/25 text-[#fecaca] ring-[#f87171]/40'
                )}
              >
                {isEnabled ? 'Habilitado' : 'Deshabilitado'}
              </span>
            </div>
          </header>
          {/* Franja con los colores del logo */}
          <div aria-hidden className="h-1 bg-[linear-gradient(90deg,#c71522_0%,#d20b80_22%,#f2a50f_45%,#8ebc22_70%,#31a3b5_100%)]" />

          <div className="flex gap-5 p-6 max-sm:flex-col max-sm:items-center max-sm:p-4 max-sm:text-center">
            {/* "Foto": iniciales sobre el color de la persona */}
            <div
              className={cn('flex h-[132px] w-[108px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl text-white shadow-[inset_0_-30px_40px_-30px_rgba(0,0,0,0.35)]', !isEnabled && 'grayscale')}
              style={{ background: color }}
              aria-hidden
            >
              <span className="text-[34px] leading-none font-bold">{iniciales(nombre, elegido.dni)}</span>
              <span className="text-[10px] font-semibold tracking-[0.12em] text-white/80 uppercase">Infractor</span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="m-0 text-[10px] font-bold tracking-[0.14em] text-muted uppercase">Apellidos y nombres</p>
              <h3 className="m-0 mt-0.5 text-[22px] leading-tight font-bold text-content uppercase">{nombre || '—'}</h3>
              <p className="m-0 mt-3 text-[10px] font-bold tracking-[0.14em] text-muted uppercase">Documento de identidad</p>
              <p className="m-0 font-mono text-[26px] leading-tight font-bold tracking-[0.12em] text-ink dark:text-content">{elegido.dni}</p>
            </div>
          </div>

          <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-dashed border-line-strong px-6 py-5 max-sm:px-4">
            <DatoCredencial label="Cargo">{elegido.job || 'Sin cargo'}</DatoCredencial>
            <DatoCredencial label="Régimen">{elegido.regime || '—'}</DatoCredencial>
            <DatoCredencial label="Turno"><Turno turno={elegido.shift} /></DatoCredencial>
            <DatoCredencial label="Estado"><Estado item={elegido} /></DatoCredencial>
            <DatoCredencial label="Subgerencia" wide>{elegido.subgerencia || '—'}</DatoCredencial>
          </dl>

          {(canEdit || canDelete) && (
            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-subtle px-6 py-3 max-sm:px-4">
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onToggleStatus(elegido)}
                  className={cn(
                    'inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3.5 text-[13px] font-semibold transition-colors',
                    isEnabled
                      ? 'border-danger/30 bg-surface text-red-ink hover:bg-danger/8'
                      : 'border-success/40 bg-surface text-lime-ink hover:bg-success/10'
                  )}
                >
                  {isEnabled ? <FiSlash aria-hidden /> : <FiRotateCcw aria-hidden />}
                  {isEnabled ? 'Deshabilitar' : 'Habilitar'}
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(elegido)}
                  className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-transparent bg-primary px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  <FiEdit2 aria-hidden />
                  Editar datos
                </button>
              )}
            </footer>
          )}
        </article>
      </div>
    </div>
  )
}
