import React from 'react'
import { FiCheck, FiFileText } from 'react-icons/fi'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'

export interface ModalViewContentProps {
  content?: string | null
  title?: string
  onClose: () => void
}

const PLACEHOLDERS = [
  '{{offender.name}}',
  '{{offender.lastname}}',
  '{{offender.regime}}',
  '{{offender.job}}',
  '{{offender.shift}}',
  '{{bodycam.name}}',
  '{{lack.name}}',
  '{{address}}',
  '{{dates}}',
  '{{time}}'
]

export default function ModalViewContent({ content, title, onClose }: ModalViewContentProps) {
  return (
    <Modal
      title={
        <span className="inline-flex items-center gap-2">
          <FiFileText aria-hidden />
          {title || 'Vista del contenido'}
        </span>
      }
      description="Revisa el texto y los marcadores que contiene."
      onClose={onClose}
      size="lg"
      footer={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}
    >
      {/* Contenido (texto tal cual) */}
      <div className="rounded-lg border border-line p-5 font-[monospace] text-[0.9rem] leading-[1.8] whitespace-pre-wrap [background:var(--bg)] [word-break:break-word]">
        {content || 'Sin contenido disponible'}
      </div>

      {/* Marcadores identificados en el contenido */}
      <section className="flex flex-col gap-3 rounded-lg border border-line bg-subtle p-4">
        <h4 className="m-0 text-[13px] font-semibold text-content">Marcadores en el contenido</h4>
        <div className="flex flex-wrap gap-2">
          {PLACEHOLDERS.map((placeholder) => {
            const isPresent = !!content && content.includes(placeholder)
            return (
              <Badge
                key={placeholder}
                tone={isPresent ? 'success' : 'neutral'}
                dot={false}
                className="font-[monospace]"
              >
                {isPresent && <FiCheck aria-hidden />}
                {placeholder}
              </Badge>
            )
          })}
        </div>
      </section>
    </Modal>
  )
}
