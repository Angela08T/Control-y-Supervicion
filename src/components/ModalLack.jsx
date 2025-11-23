import React, { useEffect, useState } from 'react'
import { FaClipboardList, FaFolder, FaFileAlt, FaBook, FaInfoCircle } from 'react-icons/fa'
import { getSubjects } from '../api/subject'

const defaultState = {
  name: '',
  content: '',
  article: '',
  description: '',
  subject_id: ''
}

export default function ModalLack({ initial, onClose, onSave }) {
  const [form, setForm] = useState(defaultState)
  const [errors, setErrors] = useState({})
  const [subjects, setSubjects] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)

  // Cargar asuntos al montar el componente
  useEffect(() => {
    async function fetchSubjects() {
      try {
        setLoadingSubjects(true)
        const response = await getSubjects(1, 1000) // Obtener todos los asuntos
        const subjectsData = response.data?.data || response.data || []
        setSubjects(subjectsData)
      } catch (error) {
        alert('Error al cargar la lista de asuntos')
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

  function handleSubmit(e) {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const dataToSave = {
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
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h3>{initial ? 'Editar Falta' : 'Nueva Falta'}</h3>
          <button className="close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Nombre de la Falta */}
          <div className="form-group">
            <label>
              <FaClipboardList style={{ marginRight: '8px' }} />
              Nombre de la Falta *
            </label>
            <input
              type="text"
              placeholder="Ej: Tardanza Reiterada"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={errors.name ? 'input-error' : ''}
              autoFocus
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Asunto */}
          <div className="form-group">
            <label>
              <FaFolder style={{ marginRight: '8px' }} />
              Asunto *
            </label>
            {loadingSubjects ? (
              <div style={{
                padding: '10px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: '4px'
              }}>
                Cargando asuntos...
              </div>
            ) : (
              <select
                value={form.subject_id}
                onChange={(e) => handleChange('subject_id', e.target.value)}
                className={errors.subject_id ? 'input-error' : ''}
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
          <div className="form-group">
            <label>
              <FaBook style={{ marginRight: '8px' }} />
              Artículo (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: 68.12"
              value={form.article}
              onChange={(e) => handleChange('article', e.target.value)}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Número de artículo o normativa aplicable
            </span>
          </div>

          {/* Descripción (Opcional) */}
          <div className="form-group">
            <label>
              <FaInfoCircle style={{ marginRight: '8px' }} />
              Descripción (Opcional)
            </label>
            <textarea
              placeholder="Descripción breve de la falta y su sanción aplicable..."
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Contenido del Informe */}
          <div className="form-group">
            <label>
              <FaFileAlt style={{ marginRight: '8px' }} />
              Contenido del Informe *
            </label>
            <textarea
              placeholder="Contenido completo del informe con placeholders como {{offender.name}}, {{bodycam.name}}, etc..."
              value={form.content}
              onChange={(e) => handleChange('content', e.target.value)}
              className={errors.content ? 'input-error' : ''}
              rows={12}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: errors.content ? '1px solid #ef4444' : '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                resize: 'vertical',
                lineHeight: '1.6'
              }}
            />
            {errors.content && <span className="error-message">{errors.content}</span>}

            {/* Ayuda sobre placeholders */}
            <div style={{
              marginTop: '8px',
              padding: '10px',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}>
              <strong>Placeholders disponibles:</strong>
              <div style={{ marginTop: '6px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4px' }}>
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
          <div style={{
            padding: '12px',
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            marginTop: '10px'
          }}>
            <strong>Nota:</strong> Los campos marcados con (*) son requeridos. El contenido del informe debe incluir placeholders que serán reemplazados automáticamente al generar el documento.
          </div>

          {/* Botones de acción */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              CANCELAR
            </button>
            <button type="submit" className="btn-primary">
              {initial ? 'ACTUALIZAR FALTA' : 'CREAR FALTA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
