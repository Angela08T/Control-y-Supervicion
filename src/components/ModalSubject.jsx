import React, { useEffect, useState } from 'react'
import { FaClipboardList } from 'react-icons/fa'

const defaultState = {
  name: ''
}

export default function ModalSubject({ initial, onClose, onSave }) {
  const [form, setForm] = useState(defaultState)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || ''
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
      newErrors.name = 'El nombre del asunto es requerido'
    }

    if (form.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres'
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
      name: form.name.trim()
    }

    onSave(dataToSave)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initial ? 'Editar Asunto' : 'Nuevo Asunto'}</h3>
          <button className="close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Nombre del Asunto */}
          <div className="form-group">
            <label>
              <FaClipboardList style={{ marginRight: '8px' }} />
              Nombre del Asunto *
            </label>
            <input
              type="text"
              placeholder="Ej: Conductas relacionadas con el Cumplimiento de Funciones"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={errors.name ? 'input-error' : ''}
              autoFocus
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
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
            <strong>Nota:</strong> Los asuntos sirven para categorizar las diferentes tipos de faltas disciplinarias.
            Las faltas específicas se asocian a cada asunto después de crearlo.
          </div>

          {/* Botones de acción */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              CANCELAR
            </button>
            <button type="submit" className="btn-primary">
              {initial ? 'ACTUALIZAR ASUNTO' : 'CREAR ASUNTO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
