import React, { useEffect } from 'react'
import { FiCheck, FiFileText, FiRotateCcw, FiSend, FiTrash2, FiX } from 'react-icons/fi'
import type { ID, Incidencia, IncidenciaStatus } from '@/types'
import Button from '@/components/UI/Button'
import { StatusBadge } from '@/components/UI/Badge'
import { cn, modalClose, modalHeader, modalTitle } from '@/utils/classes'

const DASH = '—'
const TITLE_ID = 'incidencia-detalle-titulo'

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

/** Texto o guion si esta vacio. */
function text(value?: string | null): string {
  return value && value.trim() ? value : DASH
}

/** Fecha dd/mm/aaaa desde un ISO. */
function fmtDate(iso?: string | null): string {
  if (!iso) return DASH
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return DASH
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Fecha y hora desde un ISO. */
function fmtDateTime(iso?: string | null): string {
  if (!iso) return DASH
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return DASH
  return `${fmtDate(iso)} a las ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-4 first:border-t-0 first:pt-0">
      <h4 className="m-0 mb-3 text-[13px] font-semibold text-content">{title}</h4>
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 max-[600px]:grid-cols-1">{children}</dl>
    </section>
  )
}

function Item({ label, value, wide = false }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn('min-w-0', wide && 'col-span-2')}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="m-0 mt-0.5 break-words text-sm text-content">{value}</dd>
    </div>
  )
}

export interface IncidenciaDetailDrawerProps {
  item: Incidencia
  onClose: () => void
  onEdit: (item: Incidencia) => void
  onDelete: (id: ID, status: IncidenciaStatus) => void
  onSend: (id: ID) => void
  onApprove: (id: ID) => void
  onReject: (id: ID) => void
  canDelete: boolean
  canSendToValidator: boolean
  canValidateReport: boolean
}

/** Panel lateral con el detalle completo de una incidencia y sus acciones. */
export default function IncidenciaDetailDrawer({
  item,
  onClose,
  onEdit,
  onDelete,
  onSend,
  onApprove,
  onReject,
  canDelete,
  canSendToValidator,
  canValidateReport,
}: IncidenciaDetailDrawerProps) {
  const isDisabled = !!item.deletedAt
  const isAbsence = item.isAbsenceReport

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  /** Ejecuta la accion de la tabla y cierra el panel */
  const run = (action: () => void) => () => {
    action()
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-[2000] bg-slate-900/45" onClick={onClose} aria-hidden />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="fixed inset-y-0 right-0 z-[2000] flex w-[460px] max-w-full flex-col border-l border-line bg-surface shadow-[0_16px_48px_rgba(15,23,42,0.18)] animate-[drawerIn_0.2s_ease-out]"
      >
        <header className={cn(modalHeader, 'gap-3')}>
          <div className="flex min-w-0 items-center gap-3">
            <h2 id={TITLE_ID} className={modalTitle}>
              Incidencia
            </h2>
            <StatusBadge status={item.status} disabled={isDisabled} />
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar panel" title="Cerrar panel" autoFocus className={modalClose}>
            <FiX aria-hidden />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
          <Section title="Infractor">
            <Item label="Nombre" value={text(item.nombreCompleto)} />
            <Item label="DNI" value={text(item.dni)} />
            <Item label="Subgerencia" value={text(item.subgerencia)} />
            <Item label="Cargo" value={text(item.cargo)} />
            <Item label="Régimen laboral" value={text(item.regLab)} />
          </Section>

          <Section title="El hecho">
            <Item label="Asunto" value={text(item.asunto)} wide />
            <Item label="Falta" value={text(item.falta)} wide />
            <Item label="Fecha" value={text(item.fechaIncidente)} />
            <Item label="Hora" value={text(item.horaIncidente)} />
            <Item label="Turno" value={formatTurno(item.turno)} />
            <Item label="Jurisdicción" value={text(item.jurisdiccion)} />
          </Section>

          <Section title="Medio">
            <Item label="Tipo" value={isAbsence ? 'Reporte' : text(item.medio)} />
            <Item label="Bodycam asignada" value={text(item.bodycamNumber)} />
            <Item label="Asignada a" value={text(item.bodycamAsignadaA)} />
          </Section>

          <Section title="Destinatarios">
            <Item label="Dirigido a" value={text(item.dirigidoA)} />
            <Item label="Destinatario" value={text(item.destinatario)} />
            <Item label="Con copia" value={item.cc && item.cc.length > 0 ? item.cc.join(', ') : DASH} wide />
          </Section>

          <Section title="Registro">
            <Item label="Registrado por" value={text(item.registradoPor)} />
            <Item label="Evidencias" value={String(item.evidences?.length ?? 0)} />
            {isAbsence && <Item label="Desde" value={fmtDate(item.absenceStart)} />}
            {isAbsence && <Item label="Hasta" value={fmtDate(item.absenceEnd)} />}
            {isDisabled && <Item label="Deshabilitado" value={fmtDateTime(item.deletedAt)} wide />}
          </Section>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-subtle px-6 py-4">
          {canDelete &&
            (isDisabled ? (
              <Button
                variant="ghost"
                icon={<FiRotateCcw />}
                className="mr-auto"
                onClick={run(() => onDelete(item.id, item.status))}
              >
                Restaurar
              </Button>
            ) : (
              <Button
                variant="ghost"
                icon={<FiTrash2 />}
                className="mr-auto"
                onClick={run(() => onDelete(item.id, item.status))}
              >
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
              <Button icon={<FiCheck />} onClick={run(() => onApprove(item.id))}>
                Aprobar
              </Button>
              <Button variant="danger" icon={<FiX />} onClick={run(() => onReject(item.id))}>
                Rechazar
              </Button>
            </>
          )}
        </footer>
      </aside>
    </>
  )
}
