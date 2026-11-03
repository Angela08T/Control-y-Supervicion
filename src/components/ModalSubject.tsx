import React, { useEffect, useState } from 'react'
import { FaClipboardList } from 'react-icons/fa'
import type { CreateSubjectDto, Subject } from '@/types'
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

  return (
    <div className={modalBackdrop}>
      <div className={cardClass}>
        <div className={modalHeader}>
          <h3 className={modalTitle}>{initial ? 'Editar Asunto' : 'Nuevo Asunto'}</h3>
          <button className={modalClose} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={bodyClass}>
          {/* Nombre del Asunto */}
          <div className={formGroup}>
            <label className={cn(modalLabel, formLabel)}>
              <FaClipboardList className="mr-2" />
              Nombre del Asunto *
            </label>
            <input
              type="text"
              placeholder="Ej: Conductas relacionadas con el Cumplimiento de Funciones"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={cn(modalInput, errors.name && 'input-error')}
              autoFocus
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Nota informativa */}
          <div className="mt-2.5 rounded-[6px] border border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.1)] p-3 text-[0.9rem] text-content-2">
            <strong>Nota:</strong> Los asuntos sirven para categorizar las diferentes tipos de faltas disciplinarias.
            Las faltas específicas se asocian a cada asunto después de crearlo.
          </div>

          {/* Botones de acción */}
          <div className={modalActions}>
            <button type="button" className={btnSecondary} onClick={onClose}>
              CANCELAR
            </button>
            <button type="submit" className={btnPrimary}>
              {initial ? 'ACTUALIZAR ASUNTO' : 'CREAR ASUNTO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
