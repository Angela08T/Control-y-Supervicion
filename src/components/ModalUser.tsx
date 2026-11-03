import React, { useEffect, useState } from 'react'
import { FaUser, FaEnvelope, FaLock, FaUserTag, FaIdCard, FaSearch } from 'react-icons/fa'
import { useAppSelector } from '@/store/hooks'
import type { AppRole, OffenderDniLookup, Role, User } from '@/types'
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
  modalTitle
} from '@/utils/classes'

/** Estado del formulario de usuario */
interface UserFormState {
  dni: string
  name: string
  lastname: string
  username: string
  password: string
  email: string
  rol: Role
}

/** Errores por campo del formulario */
type UserFormErrors = Partial<Record<keyof UserFormState, string>>

/** Datos del usuario a editar (admite `role` además de `rol`) */
export type UserModalInitial = Partial<User> & { role?: Role }

/** Payload que se envía al guardar */
export interface UserSavePayload {
  name: string
  lastname: string
  username: string
  email: string
  rol: Role
  dni?: string
  password?: string
}

/** Respuesta de búsqueda por DNI (GET /offender/dni/:dni) */
interface OffenderLookupResponse {
  message?: string
  data?: OffenderDniLookup
}

export interface ModalUserProps {
  initial?: UserModalInitial | null
  onClose: () => void
  onSave: (data: UserSavePayload) => void
  userRole?: AppRole | null
}

/** Etiqueta de campo: formLabel + margen superior del label dentro del modal */
const labelClass = cn(formLabel, 'mt-1.5')

/** Texto de ayuda debajo de un campo */
const helpText = 'block mt-1 text-[0.85rem] text-muted'

const defaultState: UserFormState = {
  dni: '',
  name: '',
  lastname: '',
  username: '',
  password: '',
  email: '',
  rol: 'SENTINEL' // Por defecto SENTINEL
}

export default function ModalUser({ initial, onClose, onSave, userRole }: ModalUserProps) {
  const [form, setForm] = useState<UserFormState>(defaultState)
  const [errors, setErrors] = useState<UserFormErrors>({})
  const [searchingDni, setSearchingDni] = useState<boolean>(false)
  const [dniError, setDniError] = useState<string>('')

  // Obtener token de autenticación
  const { token } = useAppSelector((state) => state.auth)

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

      const result: OffenderLookupResponse = await response.json()
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
  function mapJobToRol(job: string | null | undefined): Role {
    if (!job) return 'SENTINEL'
    const jobUpper = job.toUpperCase()
    if (jobUpper.includes('ADMIN') || jobUpper.includes('COORDINADOR')) return 'ADMINISTRATOR'
    if (jobUpper.includes('SUPERVISOR')) return 'SUPERVISOR'
    if (jobUpper.includes('VALIDATOR') || jobUpper.includes('VALIDADOR')) return 'VALIDATOR'
    return 'SENTINEL'
  }

  function handleChange<K extends keyof UserFormState>(field: K, value: UserFormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  function validate() {
    const newErrors: UserFormErrors = {}

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const dataToSave: UserSavePayload = {
      name: form.name.trim(),
      lastname: form.lastname.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      rol: form.rol
    }

    // Solo incluir dni si tiene valor (el backend falla si se envía string vacío)
    if (form.dni.trim()) {
      dataToSave.dni = form.dni.trim()
    }

    // Solo incluir password si se está creando o si se modificó
    if (!initial || form.password) {
      dataToSave.password = form.password
    }

    onSave(dataToSave)
  }

  return (
    <div className={modalBackdrop}>
      <div className={cn(modalCard, 'max-[900px]:mx-auto max-[900px]:my-2.5 max-[900px]:max-h-[90vh] max-[900px]:w-[95%] max-[900px]:overflow-y-auto')}>
        <div className={modalHeader}>
          <h3 className={modalTitle}>{initial ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          <button className={modalClose} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={cn(modalBody, 'max-[900px]:max-h-[calc(90vh-120px)] max-[900px]:overflow-y-auto')}>
          {/* DNI con búsqueda */}
          {!initial && (
            <div className={formGroup}>
              <label className={labelClass}>
                <FaIdCard className="mr-2" />
                DNI
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ingrese DNI (8 dígitos)"
                  value={form.dni}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                    handleChange('dni', value)
                    setDniError('')
                  }}
                  className={cn(modalInput, 'flex-1')}
                  maxLength={8}
                />
                <button
                  type="button"
                  onClick={searchByDni}
                  disabled={searchingDni || form.dni.length !== 8}
                  className={cn(
                    btnPrimary,
                    'flex items-center justify-center gap-1.5 min-w-[100px] px-4! py-2!'
                  )}
                >
                  <FaSearch />
                  {searchingDni ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              {dniError && <span className="error-message">{dniError}</span>}
              <span className="block mt-1 text-[0.8rem] text-muted">
                Ingrese el DNI para autocompletar los datos del personal
              </span>
            </div>
          )}

          {/* Nombre */}
          <div className={formGroup}>
            <label className={labelClass}>
              <FaUser className="mr-2" />
              Nombre *
            </label>
            <input
              type="text"
              placeholder="Ej: Juan"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={cn(modalInput, errors.name && 'input-error')}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Apellido */}
          <div className={formGroup}>
            <label className={labelClass}>
              <FaUser className="mr-2" />
              Apellido *
            </label>
            <input
              type="text"
              placeholder="Ej: Perez"
              value={form.lastname}
              onChange={(e) => handleChange('lastname', e.target.value)}
              className={cn(modalInput, errors.lastname && 'input-error')}
            />
            {errors.lastname && <span className="error-message">{errors.lastname}</span>}
          </div>

          {/* Usuario */}
          <div className={formGroup}>
            <label className={labelClass}>
              <FaUserTag className="mr-2" />
              Usuario *
            </label>
            <input
              type="text"
              placeholder="Ej: juanperez"
              value={form.username}
              onChange={(e) => handleChange('username', e.target.value)}
              className={cn(modalInput, errors.username && 'input-error')}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          {/* Email */}
          <div className={formGroup}>
            <label className={labelClass}>
              <FaEnvelope className="mr-2" />
              Email *
            </label>
            <input
              type="email"
              placeholder="Ej: juan@example.com"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={cn(modalInput, errors.email && 'input-error')}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* Contraseña */}
          <div className={formGroup}>
            <label className={labelClass}>
              <FaLock className="mr-2" />
              Contraseña {!initial && '*'}
            </label>
            <input
              type="password"
              placeholder={initial ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres'}
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className={cn(modalInput, errors.password && 'input-error')}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* Rol */}
          <div className={formGroup}>
            <label className={labelClass}>
              <FaUserTag className="mr-2" />
              Rol *
            </label>
            <select
              value={form.rol}
              onChange={(e) => handleChange('rol', e.target.value as Role)}
              className={cn(modalInput, errors.rol && 'input-error')}
              disabled={!!initial && (initial.rol === 'ADMINISTRATOR' || initial.role === 'ADMINISTRATOR')}
            >
              <option value="SENTINEL">Sentinel</option>
              {canCreateSupervisor && <option value="SUPERVISOR">Supervisor</option>}
              {canCreateValidator && <option value="VALIDATOR">Validador</option>}
              {canCreateValidator && <option value="SUBGERENTE">Subgerente</option>}
              {canCreateValidator && <option value="ADMINISTRATOR">Admin</option>}
            </select>
            {errors.rol && <span className="error-message">{errors.rol}</span>}
            {initial && (initial.rol === 'ADMINISTRATOR' || initial.role === 'ADMINISTRATOR') && (
              <span className={helpText}>
                No se puede cambiar el rol de un administrador
              </span>
            )}
            {!canCreateSupervisor && !initial && (
              <span className={helpText}>
                Solo puedes crear Sentinels
              </span>
            )}
          </div>

          {/* Nota informativa */}
          <div className="mt-2.5 rounded-[6px] border border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.1)] p-3 text-[0.9rem] text-content-2">
            <strong>Nota:</strong> Los campos marcados con (*) son requeridos.
          </div>

          {/* Botones de acción */}
          <div className={modalActions}>
            <button type="button" className={btnSecondary} onClick={onClose}>
              CANCELAR
            </button>
            <button type="submit" className={btnPrimary}>
              {initial ? 'ACTUALIZAR USUARIO' : 'CREAR USUARIO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
