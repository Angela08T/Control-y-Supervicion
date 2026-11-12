import React, { useState } from 'react'
import { FiCheck, FiEye, FiFileText, FiTag } from 'react-icons/fi'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import { ModalHero, heroChip } from '@/components/UI/FormSteps'
import { cn } from '@/utils/classes'
import { nombreCorto } from '@/pages/Dashboard/asuntos'
import { MARCADORES, Paper, TemplateText } from './lackTemplate'

export interface ModalViewContentProps {
  content?: string | null
  title?: string
  /** Articulo y asunto de la falta (para la cabecera) */
  article?: string | null
  subject?: string | null
  onClose: () => void
}

/**
 * Plantilla del informe de una falta, como documento: se puede ver con los marcadores como
 * etiquetas o con datos de ejemplo, y al lado la lista de datos que usa.
 */
export default function ModalViewContent({ content, title, article, subject, onClose }: ModalViewContentProps) {
  const [modo, setModo] = useState<'etiqueta' | 'ejemplo'>('ejemplo')
  const texto = content || ''

  const tabBtn = (activo: boolean) =>
    cn(
      'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border-none px-2.5 text-[13px] font-semibold transition-colors',
      activo ? 'bg-surface text-content shadow-[0_1px_2px_rgba(15,23,42,0.12)]' : 'bg-transparent text-muted hover:text-content'
    )

  return (
    <Modal
      title={title || 'Plantilla del informe'}
      header={
        <ModalHero icon={<FiFileText />} eyebrow="Plantilla del informe" title={title || 'Falta'} onClose={onClose}>
          <div className="flex flex-wrap items-center gap-2">
            {article && <span className={heroChip}>Art. {article}</span>}
            {subject && <span className={heroChip} title={subject}>{nombreCorto(subject)}</span>}
          </div>
        </ModalHero>
      }
      onClose={onClose}
      size="xl"
      bodyClassName="bg-page"
      footer={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_240px] gap-5 max-lg:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-3">
          <div role="group" aria-label="Cómo mostrar los datos" className="inline-flex items-center gap-0.5 self-start rounded-xl bg-subtle p-1">
            <button type="button" aria-pressed={modo === 'ejemplo'} onClick={() => setModo('ejemplo')} className={tabBtn(modo === 'ejemplo')}>
              <FiEye aria-hidden /> Con datos de ejemplo
            </button>
            <button type="button" aria-pressed={modo === 'etiqueta'} onClick={() => setModo('etiqueta')} className={tabBtn(modo === 'etiqueta')}>
              <FiTag aria-hidden /> Con marcadores
            </button>
          </div>
          <Paper>
            {texto ? <TemplateText texto={texto} modo={modo} /> : <span className="text-[#6b7280] italic">Sin contenido disponible.</span>}
          </Paper>
        </div>

        {/* Datos que usa la plantilla */}
        <aside className="flex flex-col gap-2 self-start rounded-2xl border border-line bg-surface p-4">
          <h4 className="m-0 text-[13px] font-semibold text-content">Datos que se completan</h4>
          <p className="m-0 text-xs text-muted">Se reemplazan al generar el documento.</p>
          <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
            {MARCADORES.map(m => {
              const usa = texto.includes(m.token)
              return (
                <li key={m.token} className={cn('flex items-center gap-2 rounded-lg px-2 py-1 text-[13px]', usa ? 'text-content' : 'text-muted')} title={m.token}>
                  <span
                    className={cn('flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]', usa ? 'bg-success/15 text-lime-ink' : 'bg-subtle')}
                    aria-hidden
                  >
                    {usa && <FiCheck />}
                  </span>
                  <span className={cn('flex-1', usa && 'font-medium')}>{m.label}</span>
                  <span className="sr-only">{usa ? '(se usa)' : '(no se usa)'}</span>
                </li>
              )
            })}
          </ul>
        </aside>
      </div>
    </Modal>
  )
}
