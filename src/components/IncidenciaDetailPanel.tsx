import React from 'react'
import {
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiClock,
  FiFileText,
  FiHash,
  FiMapPin,
  FiPaperclip,
  FiRotateCcw,
  FiSend,
  FiTrash2,
  FiUser,
  FiVideo,
  FiX,
  FiBriefcase,
  FiMail,
} from 'react-icons/fi'
import type { ID, Incidencia, IncidenciaStatus } from '@/types'
import Button from '@/components/UI/Button'
import { StatusBadge } from '@/components/UI/Badge'
import { cn } from '@/utils/classes'
import { ASUNTOS, nombreCorto } from '@/pages/Dashboard/asuntos'
import { DASH, colorAvatar, fmtDate, fmtDateTime, formatTurno, iniciales, medioLabel, text } from '@/utils/incidenciaFormat'

export interface IncidenciaDetailPanelProps {
  item: Incidencia
  onEdit: (item: Incidencia) => void
  onDelete: (id: ID, status: IncidenciaStatus) => void
  onSend: (id: ID) => void
  onApprove: (id: ID) => void
  onReject: (id: ID) => void
  canDelete: boolean
  canSendToValidator: boolean
  canValidateReport: boolean
  /** Solo en modo panel lateral: muestra la X y cierra tras cada accion */
  onClose?: () => void
  /** Id del titulo, para aria-labelledby del dialogo */
  titleId?: string
}

/** Recuadro de un dato: icono, etiqueta y valor */
function Dato({ icon, label, value, wide = false }: { icon: React.ReactNode; label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn('flex min-w-0 gap-3 rounded-xl bg-subtle px-3.5 py-3', wide && 'col-span-2 max-[560px]:col-span-1')}>
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-[15px] text-primary shadow-sm dark:text-accent-light" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold text-content-2">{label}</dt>
        <dd className="m-0 mt-0.5 break-words text-sm font-semibold text-ink dark:text-content">{value}</dd>
      </div>
    </div>
  )
}

function Titulo({ children }: { children: React.ReactNode }) {
  return <h4 className="m-0 mb-2.5 text-[11px] font-bold tracking-[0.12em] text-content-2 uppercase">{children}</h4>
}

/**
 * Detalle completo de una incidencia: cabecera azul con la persona, el hecho destacado,
 * los datos en recuadros y las acciones al pie.
 */
export default function IncidenciaDetailPanel({
  item,
  onEdit,
  onDelete,
  onSend,
  onApprove,
  onReject,
  canDelete,
  canSendToValidator,
  canValidateReport,
  onClose,
  titleId,
}: IncidenciaDetailPanelProps) {
  const isDisabled = !!item.deletedAt
  const isAbsence = item.isAbsenceReport
  const colorAsunto = ASUNTOS[item.asunto]?.color ?? 'var(--primary)'

  /** En el panel lateral, la accion cierra el panel; en la bandeja, el detalle queda abierto */
  const run = (action: () => void) => () => {
    action()
    onClose?.()
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Cabecera: persona y estado */}
      <header className="relative overflow-hidden bg-[linear-gradient(135deg,#0a163d_0%,#14296b_55%,#1e3a8a_100%)] px-6 py-5 text-white">
        <span aria-hidden className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-white/6" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <span
              className="flex size-13 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white ring-2 ring-white/25"
              style={{ background: colorAvatar(item.dni || item.nombreCompleto) }}
              aria-hidden
            >
              {iniciales(item.nombreCompleto, item.dni)}
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="m-0 truncate text-xl leading-tight font-bold" title={text(item.nombreCompleto || item.dni)}>
                {text(item.nombreCompleto || item.dni)}
              </h2>
              <p className="m-0 mt-1 truncate text-[13px] text-white/75">
                DNI {text(item.dni)}
                {item.cargo ? ` · ${item.cargo}` : ''}
                {item.regLab ? ` · ${item.regLab}` : ''}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-white p-0.5 shadow-sm">
              <StatusBadge status={item.status} disabled={isDisabled} />
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar panel"
                autoFocus
                className="flex size-9 cursor-pointer items-center justify-center rounded-xl border-none bg-white/10 text-lg text-white transition-colors hover:bg-white/20"
              >
                <FiX aria-hidden />
              </button>
            )}
          </div>
        </div>
        {item.code && (
          <p className="relative m-0 mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/12 px-2.5 py-1 text-xs font-semibold ring-1 ring-white/20">
            <FiHash aria-hidden />
            {item.code}
          </p>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        {isDisabled && (
          <p className="m-0 flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/6 px-3.5 py-2.5 text-[13px] font-medium text-danger">
            <FiAlertCircle className="shrink-0" aria-hidden />
            Deshabilitada el {fmtDateTime(item.deletedAt)}
          </p>
        )}

        {/* El hecho, destacado */}
        <section>
          <Titulo>El hecho</Titulo>
          <div className="rounded-2xl border border-line p-4" style={{ borderLeft: `4px solid ${colorAsunto}` }}>
            <p className="m-0 text-base leading-snug font-bold text-ink dark:text-content">{text(item.falta)}</p>
            <p className="m-0 mt-1.5 flex items-start gap-2 text-[13px] font-medium text-content-2" title={item.asunto || undefined}>
              <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: colorAsunto }} aria-hidden />
              {item.asunto ? nombreCorto(item.asunto) : DASH}
            </p>
          </div>
        </section>

        <section>
          <Titulo>Detalles</Titulo>
          <dl className="m-0 grid grid-cols-2 gap-2.5 max-[560px]:grid-cols-1">
            {isAbsence ? (
              <>
                <Dato icon={<FiCalendar />} label="Desde" value={fmtDate(item.absenceStart)} />
                <Dato icon={<FiCalendar />} label="Hasta" value={fmtDate(item.absenceEnd)} />
              </>
            ) : (
              <>
                <Dato icon={<FiCalendar />} label="Fecha y hora" value={`${text(item.fechaIncidente)} · ${text(item.horaIncidente)}`} />
                <Dato icon={<FiClock />} label="Turno" value={formatTurno(item.turno)} />
              </>
            )}
            <Dato icon={<FiMapPin />} label="Jurisdicción" value={text(item.jurisdiccion)} />
            <Dato icon={<FiBriefcase />} label="Subgerencia" value={text(item.subgerencia)} />
            <Dato icon={<FiVideo />} label="Medio" value={medioLabel(item)} />
            <Dato icon={<FiUser />} label="Bodycam asignada a" value={text(item.bodycamAsignadaA)} />
            <Dato icon={<FiUser />} label="Registrado por" value={text(item.registradoPor)} />
            <Dato icon={<FiPaperclip />} label="Evidencias" value={`${item.evidences?.length ?? 0} archivo(s)`} />
          </dl>
        </section>

        <section>
          <Titulo>Destinatarios</Titulo>
          <dl className="m-0 grid grid-cols-2 gap-2.5 max-[560px]:grid-cols-1">
            <Dato icon={<FiMail />} label="Dirigido a" value={text(item.dirigidoA)} />
            <Dato icon={<FiUser />} label="Destinatario" value={text(item.destinatario)} />
          </dl>
          {item.cc && item.cc.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-content-2">Con copia:</span>
              {item.cc.map((c) => (
                <span key={c} className="rounded-lg bg-primary/8 px-2 py-1 text-xs font-semibold text-primary dark:text-accent-light">
                  {c}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Acciones */}
      <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-subtle px-6 py-3.5">
        {canDelete &&
          (isDisabled ? (
            <Button variant="ghost" icon={<FiRotateCcw />} className="mr-auto" onClick={run(() => onDelete(item.id, item.status))}>
              Restaurar
            </Button>
          ) : (
            <Button variant="ghost" icon={<FiTrash2 />} className="mr-auto" onClick={run(() => onDelete(item.id, item.status))}>
              Deshabilitar
            </Button>
          ))}

        <Button variant="secondary" icon={<FiFileText />} onClick={run(() => onEdit(item))}>
          Ver PDF
        </Button>

        {canSendToValidator && (
          <Button icon={<FiSend />} onClick={run(() => onSend(item.id))}>
            Enviar a validación
          </Button>
        )}

        {canValidateReport && (
          <>
            <Button variant="danger" icon={<FiX />} onClick={run(() => onReject(item.id))}>
              Rechazar
            </Button>
            <Button icon={<FiCheck />} onClick={run(() => onApprove(item.id))}>
              Aprobar
            </Button>
          </>
        )}
      </footer>
    </div>
  )
}
