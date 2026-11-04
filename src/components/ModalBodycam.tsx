import React, { useEffect, useState } from 'react'
import type { BodycamView, CreateBodycamDto } from '@/types'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import { Field, Input } from '@/components/UI/Field'

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
    <Modal
      title={initial ? 'Editar dispositivo' : 'Agregar dispositivo'}
      description="Los campos marcados con * son obligatorios."
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-bodycam">
            {initial ? 'Guardar cambios' : 'Guardar dispositivo'}
          </Button>
        </>
      }
    >
      <form id="form-bodycam" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nombre del dispositivo" required error={errors.name}>
          <Input
            type="text"
            placeholder="Ej: FISCA091, SG999"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            invalid={!!errors.name}
          />
        </Field>

        <Field label="Número de serie" required error={errors.serie}>
          <Input
            type="text"
            placeholder="Ej: 22709A0381, 23726A9999"
            value={form.serie}
            onChange={(e) => handleChange('serie', e.target.value)}
            invalid={!!errors.serie}
          />
        </Field>
      </form>
    </Modal>
  )
}
