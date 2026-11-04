import React, { useEffect, useState } from 'react'
import { getJobs } from '../api/job'
import { toast } from '../utils/toast'
import type { CreateLeadDto, Job, Lead } from '@/types'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import { Field, Input, Select } from '@/components/UI/Field'

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

  return (
    <Modal
      title={initial ? 'Editar personal' : 'Nuevo personal'}
      description="Los campos marcados con * son obligatorios."
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-lead">
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id="form-lead" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nombre" required error={errors.name}>
          <Input
            type="text"
            placeholder="Ej: Diego"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            invalid={!!errors.name}
            autoFocus
          />
        </Field>

        <Field label="Apellido" required error={errors.lastname}>
          <Input
            type="text"
            placeholder="Ej: Matute Espino"
            value={form.lastname}
            onChange={(e) => handleChange('lastname', e.target.value)}
            invalid={!!errors.lastname}
          />
        </Field>

        <Field
          label="Cargo"
          required
          error={errors.job_id}
          hint={!loadingJobs && jobs.length === 0 ? 'No hay cargos disponibles. Crea un cargo primero.' : undefined}
        >
          <Select
            value={form.job_id}
            onChange={(e) => handleChange('job_id', e.target.value)}
            invalid={!!errors.job_id}
            disabled={loadingJobs}
          >
            <option value="">{loadingJobs ? 'Cargando cargos…' : 'Selecciona un cargo'}</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.name}</option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  )
}
