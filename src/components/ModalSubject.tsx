import React, { useEffect, useState } from 'react'
import type { CreateSubjectDto, Subject } from '@/types'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import { Field, Textarea } from '@/components/UI/Field'
import { ModalHero } from '@/components/UI/FormSteps'
import { colorAsunto } from '@/components/SubjectTable'
import { nombreCorto } from '@/pages/Dashboard/asuntos'
import { cn } from '@/utils/classes'
import { FiCheckCircle, FiEdit3, FiFolderPlus, FiPlus, FiSave, FiZap } from 'react-icons/fi'

/** Inicios habituales de los asuntos (se insertan con un clic) */
const PREFIJOS = ['Conductas relacionadas con el ', 'Conductas relacionadas con la ', 'Conductas que podrían afectar ']

export interface ModalSubjectProps {
  initial?: Subject | null
  onClose: () => void
  onSave: (data: CreateSubjectDto) => void | Promise<void>
}

interface SubjectForm {
  name: string
}

type SubjectFormErrors = Partial<Record<keyof SubjectForm, string>>

const defaultState: SubjectForm = {
  name: ''
}

export default function ModalSubject({ initial, onClose, onSave }: ModalSubjectProps) {
  const [form, setForm] = useState<SubjectForm>(defaultState)
  const [errors, setErrors] = useState<SubjectFormErrors>({})

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || ''
      })
    }
  }, [initial])

  function handleChange(field: keyof SubjectForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  function validate() {
    const newErrors: SubjectFormErrors = {}

    if (!form.name.trim()) {
      newErrors.name = 'El nombre del asunto es requerido'
    }

    if (form.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const dataToSave = {
      name: form.name.trim()
    }

    onSave(dataToSave)
  }

  const nombre = form.name.trim()
  const corto = nombre ? nombreCorto(nombre) : ''
  const color = nombre ? colorAsunto(nombre) : 'var(--border-strong)'
  const valido = nombre.length >= 3

  return (
    <Modal
      title={initial ? 'Editar asunto' : 'Nuevo asunto'}
      header={
        <ModalHero
          icon={initial ? <FiEdit3 /> : <FiFolderPlus />}
          eyebrow={initial ? 'Editar catálogo' : 'Nuevo en el catálogo'}
          title={initial ? 'Editar asunto' : 'Nuevo asunto'}
          subtitle="Los asuntos agrupan las faltas disciplinarias por tipo de conducta."
          onClose={onClose}
        />
      }
      onClose={onClose}
      size="md"
      bodyClassName="bg-page"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-subject" icon={initial ? <FiSave /> : <FiPlus />}>
            {initial ? 'Guardar cambios' : 'Agregar asunto'}
          </Button>
        </>
      }
    >
      <form id="form-subject" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Vista previa: asi se vera la fila en el catalogo */}
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_var(--shadow)]" style={{ borderLeft: `4px solid ${color}` }}>
          <p className="m-0 mb-2.5 text-[11px] font-bold tracking-[0.12em] text-muted uppercase">Vista previa en el catálogo</p>
          <div className="flex items-center gap-3.5">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-content"
              style={{ background: `color-mix(in srgb, ${color} 18%, transparent)` }}
              aria-hidden
            >
              {initial ? '✎' : 'Nº'}
            </span>
            <div className="min-w-0">
              <p className={cn('m-0 truncate text-[15px] font-bold', nombre ? 'text-content' : 'text-muted')}>{corto || 'Nombre corto del asunto'}</p>
              <p className="m-0 truncate text-xs text-muted">{nombre && corto !== nombre ? nombre : initial ? `${initial.lacks?.length ?? 0} faltas asociadas` : 'Las faltas se asocian después de crearlo'}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_var(--shadow)] max-sm:p-4">
          <Field
            label="Nombre del asunto"
            required
            error={errors.name}
            hint={errors.name ? undefined : 'En el catálogo se muestra una versión corta, sin el prefijo «Conductas relacionadas con…».'}
          >
            <Textarea
              placeholder="Ej.: Conductas relacionadas con el cumplimiento de funciones o desempeño"
              value={form.name}
              // Es un nombre: los saltos de linea se vuelven espacios
              onChange={(e) => handleChange('name', e.target.value.replace(/[\r\n]+/g, ' '))}
              invalid={!!errors.name}
              rows={2}
              autoFocus
              className="min-h-0 text-[14.5px]"
            />
          </Field>

          {!nombre && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <FiZap aria-hidden /> Empezar con:
              </span>
              {PREFIJOS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleChange('name', p)}
                  className="cursor-pointer rounded-lg border border-line bg-subtle px-2.5 py-1 text-xs font-medium text-content-2 transition-colors hover:border-line-strong hover:text-content"
                >
                  {p.trim()}…
                </button>
              ))}
            </div>
          )}

          {valido && (
            <p className="m-0 flex items-center gap-2 text-xs font-medium text-lime-ink">
              <FiCheckCircle aria-hidden />
              Todo listo para guardar.
            </p>
          )}
        </div>
      </form>
    </Modal>
  )
}
