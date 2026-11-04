import React, { useEffect, useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import { Field, Input, Select } from '@/components/UI/Field'
import { useAppSelector } from '@/store/hooks'
import type { AppRole, OffenderDniLookup, Role, User } from '@/types'

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

const defaultState: UserFormState = {
  dni: '',
  name: '',
  lastname: '',
  username: '',
  password: '',
  email: '',
  rol: 'SENTINEL' // Por defecto SENTINEL
}

const FORM_ID = 'form-usuario'

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

  // Un administrador no puede cambiar su rol desde este formulario
  const lockedRole = !!initial && (initial.rol === 'ADMINISTRATOR' || initial.role === 'ADMINISTRATOR')

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

  // Ayuda bajo el campo Rol (se excluyen entre sí)
  const roleHint = lockedRole
    ? 'No se puede cambiar el rol de un administrador'
    : !canCreateSupervisor && !initial
      ? 'Solo puedes crear centinelas'
      : undefined

  return (
    <Modal
      title={initial ? 'Editar usuario' : 'Nuevo usuario'}
      description="Los campos marcados con * son obligatorios."
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID}>
            {initial ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <section className="flex flex-col gap-4">
          <h4 className="m-0 text-[13px] font-semibold text-content">Datos personales</h4>

          {/* DNI con búsqueda (solo al crear) */}
          {!initial && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="usuario-dni" className="text-[13px] font-medium text-content-2">
                DNI
              </label>
              <div className="flex gap-2">
                <Input
                  id="usuario-dni"
                  placeholder="8 dígitos"
                  value={form.dni}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                    handleChange('dni', value)
                    setDniError('')
                  }}
                  maxLength={8}
                  inputMode="numeric"
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  icon={<FiSearch />}
                  onClick={searchByDni}
                  disabled={form.dni.length !== 8}
                  loading={searchingDni}
                >
                  {searchingDni ? 'Buscando…' : 'Buscar'}
                </Button>
              </div>
              <span className={dniError ? 'text-xs text-danger' : 'text-xs text-muted'}>
                {dniError || 'Ingresa el DNI para completar los datos del personal'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Field label="Nombre" required error={errors.name}>
              <Input
                placeholder="Ej: Juan"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                invalid={!!errors.name}
              />
            </Field>

            <Field label="Apellido" required error={errors.lastname}>
              <Input
                placeholder="Ej: Pérez"
                value={form.lastname}
                onChange={(e) => handleChange('lastname', e.target.value)}
                invalid={!!errors.lastname}
              />
            </Field>
          </div>

          <Field label="Email" required error={errors.email}>
            <Input
              type="email"
              placeholder="Ej: juan@correo.com"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              invalid={!!errors.email}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-4 border-t border-line pt-4">
          <h4 className="m-0 text-[13px] font-semibold text-content">Acceso</h4>

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Field label="Usuario" required error={errors.username}>
              <Input
                placeholder="Ej: juanperez"
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                invalid={!!errors.username}
              />
            </Field>

            <Field label="Rol" required error={errors.rol} hint={roleHint}>
              <Select
                value={form.rol}
                onChange={(e) => handleChange('rol', e.target.value as Role)}
                invalid={!!errors.rol}
                disabled={lockedRole}
              >
                <option value="SENTINEL">Centinela</option>
                {canCreateSupervisor && <option value="SUPERVISOR">Supervisor</option>}
                {canCreateValidator && <option value="VALIDATOR">Validador</option>}
                {canCreateValidator && <option value="SUBGERENTE">Subgerente</option>}
                {canCreateValidator && <option value="ADMINISTRATOR">Administrador</option>}
              </Select>
            </Field>
          </div>

          <Field
            label="Contraseña"
            required={!initial}
            error={errors.password}
            hint={initial ? 'Déjala vacía para no cambiarla' : 'Mínimo 8 caracteres'}
          >
            <Input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              invalid={!!errors.password}
            />
          </Field>
        </section>
      </form>
    </Modal>
  )
}
