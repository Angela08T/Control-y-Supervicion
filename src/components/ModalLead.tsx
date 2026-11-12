import React, { useEffect, useState } from 'react'
import { getJobs } from '../api/job'
import { toast } from '../utils/toast'
import type { CreateLeadDto, Job, Lead } from '@/types'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import { Field, Input } from '@/components/UI/Field'
import Dropdown from '@/components/UI/Dropdown'
import { ModalHero } from '@/components/UI/FormSteps'
import { colorAvatar, iniciales } from '@/utils/incidenciaFormat'
import { cn } from '@/utils/classes'
import { FiBriefcase, FiCheckCircle, FiEdit3, FiPlus, FiSave, FiUser, FiUserPlus } from 'react-icons/fi'

export interface ModalLeadProps {
  initial?: Lead | null
  onClose: () => void
  onSave: (data: CreateLeadDto) => void | Promise<void>
}

type LeadFormErrors = Partial<Record<keyof CreateLeadDto, string>>

const defaultState: CreateLeadDto = {
  name: '',
  lastname: '',
  job_id: ''
}

export default function ModalLead({ initial, onClose, onSave }: ModalLeadProps) {
  const [form, setForm] = useState<CreateLeadDto>(defaultState)
  const [errors, setErrors] = useState<LeadFormErrors>({})
  const [jobs, setJobs] = useState<Job[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)

  // Cargar cargos disponibles
  useEffect(() => {
    async function fetchJobs() {
      setLoadingJobs(true)
      try {
        const response = await getJobs(1, 1000) // Obtener todos los cargos

        // Extraer los datos correctamente según la estructura de la API
        const jobsData: Job[] = response.data?.data || (response.data as unknown as Job[]) || []

        // Filtrar solo los cargos habilitados (sin deleted_at)
        const activeJobs = jobsData.filter(job => !job.deleted_at)

        setJobs(activeJobs)
      } catch (error) {
        toast.info('No se pudieron cargar los cargos. Por favor, intenta de nuevo.')
      } finally {
        setLoadingJobs(false)
      }
    }

    fetchJobs()
  }, [])

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        lastname: initial.lastname || '',
        job_id: initial.job_id || initial.job?.id || ''
      })
    }
  }, [initial])

  function handleChange(field: keyof CreateLeadDto, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  function validate() {
    const newErrors: LeadFormErrors = {}

    if (!form.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!form.lastname.trim()) {
      newErrors.lastname = 'El apellido es requerido'
    }

    if (!form.job_id) {
      newErrors.job_id = 'El cargo es requerido'
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
      lastname: form.lastname.trim(),
      job_id: form.job_id // Mantener como UUID string
    }

    onSave(dataToSave)
  }

  // Vista previa: como se vera la persona en el directorio
  const nombreCompleto = `${form.name} ${form.lastname}`.trim()
  const cargo = jobs.find(j => j.id === form.job_id)?.name
  const listo = !!form.name.trim() && !!form.lastname.trim() && !!form.job_id

  return (
    <Modal
      title={initial ? 'Editar personal' : 'Nuevo personal'}
      header={
        <ModalHero
          icon={initial ? <FiEdit3 /> : <FiUserPlus />}
          eyebrow={initial ? 'Editar registro' : 'Nuevo registro'}
          title={initial ? 'Editar personal' : 'Nuevo personal'}
          subtitle="Los campos marcados con * son obligatorios."
          onClose={onClose}
        />
      }
      onClose={onClose}
      size="md"
      bodyClassName="bg-page"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-lead" icon={initial ? <FiSave /> : <FiPlus />}>
            {initial ? 'Guardar cambios' : 'Agregar personal'}
          </Button>
        </>
      }
    >
      <form id="form-lead" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Vista previa de la tarjeta del directorio */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_var(--shadow)]">
          <span aria-hidden className="absolute inset-x-0 top-0 h-1 transition-colors" style={{ background: nombreCompleto ? colorAvatar(nombreCompleto) : 'var(--border)' }} />
          <p className="m-0 mb-3 text-[11px] font-bold tracking-[0.12em] text-muted uppercase">Vista previa</p>
          <div className="flex items-center gap-3.5">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white shadow-sm transition-colors"
              style={{ background: nombreCompleto ? colorAvatar(nombreCompleto) : 'var(--border-strong)' }}
              aria-hidden
            >
              {nombreCompleto ? iniciales(nombreCompleto) : <FiUser />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('m-0 truncate text-base font-bold', nombreCompleto ? 'text-content' : 'text-muted')}>
                {nombreCompleto || 'Nombre y apellido'}
              </p>
              <span
                className={cn(
                  'mt-1 inline-flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold',
                  cargo ? 'bg-primary/8 text-primary dark:bg-primary/20 dark:text-accent-light' : 'bg-subtle text-muted'
                )}
              >
                <FiBriefcase className="shrink-0" aria-hidden />
                <span className="truncate">{cargo || 'Cargo por elegir'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_var(--shadow)] max-sm:p-4">
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <Field label="Nombre" required error={errors.name}>
              <Input
                type="text"
                placeholder="Ej.: Diego"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                invalid={!!errors.name}
                autoFocus
              />
            </Field>

            <Field label="Apellido" required error={errors.lastname}>
              <Input
                type="text"
                placeholder="Ej.: Matute Espino"
                value={form.lastname}
                onChange={(e) => handleChange('lastname', e.target.value)}
                invalid={!!errors.lastname}
              />
            </Field>
          </div>

          <Field
            label="Cargo"
            required
            error={errors.job_id}
            hint={!loadingJobs && jobs.length === 0 ? 'No hay cargos disponibles. Crea un cargo primero.' : undefined}
          >
            <Dropdown
              aria-label="Cargo"
              value={String(form.job_id || '')}
              onChange={(v) => handleChange('job_id', v)}
              loading={loadingJobs}
              invalid={!!errors.job_id}
              placeholder="Selecciona un cargo"
              emptyText="No hay cargos disponibles"
              icon={<FiBriefcase />}
              options={jobs.map(job => ({ value: String(job.id), label: job.name }))}
            />
          </Field>

          {listo && (
            <p className="m-0 flex items-center gap-2 text-xs font-medium text-lime-ink">
              <FiCheckCircle aria-hidden />
              Todo listo para guardar.
            </p>
          )}
        </div>
      </form>
    </Modal>
  )
}
