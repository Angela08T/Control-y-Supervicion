import React, { useEffect, useRef, useState } from 'react'
import { getSubjects } from '../api/subject'
import { toast } from '../utils/toast'
import type { CreateLackDto, Lack, Subject } from '@/types'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import { Field, Input, Textarea } from '@/components/UI/Field'
import Dropdown from '@/components/UI/Dropdown'
import { ModalHero } from '@/components/UI/FormSteps'
import { colorAsunto } from './SubjectTable'
import { nombreCorto } from '@/pages/Dashboard/asuntos'
import { MARCADORES, Paper, TemplateText } from './lackTemplate'
import { cn } from '@/utils/classes'
import { FiAlertCircle, FiCheckCircle, FiEdit3, FiFilePlus, FiFolder, FiPlus, FiSave } from 'react-icons/fi'

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
  const contenidoRef = useRef<HTMLTextAreaElement | null>(null)

  /** Inserta un marcador donde esta el cursor en la plantilla (o al final) */
  function insertarMarcador(token: string) {
    const el = contenidoRef.current
    const inicio = el?.selectionStart ?? form.content.length
    const fin = el?.selectionEnd ?? form.content.length
    const nuevo = form.content.slice(0, inicio) + token + form.content.slice(fin)
    handleChange('content', nuevo)
    // Devuelve el foco y deja el cursor despues del marcador
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      el.setSelectionRange(inicio + token.length, inicio + token.length)
    })
  }

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

  const asuntoElegido = subjects.find(sb => String(sb.id) === String(form.subject_id))
  const usados = MARCADORES.filter(m => form.content.includes(m.token)).length
  const desconocidos = (form.content.match(/\{\{[^}]+\}\}/g) ?? []).filter(t => !MARCADORES.some(m => m.token === t))
  const listo = form.name.trim().length >= 3 && form.content.trim().length >= 10 && !!form.subject_id

  return (
    <Modal
      title={initial ? 'Editar falta' : 'Nueva falta'}
      header={
        <ModalHero
          icon={initial ? <FiEdit3 /> : <FiFilePlus />}
          eyebrow={initial ? 'Editar falta' : 'Nueva falta'}
          title={form.name.trim() || (initial ? 'Editar falta' : 'Nueva falta')}
          subtitle="Los campos marcados con * son obligatorios. La vista previa muestra el informe con datos de ejemplo."
          onClose={onClose}
        />
      }
      onClose={onClose}
      size="xl"
      bodyClassName="bg-page"
      footer={
        <>
          <p className="m-0 mr-auto flex items-center gap-2 text-xs text-muted max-sm:hidden">
            {listo ? (
              <>
                <FiCheckCircle className="shrink-0 text-success" aria-hidden />
                Todo listo para guardar.
              </>
            ) : (
              'Completa nombre, asunto y la plantilla del informe.'
            )}
          </p>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-lack" icon={initial ? <FiSave /> : <FiPlus />}>
            {initial ? 'Guardar cambios' : 'Agregar falta'}
          </Button>
        </>
      }
    >
      <form id="form-lack" onSubmit={handleSubmit} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 max-lg:grid-cols-1">
        {/* Formulario */}
        <div className="flex min-w-0 flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_var(--shadow)] max-sm:p-4">
            <h4 className="m-0 text-sm font-semibold text-content">Datos generales</h4>
            <Field label="Nombre de la falta" required error={errors.name}>
              <Input
                type="text"
                placeholder="Ej.: Tardanza reiterada"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                invalid={!!errors.name}
                autoFocus
              />
            </Field>

            <div className="grid grid-cols-[minmax(0,1fr)_130px] gap-4 max-sm:grid-cols-1">
              <Field label="Asunto" required error={errors.subject_id}>
                <Dropdown
                  aria-label="Asunto"
                  value={String(form.subject_id || '')}
                  onChange={(v) => handleChange('subject_id', v)}
                  loading={loadingSubjects}
                  invalid={!!errors.subject_id}
                  placeholder="Selecciona un asunto"
                  icon={<FiFolder />}
                  searchable
                  options={subjects.map(sb => ({
                    value: String(sb.id),
                    label: nombreCorto(sb.name),
                    description: nombreCorto(sb.name) !== sb.name ? sb.name : undefined,
                    color: colorAsunto(sb.name),
                  }))}
                />
              </Field>
              <Field label="Artículo" hint="Opcional">
                <Input
                  type="text"
                  placeholder="Ej.: 68.12"
                  value={form.article}
                  onChange={(e) => handleChange('article', e.target.value)}
                  className="tabular-nums"
                />
              </Field>
            </div>

            <Field label="Descripción" hint="Opcional: breve explicación de la falta y su sanción.">
              <Textarea
                placeholder="Descripción breve de la falta y su sanción aplicable"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
              />
            </Field>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_var(--shadow)] max-sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="m-0 text-sm font-semibold text-content">Plantilla del informe <span className="text-danger">*</span></h4>
              <span className="text-xs text-muted tabular-nums">{usados} de {MARCADORES.length} datos usados</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">Toca un dato para insertarlo donde está el cursor:</span>
              <div className="flex flex-wrap gap-1.5">
                {MARCADORES.map(m => {
                  const usado = form.content.includes(m.token)
                  return (
                    <button
                      key={m.token}
                      type="button"
                      title={`Insertar ${m.token}`}
                      onClick={() => insertarMarcador(m.token)}
                      className={cn(
                        'inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition-colors',
                        usado
                          ? 'border-primary/30 bg-primary/10 text-primary dark:bg-primary/25 dark:text-accent-light'
                          : 'border-line bg-subtle text-content-2 hover:border-line-strong hover:text-content'
                      )}
                    >
                      {usado ? <FiCheckCircle aria-hidden /> : <FiPlus aria-hidden />}
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <Field label="Texto del informe" error={errors.content}>
              <Textarea
                ref={contenidoRef}
                placeholder="Escribe el texto completo del informe e inserta los datos con los botones de arriba."
                value={form.content}
                onChange={(e) => handleChange('content', e.target.value)}
                invalid={!!errors.content}
                rows={10}
                className="font-mono text-[13px] leading-relaxed"
              />
            </Field>
            {desconocidos.length > 0 && (
              <p className="m-0 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/6 px-3 py-2 text-xs text-red-ink" role="status">
                <FiAlertCircle className="mt-px shrink-0" aria-hidden />
                Estos marcadores no existen y no se reemplazarán: {[...new Set(desconocidos)].join(', ')}
              </p>
            )}
          </section>
        </div>

        {/* Vista previa del informe, en papel */}
        <aside className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-0 lg:self-start">
          <p className="m-0 flex items-center justify-between text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
            Vista previa del informe
            <span className="inline-flex items-center gap-1.5 font-semibold tracking-normal normal-case">
              <span className="inline-block h-3 w-5 rounded-[3px] bg-brand-amber/30" aria-hidden /> dato de ejemplo
            </span>
          </p>
          <Paper className="min-h-[320px]">
            <p className="m-0 mb-1 text-center text-[11px] font-bold tracking-[0.16em] text-[#475569] uppercase [font-family:system-ui]">
              Informe · {asuntoElegido ? nombreCorto(asuntoElegido.name) : 'Asunto'}
            </p>
            <p className="m-0 mb-4 text-center text-[15px] font-bold">
              {form.name.trim() || 'Nombre de la falta'}
              {form.article.trim() && <span className="font-normal text-[#475569]"> · Art. {form.article.trim()}</span>}
            </p>
            {form.content.trim() ? (
              <TemplateText texto={form.content} modo="ejemplo" ejemplos={{ '{{lack.name}}': form.name.trim().toUpperCase() || undefined }} />
            ) : (
              <span className="text-[#6b7280] italic">El texto del informe aparecerá aquí mientras lo escribes.</span>
            )}
          </Paper>
        </aside>
      </form>
    </Modal>
  )
}
