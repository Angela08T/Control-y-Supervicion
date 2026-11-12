import React, { useEffect, useState } from 'react'
import type { BodycamView, CreateBodycamDto } from '@/types'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import { Field, Input } from '@/components/UI/Field'
import { ModalHero } from '@/components/UI/FormSteps'
import { FiCheckCircle, FiEdit3, FiHash, FiPlus, FiSave, FiShield, FiVideo } from 'react-icons/fi'
import { cn } from '@/utils/classes'

export interface ModalBodycamProps {
  initial?: Pick<BodycamView, 'name' | 'serie'> | null
  onClose: () => void
  onSave: (data: Pick<CreateBodycamDto, 'name' | 'serie'>) => void | Promise<void>
}

interface BodycamForm {
  name: string
  serie: string
}

type BodycamFormErrors = Partial<Record<keyof BodycamForm, string>>

const defaultState: BodycamForm = {
  name: '',
  serie: ''
}

export default function ModalBodycam({ initial, onClose, onSave }: ModalBodycamProps) {
  const [form, setForm] = useState<BodycamForm>(defaultState)
  const [errors, setErrors] = useState<BodycamFormErrors>({})

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        serie: initial.serie || ''
      })
    }
  }, [initial])

  function handleChange(field: keyof BodycamForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  function validate() {
    const newErrors: BodycamFormErrors = {}

    if (!form.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!form.serie.trim()) {
      newErrors.serie = 'La serie es requerida'
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
      name: form.name.trim(),
      serie: form.serie.trim()
    }

    onSave(dataToSave)
  }

  // Vista previa: el subtipo se reconoce por el prefijo del nombre
  const nombre = form.name.trim().toUpperCase()
  const subtipo = nombre.startsWith('FISCA') ? 'FISCA' : nombre.startsWith('SG') ? 'SG' : null
  const listo = !!form.name.trim() && !!form.serie.trim()

  return (
    <Modal
      title={initial ? 'Editar dispositivo' : 'Agregar dispositivo'}
      header={
        <ModalHero
          icon={initial ? <FiEdit3 /> : <FiVideo />}
          eyebrow={initial ? 'Editar equipo' : 'Nuevo equipo'}
          title={initial ? 'Editar dispositivo' : 'Agregar dispositivo'}
          subtitle="Los campos marcados con * son obligatorios."
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
          <Button type="submit" form="form-bodycam" icon={initial ? <FiSave /> : <FiPlus />}>
            {initial ? 'Guardar cambios' : 'Guardar dispositivo'}
          </Button>
        </>
      }
    >
      <form id="form-bodycam" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Vista previa de como se vera en la lista */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_var(--shadow)]">
          <span aria-hidden className="pointer-events-none absolute -top-10 -right-8 size-28 rounded-full bg-primary/6" />
          <p className="relative m-0 mb-3 text-[11px] font-bold tracking-[0.12em] text-muted uppercase">Vista previa</p>
          <div className="relative flex items-center gap-3.5">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary dark:bg-primary/25 dark:text-accent-light"
              aria-hidden
            >
              {subtipo === 'FISCA' ? <FiShield /> : <FiVideo />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('m-0 truncate text-base font-bold tracking-[0.02em]', nombre ? 'text-content' : 'text-muted')}>
                {nombre || 'NOMBRE DEL EQUIPO'}
              </p>
              <p className="m-0 mt-0.5 flex items-center gap-1 truncate font-mono text-xs text-muted">
                <FiHash aria-hidden />
                {form.serie.trim() || 'Serie pendiente'}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-accent-light">
              Bodycam
              {subtipo && <span className="rounded bg-surface/70 px-1.5 text-[10px] font-bold tracking-[0.06em] dark:bg-black/20">{subtipo}</span>}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_var(--shadow)] max-sm:p-4">
          <Field
            label="Nombre del dispositivo"
            required
            error={errors.name}
            hint="Empieza con SG o FISCA para que se reconozca el tipo."
          >
            <div className="relative">
              <FiVideo className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
              <Input
                type="text"
                placeholder="Ej.: FISCA091, SG999"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value.toUpperCase())}
                invalid={!!errors.name}
                autoFocus
                className="pl-9 font-semibold tracking-[0.04em] uppercase"
              />
            </div>
          </Field>

          <Field label="Número de serie" required error={errors.serie}>
            <div className="relative">
              <FiHash className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
              <Input
                type="text"
                placeholder="Ej.: 22709A0381"
                value={form.serie}
                onChange={(e) => handleChange('serie', e.target.value)}
                invalid={!!errors.serie}
                className="pl-9 font-mono"
              />
            </div>
          </Field>

          {listo && (
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
