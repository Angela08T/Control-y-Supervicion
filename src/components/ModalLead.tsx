import React, { useEffect, useState } from 'react'
import { FaUser, FaBriefcase } from 'react-icons/fa'
import { getJobs } from '../api/job'
import { toast } from '../utils/toast'
import type { CreateLeadDto, Job, Lead } from '@/types'
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
    <div className={modalBackdrop}>
      <div className={cardClass}>
        <div className={modalHeader}>
          <h3 className={modalTitle}>{initial ? 'Editar Personal' : 'Nuevo Personal'}</h3>
          <button className={modalClose} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={bodyClass}>
          {/* Nombre */}
          <div className={formGroup}>
            <label className={cn(modalLabel, formLabel)}>
              <FaUser className="mr-2" />
              Nombre *
            </label>
            <input
              type="text"
              placeholder="Ej: Diego Matut"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={cn(modalInput, errors.name && 'input-error')}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Apellido */}
          <div className={formGroup}>
            <label className={cn(modalLabel, formLabel)}>
              <FaUser className="mr-2" />
              Apellido *
            </label>
            <input
              type="text"
              placeholder="Ej: Matute Espino"
              value={form.lastname}
              onChange={(e) => handleChange('lastname', e.target.value)}
              className={cn(modalInput, errors.lastname && 'input-error')}
            />
            {errors.lastname && <span className="error-message">{errors.lastname}</span>}
          </div>

          {/* Cargo */}
          <div className={formGroup}>
            <label className={cn(modalLabel, formLabel)}>
              <FaBriefcase className="mr-2" />
              Cargo *
            </label>
            {loadingJobs ? (
              <div className="p-3 text-center text-muted">
                Cargando cargos disponibles...
              </div>
            ) : (
              <select
                value={form.job_id}
                onChange={(e) => handleChange('job_id', e.target.value)}
                className={cn(modalInput, errors.job_id && 'input-error')}
              >
                <option value="">Selecciona un cargo</option>
                {Array.isArray(jobs) && jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.name}</option>
                ))}
              </select>
            )}
            {errors.job_id && <span className="error-message">{errors.job_id}</span>}
            {jobs.length === 0 && !loadingJobs && (
              <span className="block mt-1 text-[0.85rem] text-muted">
                No hay cargos disponibles. Por favor, crea un cargo primero.
              </span>
            )}
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
              {initial ? 'ACTUALIZAR PERSONAL' : 'CREAR PERSONAL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
