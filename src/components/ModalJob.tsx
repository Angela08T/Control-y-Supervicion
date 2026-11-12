import React, { useEffect, useState } from 'react'
import type { CreateJobDto, Job } from '@/types'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import { Field, Input } from '@/components/UI/Field'
import { ModalHero } from '@/components/UI/FormSteps'
import { cn } from '@/utils/classes'
import { FiAlertTriangle, FiBriefcase, FiCheckCircle, FiEdit3, FiPlus, FiSave } from 'react-icons/fi'

export interface ModalJobProps {
  initial?: Job | null
  onClose: () => void
  onSave: (data: CreateJobDto) => void | Promise<void>
  /** Nombres de los cargos ya registrados, para avisar si se repite */
  existentes?: string[]
}

/** Compara nombres sin importar mayusculas, tildes ni espacios de mas */
const normalizar = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

interface JobForm {
  name: string
}

type JobFormErrors = Partial<Record<keyof JobForm, string>>

const defaultState: JobForm = {
  name: ''
}

export default function ModalJob({ initial, onClose, onSave, existentes = [] }: ModalJobProps) {
  const [form, setForm] = useState<JobForm>(defaultState)
  const [errors, setErrors] = useState<JobFormErrors>({})

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || ''
      })
    }
  }, [initial])

  function handleChange(field: keyof JobForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  function validate() {
    const newErrors: JobFormErrors = {}

    if (!form.name.trim()) {
      newErrors.name = 'El nombre del cargo es requerido'
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
  // Aviso (no bloquea): ya existe un cargo con ese nombre, salvo el que se esta editando
  const repetido =
    !!nombre &&
    normalizar(nombre) !== normalizar(initial?.name ?? '') &&
    existentes.some(e => normalizar(e) === normalizar(nombre))

  return (
    <Modal
      title={initial ? 'Editar cargo' : 'Nuevo cargo'}
      header={
        <ModalHero
          icon={initial ? <FiEdit3 /> : <FiBriefcase />}
          eyebrow={initial ? 'Editar puesto' : 'Nuevo puesto'}
          title={initial ? 'Editar cargo' : 'Nuevo cargo'}
          subtitle="El cargo estará disponible para asignar al personal."
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
          <Button type="submit" form="form-job" icon={initial ? <FiSave /> : <FiPlus />}>
            {initial ? 'Guardar cambios' : 'Agregar cargo'}
          </Button>
        </>
      }
    >
      <form id="form-job" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Vista previa de la tarjeta del cargo */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_var(--shadow)]">
          <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#1e3a8a,#6250d6)]" />
          <p className="m-0 mb-3 text-[11px] font-bold tracking-[0.12em] text-muted uppercase">Vista previa</p>
          <div className="flex items-center gap-3.5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary dark:bg-primary/25 dark:text-accent-light" aria-hidden>
              <FiBriefcase />
            </span>
            <div className="min-w-0">
              <p className={cn('m-0 truncate text-base font-bold', nombre ? 'text-content' : 'text-muted')}>{nombre || 'Nombre del cargo'}</p>
              <p className="m-0 text-xs text-muted">{initial ? 'Se actualizará en todo el personal con este cargo' : 'Aún sin personal asignado'}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_var(--shadow)] max-sm:p-4">
          <Field label="Nombre del cargo" required error={errors.name}>
            <div className="relative">
              <FiBriefcase className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
              <Input
                type="text"
                placeholder="Ej.: Teniente, capitán, subgerente"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                invalid={!!errors.name}
                autoFocus
                className="pl-9"
              />
            </div>
          </Field>

          {repetido ? (
            <p className="m-0 flex items-start gap-2 rounded-xl border border-warning/35 bg-warning/10 px-3 py-2 text-xs font-medium text-amber-ink" role="status">
              <FiAlertTriangle className="mt-px shrink-0" aria-hidden />
              Ya existe un cargo con este nombre. Revisa que no lo estés duplicando.
            </p>
          ) : (
            nombre && (
              <p className="m-0 flex items-center gap-2 text-xs font-medium text-lime-ink">
                <FiCheckCircle aria-hidden />
                Todo listo para guardar.
              </p>
            )
          )}
        </div>
      </form>
    </Modal>
  )
}
