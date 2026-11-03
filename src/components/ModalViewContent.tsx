import React from 'react'
import { FaFileAlt, FaTimes } from 'react-icons/fa'
import {
  btnSecondary,
  cn,
  modalBackdrop,
  modalCard,
  modalClose,
  modalHeader,
  modalTitle
} from '../utils/classes'

export interface ModalViewContentProps {
  content?: string | null
  title?: string
  onClose: () => void
}

export default function ModalViewContent({ content, title, onClose }: ModalViewContentProps) {
  return (
    <div className={modalBackdrop}>
      <div
        className={cn(modalCard, 'max-h-[90vh] max-w-[900px] max-[900px]:my-2.5 max-[900px]:w-[95%] max-[900px]:overflow-y-auto')}
      >
        <div className={modalHeader}>
          <h3 className={cn(modalTitle, 'flex items-center gap-[10px]')}>
            <FaFileAlt />
            {title || 'Vista de Contenido'}
          </h3>
          <button className={cn(modalClose, 'ease-[ease]')} onClick={onClose}>×</button>
        </div>

        <div className="flex max-h-[calc(90vh-120px)] flex-col gap-3 overflow-y-auto p-5 [background:var(--bg)]">
          {/* Contenido */}
          <div className="rounded-lg border border-line p-5 font-[monospace] text-[0.9rem] leading-[1.8] whitespace-pre-wrap [background:var(--bg)] [word-break:break-word]">
            {content || 'Sin contenido disponible'}
          </div>

          {/* Información sobre placeholders */}
          <div className="mt-5 rounded-lg border border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.05)] p-[15px] text-[0.85rem] text-content-2">
            <strong className="mb-2 block">
              📝 Placeholders identificados en el contenido:
            </strong>
            <div className="mt-2.5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-1.5">
              {[
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
              ].map((placeholder) => {
                const isPresent = content && content.includes(placeholder)
                return (
                  <span
                    key={placeholder}
                    className={cn(
                      'inline-block rounded-[6px] border px-2 py-1 font-[monospace] text-[0.8rem]',
                      isPresent
                        ? 'border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#22c55e]'
                        : 'border-[rgba(156,163,175,0.2)] bg-[rgba(156,163,175,0.1)] text-[#9ca3af]'
                    )}
                  >
                    {isPresent && '✓ '}{placeholder}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Botón de cerrar */}
          <div className="mt-5 flex justify-end">
            <button
              className={cn(btnSecondary, 'ease-[ease] flex items-center gap-2')}
              onClick={onClose}
            >
              <FaTimes />
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
