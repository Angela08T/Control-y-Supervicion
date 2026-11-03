import React, { useEffect, useState } from 'react'
import { FaBriefcase } from 'react-icons/fa'
import type { CreateJobDto, Job } from '@/types'
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
  modalLabel,
  modalTitle
} from '../utils/classes'

// Ajustes responsive (@media max-width: 900px) de .modal-card y .modal-body
const cardClass = cn(modalCard, 'max-[900px]:w-[95%] max-[900px]:max-h-[90vh] max-[900px]:overflow-y-auto max-[900px]:m-[10px_auto]')
const bodyClass = cn(modalBody, 'max-[900px]:max-h-[calc(90vh-120px)] max-[900px]:overflow-y-auto')

export interface ModalJobProps {
  initial?: Job | null
  onClose: () => void
  onSave: (data: CreateJobDto) => void | Promise<void>
}

interface JobForm {
  name: string
}

type JobFormErrors = Partial<Record<keyof JobForm, string>>

const defaultState: JobForm = {
  name: ''
}

export default function ModalJob({ initial, onClose, onSave }: ModalJobProps) {
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

  return (
    <div className={modalBackdrop}>
      <div className={cardClass}>
        <div className={modalHeader}>
          <h3 className={modalTitle}>{initial ? 'Editar Cargo' : 'Nuevo Cargo'}</h3>
          <button className={modalClose} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={bodyClass}>
          {/* Nombre del Cargo */}
          <div className={formGroup}>
            <label className={cn(modalLabel, formLabel)}>
              <FaBriefcase className="mr-2" />
              Nombre del Cargo *
            </label>
            <input
              type="text"
              placeholder="Ej: TENIENTE, CAPITÁN, SUBGERENTE"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={cn(modalInput, errors.name && 'input-error')}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Nota informativa */}
          <div className="mt-2.5 rounded-[6px] border border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.1)] p-3 text-[0.9rem] text-content-2">
            <strong>Nota:</strong> El cargo creado estará disponible para asignar al personal.
          </div>

          {/* Botones de acción */}
          <div className={modalActions}>
            <button type="button" className={btnSecondary} onClick={onClose}>
              CANCELAR
            </button>
            <button type="submit" className={btnPrimary}>
              {initial ? 'ACTUALIZAR CARGO' : 'CREAR CARGO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
