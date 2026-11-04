import React, { useEffect, useState } from 'react'
import type { CreateSubjectDto, Subject } from '@/types'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import { Field, Input } from '@/components/UI/Field'

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
    <Modal
      title={initial ? 'Editar asunto' : 'Nuevo asunto'}
      description="Los asuntos agrupan las faltas disciplinarias por tipo de conducta."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-subject">
            Guardar
          </Button>
        </>
      }
    >
      <form id="form-subject" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          label="Nombre del asunto"
          required
          error={errors.name}
          hint="Ejemplo: Conductas relacionadas con el cumplimiento de funciones. Las faltas se asocian después de crearlo."
        >
          <Input
            type="text"
            placeholder="Escribe el nombre del asunto"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            invalid={!!errors.name}
            autoFocus
          />
        </Field>
      </form>
    </Modal>
  )
}
