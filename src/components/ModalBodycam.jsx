import React, { useEffect, useState } from 'react'
import { FaVideo, FaBarcode } from 'react-icons/fa'

const defaultState = {
  name: '',
  serie: ''
}

export default function ModalBodycam({ initial, onClose, onSave }) {
  const [form, setForm] = useState(defaultState)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        serie: initial.serie || ''
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

    if (!form.serie.trim()) {
      newErrors.serie = 'La serie es requerida'
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
      serie: form.serie.trim()
    }

    onSave(dataToSave)
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{initial ? 'Editar Bodycam' : 'Nueva Bodycam'}</h3>
          <button className="close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Nombre de la Bodycam */}
          <div className="form-group">
            <label>
              <FaVideo style={{ marginRight: '8px' }} />
              Nombre de la Bodycam *
            </label>
            <input
              type="text"
              placeholder="Ej: FISCA091, SG999"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Serie de la Bodycam */}
          <div className="form-group">
            <label>
              <FaBarcode style={{ marginRight: '8px' }} />
              Número de Serie *
            </label>
            <input
              type="text"
              placeholder="Ej: 22709A0381, 23726A9999"
              value={form.serie}
              onChange={(e) => handleChange('serie', e.target.value)}
              className={errors.serie ? 'input-error' : ''}
            />
            {errors.serie && <span className="error-message">{errors.serie}</span>}
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
              {initial ? 'ACTUALIZAR BODYCAM' : 'CREAR BODYCAM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
