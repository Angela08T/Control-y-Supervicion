import React, { useState, useEffect } from 'react'
import type { Offender } from '@/types'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import { Field, Input } from '@/components/UI/Field'
import { ModalHero, StepSection } from '@/components/UI/FormSteps'
import { Turno } from '@/components/OffenderTable'
import { colorAvatar, iniciales } from '@/utils/incidenciaFormat'
import { cn } from '@/utils/classes'
import { FiBriefcase, FiCheckCircle, FiEdit3, FiMoon, FiPlus, FiSave, FiSun, FiSunset, FiUser, FiUserX } from 'react-icons/fi'

const normalizarTurno = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const TURNOS = [
  { value: 'Mañana', icon: <FiSun /> },
  { value: 'Tarde', icon: <FiSunset /> },
  { value: 'Noche', icon: <FiMoon /> },
]

/** Datos del formulario de infractor que se envían al guardar */
export interface OffenderFormData {
  name: string
  lastname: string
  dni: string
  job: string
  regime: string
  shift: string
  subgerencia: string
}

/** Errores por campo del formulario (null = sin error) */
type OffenderFormErrors = Partial<Record<keyof OffenderFormData, string | null>>

export interface ModalOffenderProps {
  initial?: Partial<Offender> | null
  onClose: () => void
  onSave: (data: OffenderFormData) => void
}

export default function ModalOffender({ initial, onClose, onSave }: ModalOffenderProps) {
  const [formData, setFormData] = useState<OffenderFormData>({
    name: '',
    lastname: '',
    dni: '',
    job: '',
    regime: '',
    shift: 'Mañana',
    subgerencia: ''
  })

  const [errors, setErrors] = useState<OffenderFormErrors>({})

  useEffect(() => {
    if (initial) {
      setFormData({
        name: initial.name || '',
        lastname: initial.lastname || '',
        dni: initial.dni || '',
        job: initial.job || '',
        regime: initial.regime || '',
        shift: initial.shift || 'Mañana',
        subgerencia: initial.subgerencia || ''
      })
    }
  }, [initial])

  function handleChange(field: keyof OffenderFormData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  function validateForm() {
    const newErrors: OffenderFormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.lastname.trim()) {
      newErrors.lastname = 'El apellido es requerido'
    }

    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es requerido'
    } else if (!/^\d{8}$/.test(formData.dni)) {
      newErrors.dni = 'El DNI debe tener exactamente 8 dígitos'
    }

    if (!formData.job.trim()) {
      newErrors.job = 'El cargo es requerido'
    }

    if (!formData.regime.trim()) {
      newErrors.regime = 'El régimen es requerido'
    }

    if (!formData.subgerencia.trim()) {
      newErrors.subgerencia = 'La subgerencia es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    onSave(formData)
  }

  const nombre = `${formData.name} ${formData.lastname}`.trim()
  const datosPersonales = !!formData.name.trim() && !!formData.lastname.trim() && /^\d{8}$/.test(formData.dni)
  const datosLaborales = !!formData.job.trim() && !!formData.regime.trim() && !!formData.subgerencia.trim()

  return (
    <Modal
      title={initial ? 'Editar infractor' : 'Agregar infractor'}
      header={
        <ModalHero
          icon={initial ? <FiEdit3 /> : <FiUserX />}
          eyebrow={initial ? 'Editar registro' : 'Nuevo registro'}
          title={initial ? 'Editar infractor' : 'Agregar infractor'}
          subtitle="Los campos marcados con * son obligatorios."
          onClose={onClose}
        />
      }
      onClose={onClose}
      size="lg"
      bodyClassName="bg-page"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-offender" icon={initial ? <FiSave /> : <FiPlus />}>
            {initial ? 'Guardar cambios' : 'Guardar infractor'}
          </Button>
        </>
      }
    >
      <form id="form-offender" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Vista previa de la ficha */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_var(--shadow)]">
          <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: formData.dni || nombre ? colorAvatar(formData.dni || nombre) : 'var(--border)' }} />
          <p className="m-0 mb-3 text-[11px] font-bold tracking-[0.12em] text-muted uppercase">Vista previa de la ficha</p>
          <div className="flex flex-wrap items-center gap-3.5">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white shadow-sm"
              style={{ background: formData.dni || nombre ? colorAvatar(formData.dni || nombre) : 'var(--border-strong)' }}
              aria-hidden
            >
              {nombre ? iniciales(nombre) : <FiUser />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('m-0 truncate text-base font-bold', nombre ? 'text-content' : 'text-muted')}>{nombre || 'Nombre y apellido'}</p>
              <p className="m-0 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                <span className="rounded-md bg-subtle px-1.5 py-px font-mono font-semibold tracking-[0.04em] text-content-2">
                  {formData.dni.padEnd(8, '·')}
                </span>
                <span className="inline-flex items-center gap-1 truncate">
                  <FiBriefcase aria-hidden /> {formData.job || 'Cargo'}
                </span>
              </p>
            </div>
            <Turno turno={formData.shift} />
          </div>
        </div>

        <StepSection id="inf-personales" n={1} title="Datos personales" icon={<FiUser />} done={datosPersonales}>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Field label="Nombre" required error={errors.name ?? undefined}>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej.: Juan Carlos"
                invalid={!!errors.name}
                autoFocus
              />
            </Field>

            <Field label="Apellido" required error={errors.lastname ?? undefined}>
              <Input
                type="text"
                value={formData.lastname}
                onChange={(e) => handleChange('lastname', e.target.value)}
                placeholder="Ej.: Quispe Huamán"
                invalid={!!errors.lastname}
              />
            </Field>

            <Field
              label="DNI"
              required
              error={errors.dni ?? undefined}
              hint={errors.dni ? undefined : formData.dni.length === 8 ? 'DNI completo' : `${8 - formData.dni.length} dígitos por escribir`}
            >
              <Input
                type="text"
                inputMode="numeric"
                value={formData.dni}
                onChange={(e) => handleChange('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="Ej.: 43044869"
                maxLength={8}
                invalid={!!errors.dni}
                className="font-mono text-[15px] tracking-[0.08em]"
              />
            </Field>
          </div>
        </StepSection>

        <StepSection id="inf-laborales" n={2} title="Datos laborales" icon={<FiBriefcase />} done={datosLaborales}>
          <Field label="Turno" required>
            <div role="radiogroup" aria-label="Turno" className="grid grid-cols-3 gap-2">
              {TURNOS.map(t => {
                // El backend puede guardar el turno en mayusculas (MAÑANA): se compara sin tildes ni mayusculas
                const activo = normalizarTurno(formData.shift) === normalizarTurno(t.value)
                return (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={activo}
                    onClick={() => handleChange('shift', t.value)}
                    className={cn(
                      'flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-[13px] font-semibold transition-colors duration-150',
                      activo
                        ? 'border-primary bg-primary/8 text-primary dark:border-accent dark:bg-primary/20 dark:text-accent-light'
                        : 'border-line bg-surface text-content-2 hover:border-line-hover hover:bg-subtle'
                    )}
                  >
                    <span className="text-base" aria-hidden>{t.icon}</span>
                    {t.value}
                  </button>
                )
              })}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Field label="Cargo" required error={errors.job ?? undefined}>
              <Input
                type="text"
                value={formData.job}
                onChange={(e) => handleChange('job', e.target.value)}
                placeholder="Ej.: Inspector comercial"
                invalid={!!errors.job}
              />
            </Field>

            <Field label="Régimen" required error={errors.regime ?? undefined}>
              <Input
                type="text"
                value={formData.regime}
                onChange={(e) => handleChange('regime', e.target.value)}
                placeholder="Ej.: Locador, CAS 1057, 728"
                invalid={!!errors.regime}
              />
            </Field>
          </div>

          <Field label="Subgerencia" required error={errors.subgerencia ?? undefined}>
            <Input
              type="text"
              value={formData.subgerencia}
              onChange={(e) => handleChange('subgerencia', e.target.value)}
              placeholder="Ej.: Fiscalización y sanciones administrativas"
              invalid={!!errors.subgerencia}
            />
          </Field>

          {datosPersonales && datosLaborales && (
            <p className="m-0 flex items-center gap-2 text-xs font-medium text-lime-ink">
              <FiCheckCircle aria-hidden />
              Todo listo para guardar.
            </p>
          )}
        </StepSection>
      </form>
    </Modal>
  )
}
