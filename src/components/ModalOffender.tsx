import React, { useState, useEffect } from 'react'
import type { Offender } from '@/types'
import {
  btnPrimary,
  btnSecondary,
  cn,
  formGroup,
  formLabel,
  modalActions,
  modalBackdrop,
  modalBody,
  modalCard,
  modalClose,
  modalHeader,
  modalInput,
  modalTitle
} from '@/utils/classes'

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

/** Etiqueta de campo: formLabel + margen superior del label dentro del modal */
const labelClass = cn(formLabel, 'mt-1.5')

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
    <div className={modalBackdrop}>
      <div className={cn(modalCard, 'max-[900px]:mx-auto max-[900px]:my-2.5 max-[900px]:max-h-[90vh] max-[900px]:w-[95%] max-[900px]:overflow-y-auto')}>
        <div className={modalHeader}>
          <h3 className={modalTitle}>{initial ? 'Editar Infractor' : 'Agregar Infractor'}</h3>
          <button className={modalClose} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={cn(modalBody, 'max-[900px]:max-h-[calc(90vh-120px)] max-[900px]:overflow-y-auto')}>
          <div className="grid grid-cols-[1fr_1fr] gap-4">
            {/* Nombre */}
            <div className={formGroup}>
              <label className={labelClass}>Nombre <span className="text-danger">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ingrese el nombre"
                className={cn(modalInput, errors.name && 'input-error')}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            {/* Apellido */}
            <div className={formGroup}>
              <label className={labelClass}>Apellido <span className="text-danger">*</span></label>
              <input
                type="text"
                value={formData.lastname}
                onChange={(e) => handleChange('lastname', e.target.value)}
                placeholder="Ingrese el apellido"
                className={cn(modalInput, errors.lastname && 'input-error')}
              />
              {errors.lastname && <span className="error-message">{errors.lastname}</span>}
            </div>

            {/* DNI */}
            <div className={formGroup}>
              <label className={labelClass}>DNI <span className="text-danger">*</span></label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => handleChange('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="8 dígitos"
                maxLength={8}
                className={cn(modalInput, errors.dni && 'input-error')}
              />
              {errors.dni && <span className="error-message">{errors.dni}</span>}
            </div>

            {/* Cargo */}
            <div className={formGroup}>
              <label className={labelClass}>Cargo <span className="text-danger">*</span></label>
              <input
                type="text"
                value={formData.job}
                onChange={(e) => handleChange('job', e.target.value)}
                placeholder="Ej: Inspector Comercial"
                className={cn(modalInput, errors.job && 'input-error')}
              />
              {errors.job && <span className="error-message">{errors.job}</span>}
            </div>

            {/* Régimen */}
            <div className={formGroup}>
              <label className={labelClass}>Régimen <span className="text-danger">*</span></label>
              <input
                type="text"
                value={formData.regime}
                onChange={(e) => handleChange('regime', e.target.value)}
                placeholder="Ej: Locador, Cas 1057, 728"
                className={cn(modalInput, errors.regime && 'input-error')}
              />
              {errors.regime && <span className="error-message">{errors.regime}</span>}
            </div>

            {/* Turno */}
            <div className={formGroup}>
              <label className={labelClass}>Turno <span className="text-danger">*</span></label>
              <select
                value={formData.shift}
                onChange={(e) => handleChange('shift', e.target.value)}
                className={modalInput}
              >
                <option value="Mañana">Mañana</option>
                <option value="Tarde">Tarde</option>
                <option value="Noche">Noche</option>
              </select>
            </div>

            {/* Subgerencia - ocupa todo el ancho */}
            <div className={cn(formGroup, 'col-span-full')}>
              <label className={labelClass}>Subgerencia <span className="text-danger">*</span></label>
              <input
                type="text"
                value={formData.subgerencia}
                onChange={(e) => handleChange('subgerencia', e.target.value)}
                placeholder="Ej: Fiscalización y Sanciones administrativas"
                className={cn(modalInput, errors.subgerencia && 'input-error')}
              />
              {errors.subgerencia && <span className="error-message">{errors.subgerencia}</span>}
            </div>
          </div>

          <div className={modalActions}>
            <button type="button" className={btnSecondary} onClick={onClose}>
              CANCELAR
            </button>
            <button type="submit" className={btnPrimary}>
              {initial ? 'ACTUALIZAR INFRACTOR' : 'GUARDAR INFRACTOR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
