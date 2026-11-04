import React, { useEffect, useState } from 'react'
import type { CreateJobDto, Job } from '@/types'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import { Field, Input } from '@/components/UI/Field'

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
    <Modal
      title={initial ? 'Editar cargo' : 'Nuevo cargo'}
      description="El cargo estará disponible para asignar al personal."
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-job">
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id="form-job" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nombre del cargo" required error={errors.name}>
          <Input
            type="text"
            placeholder="Ej: Teniente, capitán, subgerente"
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
