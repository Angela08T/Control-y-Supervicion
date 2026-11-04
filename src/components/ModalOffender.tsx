import React, { useState, useEffect } from 'react'
import type { Offender } from '@/types'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import { Field, Input, Select } from '@/components/UI/Field'

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

  return (
    <Modal
      title={initial ? 'Editar infractor' : 'Agregar infractor'}
      description="Los campos marcados con * son obligatorios."
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-offender">
            {initial ? 'Guardar cambios' : 'Guardar infractor'}
          </Button>
        </>
      }
    >
      <form id="form-offender" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <section className="flex flex-col gap-4">
          <h4 className="m-0 text-[13px] font-semibold text-content">Datos personales</h4>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Field label="Nombre" required error={errors.name ?? undefined}>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ingrese el nombre"
                invalid={!!errors.name}
              />
            </Field>

            <Field label="Apellido" required error={errors.lastname ?? undefined}>
              <Input
                type="text"
                value={formData.lastname}
                onChange={(e) => handleChange('lastname', e.target.value)}
                placeholder="Ingrese el apellido"
                invalid={!!errors.lastname}
              />
            </Field>

            <Field label="DNI" required error={errors.dni ?? undefined} hint={errors.dni ? undefined : '8 dígitos'}>
              <Input
                type="text"
                inputMode="numeric"
                value={formData.dni}
                onChange={(e) => handleChange('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="Ej: 43044869"
                maxLength={8}
                invalid={!!errors.dni}
              />
            </Field>
          </div>
        </section>

        <section className="flex flex-col gap-4 border-t border-line pt-4">
          <h4 className="m-0 text-[13px] font-semibold text-content">Datos laborales</h4>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Field label="Cargo" required error={errors.job ?? undefined}>
              <Input
                type="text"
                value={formData.job}
                onChange={(e) => handleChange('job', e.target.value)}
                placeholder="Ej: Inspector comercial"
                invalid={!!errors.job}
              />
            </Field>

            <Field label="Régimen" required error={errors.regime ?? undefined}>
              <Input
                type="text"
                value={formData.regime}
                onChange={(e) => handleChange('regime', e.target.value)}
                placeholder="Ej: Locador, CAS 1057, 728"
                invalid={!!errors.regime}
              />
            </Field>

            <Field label="Turno" required>
              <Select value={formData.shift} onChange={(e) => handleChange('shift', e.target.value)}>
                <option value="Mañana">Mañana</option>
                <option value="Tarde">Tarde</option>
                <option value="Noche">Noche</option>
              </Select>
            </Field>

            <Field label="Subgerencia" required error={errors.subgerencia ?? undefined}>
              <Input
                type="text"
                value={formData.subgerencia}
                onChange={(e) => handleChange('subgerencia', e.target.value)}
                placeholder="Ej: Fiscalización y sanciones administrativas"
                invalid={!!errors.subgerencia}
              />
            </Field>
          </div>
        </section>
      </form>
    </Modal>
  )
}
