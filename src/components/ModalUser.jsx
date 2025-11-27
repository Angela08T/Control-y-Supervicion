import React, { useEffect, useState } from 'react'
import { FaUser, FaEnvelope, FaLock, FaUserTag, FaIdCard, FaSearch } from 'react-icons/fa'
import { useSelector } from 'react-redux'

const defaultState = {
  dni: '',
  name: '',
  lastname: '',
  username: '',
  password: '',
  email: '',
  rol: 'SENTINEL' // Por defecto SENTINEL
}

export default function ModalUser({ initial, onClose, onSave, userRole }) {
  const [form, setForm] = useState(defaultState)
  const [errors, setErrors] = useState({})
  const [searchingDni, setSearchingDni] = useState(false)
  const [dniError, setDniError] = useState('')

  // Obtener token de autenticación
  const { token } = useSelector((state) => state.auth)

  // userRole: el rol del usuario actual (admin o supervisor)
  const canCreateSupervisor = userRole === 'admin'
  const canCreateValidator = userRole === 'admin' // Solo admin puede crear VALIDATOR

  useEffect(() => {
    if (initial) {
      setForm({
        dni: initial.dni || '',
        name: initial.name || '',
        lastname: initial.lastname || '',
        username: initial.username || '',
        password: '', // No mostrar password existente
        email: initial.email || '',
        rol: initial.rol || initial.role || 'SENTINEL'
      })
    }
  }, [initial])

  // Función para buscar por DNI
  async function searchByDni() {
    if (!form.dni || form.dni.length !== 8) {
      setDniError('El DNI debe tener 8 dígitos')
      return
    }

    setSearchingDni(true)
    setDniError('')

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/offender/dni/${form.dni}`
      console.log('Buscando en:', apiUrl)

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      console.log('Response status:', response.status)

      const result = await response.json()
      console.log('Resultado:', result)

      if (response.ok && result.data) {
        const data = result.data
        // Generar username a partir del nombre
        const firstName = data.name ? data.name.split(' ')[0].toLowerCase() : ''
        const firstLastname = data.lastname ? data.lastname.split(' ')[0].toLowerCase() : ''
        const username = `${firstName}${firstLastname}`

        setForm(prev => ({
          ...prev,
          name: data.name || '',
          lastname: data.lastname || '',
          username: username,
          email: data.email || '',
          rol: mapJobToRol(data.job) || 'SENTINEL'
        }))
      } else {
        setDniError(result.message || 'No se encontró ningún registro con ese DNI')
      }
    } catch (error) {
      setDniError('Error al conectar con el servidor')
      console.error('Error buscando DNI:', error)
    } finally {
      setSearchingDni(false)
    }
  }

  // Mapear job a rol del sistema
  function mapJobToRol(job) {
    if (!job) return 'SENTINEL'
    const jobUpper = job.toUpperCase()
    if (jobUpper.includes('ADMIN') || jobUpper.includes('COORDINADOR')) return 'ADMINISTRATOR'
    if (jobUpper.includes('SUPERVISOR')) return 'SUPERVISOR'
    if (jobUpper.includes('VALIDATOR') || jobUpper.includes('VALIDADOR')) return 'VALIDATOR'
    return 'SENTINEL'
  }

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

    if (!form.username.trim()) {
      newErrors.username = 'El usuario es requerido'
    }

    if (!initial && !form.password.trim()) {
      newErrors.password = 'La contraseña es requerida'
    }

    if (form.password && form.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    }

    if (!form.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!form.rol) {
      newErrors.rol = 'El rol es requerido'
    }

    // Si no es admin y está intentando crear admin
    if (userRole !== 'admin' && form.rol === 'ADMINISTRATOR') {
      newErrors.rol = 'No tienes permisos para crear administradores'
    }

    // Si no es admin y está intentando crear supervisor
    if (!canCreateSupervisor && form.rol === 'SUPERVISOR') {
      newErrors.rol = 'No tienes permisos para crear supervisores'
    }

    // Si no es admin y está intentando crear validator
    if (!canCreateValidator && form.rol === 'VALIDATOR') {
      newErrors.rol = 'No tienes permisos para crear validadores'
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
      dni: form.dni.trim(),
      name: form.name.trim(),
      lastname: form.lastname.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      rol: form.rol
    }

    // Solo incluir password si se está creando o si se modificó
    if (!initial || form.password) {
      dataToSave.password = form.password
    }

    onSave(dataToSave)
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{initial ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          <button className="close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* DNI con búsqueda */}
          {!initial && (
            <div className="form-group">
              <label>
                <FaIdCard style={{ marginRight: '8px' }} />
                DNI
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Ingrese DNI (8 dígitos)"
                  value={form.dni}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                    handleChange('dni', value)
                    setDniError('')
                  }}
                  style={{ flex: 1 }}
                  maxLength={8}
                />
                <button
                  type="button"
                  onClick={searchByDni}
                  disabled={searchingDni || form.dni.length !== 8}
                  className="btn-primary"
                  style={{
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: '100px',
                    justifyContent: 'center'
                  }}
                >
                  <FaSearch />
                  {searchingDni ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              {dniError && <span className="error-message">{dniError}</span>}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Ingrese el DNI para autocompletar los datos del personal
              </span>
            </div>
          )}

          {/* Nombre */}
          <div className="form-group">
            <label>
              <FaUser style={{ marginRight: '8px' }} />
              Nombre *
            </label>
            <input
              type="text"
              placeholder="Ej: Juan"
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
              placeholder="Ej: Perez"
              value={form.lastname}
              onChange={(e) => handleChange('lastname', e.target.value)}
              className={errors.lastname ? 'input-error' : ''}
            />
            {errors.lastname && <span className="error-message">{errors.lastname}</span>}
          </div>

          {/* Usuario */}
          <div className="form-group">
            <label>
              <FaUserTag style={{ marginRight: '8px' }} />
              Usuario *
            </label>
            <input
              type="text"
              placeholder="Ej: juanperez"
              value={form.username}
              onChange={(e) => handleChange('username', e.target.value)}
              className={errors.username ? 'input-error' : ''}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label>
              <FaEnvelope style={{ marginRight: '8px' }} />
              Email *
            </label>
            <input
              type="email"
              placeholder="Ej: juan@example.com"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <label>
              <FaLock style={{ marginRight: '8px' }} />
              Contraseña {!initial && '*'}
            </label>
            <input
              type="password"
              placeholder={initial ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres'}
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* Rol */}
          <div className="form-group">
            <label>
              <FaUserTag style={{ marginRight: '8px' }} />
              Rol *
            </label>
            <select
              value={form.rol}
              onChange={(e) => handleChange('rol', e.target.value)}
              className={errors.rol ? 'input-error' : ''}
              disabled={initial && (initial.rol === 'ADMINISTRATOR' || initial.role === 'ADMINISTRATOR')}
            >
              <option value="SENTINEL">Sentinel</option>
              {canCreateSupervisor && <option value="SUPERVISOR">Supervisor</option>}
              {canCreateValidator && <option value="VALIDATOR">Validador</option>}
              {canCreateValidator && <option value="ADMINISTRATOR">Admin</option>}
            </select>
            {errors.rol && <span className="error-message">{errors.rol}</span>}
            {initial && (initial.rol === 'ADMINISTRATOR' || initial.role === 'ADMINISTRATOR') && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                No se puede cambiar el rol de un administrador
              </span>
            )}
            {!canCreateSupervisor && !initial && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Solo puedes crear Sentinels
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
            <strong>Nota:</strong> Los campos marcados con (*) son requeridos.
          </div>

          {/* Botones de acción */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              CANCELAR
            </button>
            <button type="submit" className="btn-primary">
              {initial ? 'ACTUALIZAR USUARIO' : 'CREAR USUARIO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
