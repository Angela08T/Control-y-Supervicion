import React, { useState, useEffect } from 'react'
import { FaTimes } from 'react-icons/fa'

export default function ModalOffender({ initial, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    dni: '',
    job: '',
    regime: '',
    shift: 'Mañana',
    subgerencia: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initial) {
      setFormData({
        name: initial.name || '',
        lastname: initial.lastname || '',
        dni: initial.dni || '',
        job: initial.job || '',
        regime: initial.regime || '',
        shift: initial.shift || 'Mañana',
        subgerencia: initial.subgerencia || ''
      })
    }
  }, [initial])

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  function validateForm() {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.lastname.trim()) {
      newErrors.lastname = 'El apellido es requerido'
    }

    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es requerido'
    } else if (!/^\d{8}$/.test(formData.dni)) {
      newErrors.dni = 'El DNI debe tener exactamente 8 dígitos'
    }

    if (!formData.job.trim()) {
      newErrors.job = 'El cargo es requerido'
    }

    if (!formData.regime.trim()) {
      newErrors.regime = 'El régimen es requerido'
    }

    if (!formData.subgerencia.trim()) {
      newErrors.subgerencia = 'La subgerencia es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    onSave(formData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{initial ? 'Editar Infractor' : 'Agregar Infractor'}</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {/* Nombre */}
            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ingrese el nombre"
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            {/* Apellido */}
            <div className="form-group">
              <label>Apellido *</label>
              <input
                type="text"
                value={formData.lastname}
                onChange={(e) => handleChange('lastname', e.target.value)}
                placeholder="Ingrese el apellido"
                className={errors.lastname ? 'input-error' : ''}
              />
              {errors.lastname && <span className="error-message">{errors.lastname}</span>}
            </div>

            {/* DNI */}
            <div className="form-group">
              <label>DNI *</label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => handleChange('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="8 dígitos"
                maxLength={8}
                className={errors.dni ? 'input-error' : ''}
              />
              {errors.dni && <span className="error-message">{errors.dni}</span>}
            </div>

            {/* Cargo */}
            <div className="form-group">
              <label>Cargo *</label>
              <input
                type="text"
                value={formData.job}
                onChange={(e) => handleChange('job', e.target.value)}
                placeholder="Ej: Inspector Comercial"
                className={errors.job ? 'input-error' : ''}
              />
              {errors.job && <span className="error-message">{errors.job}</span>}
            </div>

            {/* Régimen */}
            <div className="form-group">
              <label>Régimen *</label>
              <input
                type="text"
                value={formData.regime}
                onChange={(e) => handleChange('regime', e.target.value)}
                placeholder="Ej: Locador, Cas 1057, 728"
                className={errors.regime ? 'input-error' : ''}
              />
              {errors.regime && <span className="error-message">{errors.regime}</span>}
            </div>

            {/* Turno */}
            <div className="form-group">
              <label>Turno *</label>
              <select
                value={formData.shift}
                onChange={(e) => handleChange('shift', e.target.value)}
              >
                <option value="Mañana">Mañana</option>
                <option value="Tarde">Tarde</option>
                <option value="Noche">Noche</option>
              </select>
            </div>

            {/* Subgerencia - ocupa todo el ancho */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Subgerencia *</label>
              <input
                type="text"
                value={formData.subgerencia}
                onChange={(e) => handleChange('subgerencia', e.target.value)}
                placeholder="Ej: Fiscalización y Sanciones administrativas"
                className={errors.subgerencia ? 'input-error' : ''}
              />
              {errors.subgerencia && <span className="error-message">{errors.subgerencia}</span>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {initial ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
