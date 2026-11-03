import React, { useEffect, useState } from 'react'
import { FaClipboardList, FaFolder, FaFileAlt, FaBook, FaInfoCircle } from 'react-icons/fa'
import { getSubjects } from '../api/subject'
import { toast } from '../utils/toast'
import type { CreateLackDto, Lack, Subject } from '@/types'
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
  modalTextarea,
  modalTitle
} from '../utils/classes'

// Ajustes responsive (@media max-width: 900px) de .modal-card y .modal-body
const cardClass = cn(modalCard, 'max-[900px]:w-[95%] max-[900px]:max-h-[90vh] max-[900px]:overflow-y-auto max-[900px]:m-[10px_auto]')
const bodyClass = cn(modalBody, 'max-[900px]:max-h-[calc(90vh-120px)] max-[900px]:overflow-y-auto')

// Textareas con estilos propios (antes inline): padding 10px, radio 4px, fondo var(--bg)
const textareaBase =
  'w-full rounded-[4px] border p-2.5 [background:var(--bg)] text-content! outline-none transition-all duration-300 [backdrop-filter:blur(5px)] placeholder:text-muted! focus:-translate-y-0.5 focus:border-primary focus:shadow-[0_0_0_4px_rgba(30,58,138,0.15)] dark:text-[#f8fafc]! dark:placeholder:text-[#94a3b8]!'

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
    <div className={modalBackdrop}>
      <div className={cn(cardClass, 'max-w-[800px]')}>
        <div className={modalHeader}>
          <h3 className={modalTitle}>{initial ? 'Editar Falta' : 'Nueva Falta'}</h3>
          <button className={modalClose} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={bodyClass}>
          {/* Nombre de la Falta */}
          <div className={formGroup}>
            <label className={cn(modalLabel, formLabel)}>
              <FaClipboardList className="mr-2" />
              Nombre de la Falta *
            </label>
            <input
              type="text"
              placeholder="Ej: Tardanza Reiterada"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={cn(modalInput, errors.name && 'input-error')}
              autoFocus
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Asunto */}
          <div className={formGroup}>
            <label className={cn(modalLabel, formLabel)}>
              <FaFolder className="mr-2" />
              Asunto *
            </label>
            {loadingSubjects ? (
              <div className="p-2.5 text-center text-muted border border-line rounded-[4px]">
                Cargando asuntos...
              </div>
            ) : (
              <select
                value={form.subject_id}
                onChange={(e) => handleChange('subject_id', e.target.value)}
                className={cn(modalInput, errors.subject_id && 'input-error')}
              >
                <option value="">Seleccione un asunto</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            )}
            {errors.subject_id && <span className="error-message">{errors.subject_id}</span>}
          </div>

          {/* Artículo (Opcional) */}
          <div className={formGroup}>
            <label className={cn(modalLabel, formLabel)}>
              <FaBook className="mr-2" />
              Artículo (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: 68.12"
              value={form.article}
              onChange={(e) => handleChange('article', e.target.value)}
              className={modalInput}
            />
            <span className="block mt-1 text-[0.85rem] text-muted">
              Número de artículo o normativa aplicable
            </span>
          </div>

          {/* Descripción (Opcional) */}
          <div className={formGroup}>
            <label className={cn(modalLabel, formLabel)}>
              <FaInfoCircle className="mr-2" />
              Descripción (Opcional)
            </label>
            <textarea
              placeholder="Descripción breve de la falta y su sanción aplicable..."
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={cn(modalTextarea, textareaBase, 'border-line text-[0.95rem] [font-family:inherit]')}
            />
          </div>

          {/* Contenido del Informe */}
          <div className={formGroup}>
            <label className={cn(modalLabel, formLabel)}>
              <FaFileAlt className="mr-2" />
              Contenido del Informe *
            </label>
            <textarea
              placeholder="Contenido completo del informe con placeholders como {{offender.name}}, {{bodycam.name}}, etc..."
              value={form.content}
              onChange={(e) => handleChange('content', e.target.value)}
              className={cn(
                modalTextarea,
                textareaBase,
                errors.content ? 'border-danger' : 'border-line',
                'text-[0.9rem] leading-[1.6] [font-family:monospace]',
                errors.content && 'input-error'
              )}
              rows={12}
            />
            {errors.content && <span className="error-message">{errors.content}</span>}

            {/* Ayuda sobre placeholders */}
            <div className="mt-2 rounded-[6px] border border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.05)] p-2.5 text-[0.85rem] text-content-2">
              <strong>Placeholders disponibles:</strong>
              <div className="mt-1.5 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-1">
                <span>• {`{{offender.name}}`}</span>
                <span>• {`{{offender.lastname}}`}</span>
                <span>• {`{{offender.regime}}`}</span>
                <span>• {`{{offender.job}}`}</span>
                <span>• {`{{offender.shift}}`}</span>
                <span>• {`{{bodycam.name}}`}</span>
                <span>• {`{{lack.name}}`}</span>
                <span>• {`{{address}}`}</span>
                <span>• {`{{dates}}`}</span>
                <span>• {`{{time}}`}</span>
              </div>
            </div>
          </div>

          {/* Nota informativa */}
          <div className="mt-2.5 rounded-[6px] border border-[rgba(234,179,8,0.3)] bg-[rgba(234,179,8,0.1)] p-3 text-[0.9rem] text-content-2">
            <strong>Nota:</strong> Los campos marcados con (*) son requeridos. El contenido del informe debe incluir placeholders que serán reemplazados automáticamente al generar el documento.
          </div>

          {/* Botones de acción */}
          <div className={modalActions}>
            <button type="button" className={btnSecondary} onClick={onClose}>
              CANCELAR
            </button>
            <button type="submit" className={btnPrimary}>
              {initial ? 'ACTUALIZAR FALTA' : 'CREAR FALTA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
