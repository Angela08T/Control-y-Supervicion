import React, { useEffect, useState } from 'react'
import { FaUser, FaBriefcase } from 'react-icons/fa'
import useFetchData from '@/Components/hooks/useFetchData'

const defaultState = {
  name: '',
  lastname: '',
  job_id: ''
}

export default function ModalLead({ initial, onClose, onSave }) {
  const { fetchCargos } = useFetchData()
  const [form, setForm] = useState(defaultState)
  const [errors, setErrors] = useState({})
  const [jobs, setJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(false)

  // Cargar cargos disponibles
  useEffect(() => {
    async function loadJobs() {
      setLoadingJobs(true)
      try {
        console.log('🔄 Cargando cargos disponibles...')
        const response = await fetchCargos(true) // useCache = true
        console.log('📦 Respuesta completa de cargos:', response)

        if (response.status) {
          console.log('✅ Cargos extraídos:', response.data)
          setJobs(response.data || [])
        } else {
          console.error('❌ Error al cargar cargos:', response.message)
          alert('No se pudieron cargar los cargos. Por favor, intenta de nuevo.')
        }
      } catch (error) {
        console.error('❌ Error al cargar cargos:', error)
        alert('No se pudieron cargar los cargos. Por favor, intenta de nuevo.')
      } finally {
        setLoadingJobs(false)
      }
    }

    loadJobs()
  }, [fetchCargos])

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        lastname: initial.lastname || '',
        job_id: initial.job_id || initial.job?.id || ''
      })
    }
  }, [initial])

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  function validate() {
    const newErrors = {}

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

  function handleSubmit(e) {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const dataToSave = {
      name: form.name.trim(),
      lastname: form.lastname.trim(),
      job_id: parseInt(form.job_id, 10) // Convertir a número
    }

    console.log('📋 Datos preparados para enviar:', dataToSave)
    console.log('📋 Tipo de job_id:', typeof dataToSave.job_id)

    onSave(dataToSave)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initial ? 'Editar Personal' : 'Nuevo Personal'}</h3>
          <button className="close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Nombre */}
          <div className="form-group">
            <label>
              <FaUser style={{ marginRight: '8px' }} />
              Nombre *
            </label>
            <input
              type="text"
              placeholder="Ej: Diego Matut"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Apellido */}
          <div className="form-group">
            <label>
              <FaUser style={{ marginRight: '8px' }} />
              Apellido *
            </label>
            <input
              type="text"
              placeholder="Ej: Matute Espino"
              value={form.lastname}
              onChange={(e) => handleChange('lastname', e.target.value)}
              className={errors.lastname ? 'input-error' : ''}
            />
            {errors.lastname && <span className="error-message">{errors.lastname}</span>}
          </div>

          {/* Cargo */}
          <div className="form-group">
            <label>
              <FaBriefcase style={{ marginRight: '8px' }} />
              Cargo *
            </label>
            {loadingJobs ? (
              <div style={{ padding: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                Cargando cargos disponibles...
              </div>
            ) : (
              <select
                value={form.job_id}
                onChange={(e) => handleChange('job_id', e.target.value)}
                className={errors.job_id ? 'input-error' : ''}
              >
                <option value="">Selecciona un cargo</option>
                {Array.isArray(jobs) && jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.name}</option>
                ))}
              </select>
            )}
            {errors.job_id && <span className="error-message">{errors.job_id}</span>}
            {jobs.length === 0 && !loadingJobs && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                No hay cargos disponibles. Por favor, crea un cargo primero.
              </span>
            )}
          </div>

          {/* Nota informativa */}
          <div style={{
            padding: '12px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            marginTop: '10px'
          }}>
            <strong>Nota:</strong> Todos los campos marcados con (*) son requeridos.
          </div>

          {/* Botones de acción */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              CANCELAR
            </button>
            <button type="submit" className="btn-primary">
              {initial ? 'ACTUALIZAR PERSONAL' : 'CREAR PERSONAL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
