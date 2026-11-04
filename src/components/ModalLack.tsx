import React, { useEffect, useState } from 'react'
import { getSubjects } from '../api/subject'
import { toast } from '../utils/toast'
import type { CreateLackDto, Lack, Subject } from '@/types'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import { Field, Input, Select, Textarea } from '@/components/UI/Field'

/** Marcadores que se reemplazan al generar el documento */
const PLACEHOLDERS = [
  '{{offender.name}}',
  '{{offender.lastname}}',
  '{{offender.regime}}',
  '{{offender.job}}',
  '{{offender.shift}}',
  '{{bodycam.name}}',
  '{{lack.name}}',
  '{{address}}',
  '{{dates}}',
  '{{time}}'
]

export interface ModalLackProps {
  initial?: Lack | null
  onClose: () => void
  onSave: (data: CreateLackDto) => void | Promise<void>
}

interface LackForm {
  name: string
  content: string
  article: string
  description: string
  subject_id: string
}

type LackFormErrors = Partial<Record<keyof LackForm, string>>

const defaultState: LackForm = {
  name: '',
  content: '',
  article: '',
  description: '',
  subject_id: ''
}

export default function ModalLack({ initial, onClose, onSave }: ModalLackProps) {
  const [form, setForm] = useState<LackForm>(defaultState)
  const [errors, setErrors] = useState<LackFormErrors>({})
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)

  // Cargar asuntos al montar el componente
  useEffect(() => {
    async function fetchSubjects() {
      try {
        setLoadingSubjects(true)
        const response = await getSubjects(1, 1000) // Obtener todos los asuntos
        const subjectsData: Subject[] = response.data?.data || (response.data as unknown as Subject[]) || []
        // Filtrar solo asuntos activos (deleted_at es null)
        const activeSubjects = subjectsData.filter(subject => !subject.deleted_at)
        setSubjects(activeSubjects)
      } catch (error) {
        toast.error('Error al cargar la lista de asuntos')
      } finally {
        setLoadingSubjects(false)
      }
    }

    fetchSubjects()
  }, [])

  // Cargar datos iniciales si está editando
  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        content: initial.content || '',
        article: initial.article || '',
        description: initial.description || '',
        subject_id: initial.subject?.id || ''
      })
    }
  }, [initial])

  function handleChange(field: keyof LackForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  function validate() {
    const newErrors: LackFormErrors = {}

    if (!form.name.trim()) {
      newErrors.name = 'El nombre de la falta es requerido'
    }

    if (form.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres'
    }

    if (!form.content.trim()) {
      newErrors.content = 'El contenido es requerido'
    }

    if (form.content.trim().length < 10) {
      newErrors.content = 'El contenido debe tener al menos 10 caracteres'
    }

    if (!form.subject_id) {
      newErrors.subject_id = 'Debe seleccionar un asunto'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const dataToSave: CreateLackDto = {
      name: form.name.trim(),
      content: form.content.trim(),
      subject_id: form.subject_id
    }

    // Agregar campos opcionales solo si tienen valor
    if (form.article.trim()) {
      dataToSave.article = form.article.trim()
    }

    if (form.description.trim()) {
      dataToSave.description = form.description.trim()
    }

    onSave(dataToSave)
  }

  return (
    <Modal
      title={initial ? 'Editar falta' : 'Nueva falta'}
      description="Los campos marcados con * son obligatorios."
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-lack">
            Guardar
          </Button>
        </>
      }
    >
      <form id="form-lack" onSubmit={handleSubmit} className="flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          <h4 className="m-0 text-[13px] font-semibold text-content">Datos generales</h4>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Field label="Nombre de la falta" required error={errors.name}>
              <Input
                type="text"
                placeholder="Ejemplo: Tardanza reiterada"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                invalid={!!errors.name}
                autoFocus
              />
            </Field>

            <Field label="Asunto" required error={errors.subject_id}>
              <Select
                value={form.subject_id}
                onChange={(e) => handleChange('subject_id', e.target.value)}
                invalid={!!errors.subject_id}
                disabled={loadingSubjects}
              >
                <option value="">{loadingSubjects ? 'Cargando asuntos…' : 'Seleccione un asunto'}</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Artículo (opcional)" hint="Número de artículo o normativa aplicable.">
              <Input
                type="text"
                placeholder="Ejemplo: 68.12"
                value={form.article}
                onChange={(e) => handleChange('article', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Descripción (opcional)">
            <Textarea
              placeholder="Descripción breve de la falta y su sanción aplicable"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-4 border-t border-line pt-4">
          <h4 className="m-0 text-[13px] font-semibold text-content">Contenido</h4>
          <Field label="Contenido del informe" required error={errors.content}>
            <Textarea
              placeholder="Escribe el texto completo del informe, con los marcadores donde van los datos."
              value={form.content}
              onChange={(e) => handleChange('content', e.target.value)}
              invalid={!!errors.content}
              rows={12}
              className="font-mono text-[13px] leading-relaxed"
            />
          </Field>
          <p className="m-0 text-xs text-muted">
            Marcadores disponibles: {PLACEHOLDERS.join(', ')}. Se reemplazan automáticamente al generar el documento.
          </p>
        </section>
      </form>
    </Modal>
  )
}
