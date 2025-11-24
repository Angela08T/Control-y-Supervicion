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
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--card-bg)',
        borderRadius: '12px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'modalSlideIn 0.3s ease-out'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 25px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--primary)',
          color: 'white',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '600' }}>
            {initial ? 'Editar Infractor' : 'Agregar Infractor'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '5px 10px',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
              lineHeight: 1
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '25px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Nombre */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: 'var(--text)',
                fontSize: '0.95rem'
              }}>
                Nombre <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ingrese el nombre"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: errors.name ? '2px solid #ef4444' : '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  if (!errors.name) e.target.style.borderColor = 'var(--primary)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.name ? '#ef4444' : 'var(--border)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              {errors.name && (
                <span style={{
                  display: 'block',
                  marginTop: '5px',
                  fontSize: '0.85rem',
                  color: '#ef4444'
                }}>
                  {errors.name}
                </span>
              )}
            </div>

            {/* Apellido */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: 'var(--text)',
                fontSize: '0.95rem'
              }}>
                Apellido <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.lastname}
                onChange={(e) => handleChange('lastname', e.target.value)}
                placeholder="Ingrese el apellido"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: errors.lastname ? '2px solid #ef4444' : '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  if (!errors.lastname) e.target.style.borderColor = 'var(--primary)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.lastname ? '#ef4444' : 'var(--border)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              {errors.lastname && (
                <span style={{
                  display: 'block',
                  marginTop: '5px',
                  fontSize: '0.85rem',
                  color: '#ef4444'
                }}>
                  {errors.lastname}
                </span>
              )}
            </div>

            {/* DNI */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: 'var(--text)',
                fontSize: '0.95rem'
              }}>
                DNI <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => handleChange('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="8 dígitos"
                maxLength={8}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: errors.dni ? '2px solid #ef4444' : '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  if (!errors.dni) e.target.style.borderColor = 'var(--primary)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.dni ? '#ef4444' : 'var(--border)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              {errors.dni && (
                <span style={{
                  display: 'block',
                  marginTop: '5px',
                  fontSize: '0.85rem',
                  color: '#ef4444'
                }}>
                  {errors.dni}
                </span>
              )}
            </div>

            {/* Cargo */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: 'var(--text)',
                fontSize: '0.95rem'
              }}>
                Cargo <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.job}
                onChange={(e) => handleChange('job', e.target.value)}
                placeholder="Ej: Inspector Comercial"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: errors.job ? '2px solid #ef4444' : '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  if (!errors.job) e.target.style.borderColor = 'var(--primary)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.job ? '#ef4444' : 'var(--border)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              {errors.job && (
                <span style={{
                  display: 'block',
                  marginTop: '5px',
                  fontSize: '0.85rem',
                  color: '#ef4444'
                }}>
                  {errors.job}
                </span>
              )}
            </div>

            {/* Régimen */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: 'var(--text)',
                fontSize: '0.95rem'
              }}>
                Régimen <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.regime}
                onChange={(e) => handleChange('regime', e.target.value)}
                placeholder="Ej: Locador, Cas 1057, 728"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: errors.regime ? '2px solid #ef4444' : '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  if (!errors.regime) e.target.style.borderColor = 'var(--primary)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.regime ? '#ef4444' : 'var(--border)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              {errors.regime && (
                <span style={{
                  display: 'block',
                  marginTop: '5px',
                  fontSize: '0.85rem',
                  color: '#ef4444'
                }}>
                  {errors.regime}
                </span>
              )}
            </div>

            {/* Turno */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: 'var(--text)',
                fontSize: '0.95rem'
              }}>
                Turno <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.shift}
                onChange={(e) => handleChange('shift', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                <option value="Mañana">Mañana</option>
                <option value="Tarde">Tarde</option>
                <option value="Noche">Noche</option>
              </select>
            </div>

            {/* Subgerencia - ocupa todo el ancho */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: 'var(--text)',
                fontSize: '0.95rem'
              }}>
                Subgerencia <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.subgerencia}
                onChange={(e) => handleChange('subgerencia', e.target.value)}
                placeholder="Ej: Fiscalización y Sanciones administrativas"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: errors.subgerencia ? '2px solid #ef4444' : '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  if (!errors.subgerencia) e.target.style.borderColor = 'var(--primary)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.subgerencia ? '#ef4444' : 'var(--border)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              {errors.subgerencia && (
                <span style={{
                  display: 'block',
                  marginTop: '5px',
                  fontSize: '0.85rem',
                  color: '#ef4444'
                }}>
                  {errors.subgerencia}
                </span>
              )}
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '25px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border)'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 24px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = 'var(--bg-secondary)'
                e.target.style.borderColor = 'var(--text-muted)'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'var(--bg)'
                e.target.style.borderColor = 'var(--border)'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                backgroundColor: 'var(--primary)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = 'var(--primary-dark)'
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'var(--primary)'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}
            >
              {initial ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
