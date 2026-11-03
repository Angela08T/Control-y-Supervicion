import React, { useEffect, useState } from 'react'
import { FaVideo, FaBarcode } from 'react-icons/fa'
import type { BodycamView, CreateBodycamDto } from '@/types'
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

  return (
    <div className={modalBackdrop}>
      <div className={cardClass}>
        <div className={modalHeader}>
          <h3 className={modalTitle}>{initial ? 'Editar Bodycam' : 'Nueva Bodycam'}</h3>
          <button className={modalClose} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={bodyClass}>
          {/* Nombre de la Bodycam */}
          <div className={formGroup}>
            <label className={cn(modalLabel, formLabel)}>
              <FaVideo className="mr-2" />
              Nombre de la Bodycam *
            </label>
            <input
              type="text"
              placeholder="Ej: FISCA091, SG999"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={cn(modalInput, errors.name && 'input-error')}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Serie de la Bodycam */}
          <div className={formGroup}>
            <label className={cn(modalLabel, formLabel)}>
              <FaBarcode className="mr-2" />
              Número de Serie *
            </label>
            <input
              type="text"
              placeholder="Ej: 22709A0381, 23726A9999"
              value={form.serie}
              onChange={(e) => handleChange('serie', e.target.value)}
              className={cn(modalInput, errors.serie && 'input-error')}
            />
            {errors.serie && <span className="error-message">{errors.serie}</span>}
          </div>

          {/* Nota informativa */}
          <div className="mt-2.5 rounded-[6px] border border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.1)] p-3 text-[0.9rem] text-content-2">
            <strong>Nota:</strong> Todos los campos marcados con (*) son requeridos.
          </div>

          {/* Botones de acción */}
          <div className={modalActions}>
            <button type="button" className={btnSecondary} onClick={onClose}>
              CANCELAR
            </button>
            <button type="submit" className={btnPrimary}>
              {initial ? 'ACTUALIZAR BODYCAM' : 'CREAR BODYCAM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
