import React, { useEffect, useState } from 'react'
import { FiAtSign, FiCheck, FiEdit3, FiEye, FiEyeOff, FiKey, FiLock, FiSave, FiSearch, FiUser, FiUserPlus } from 'react-icons/fi'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import { Field, Input } from '@/components/UI/Field'
import { ModalHero, StepSection } from '@/components/UI/FormSteps'
import { estiloRol } from '@/components/UserTable'
import { colorAvatar, iniciales } from '@/utils/incidenciaFormat'
import { cn } from '@/utils/classes'

/** Que puede hacer cada rol del sistema (ayuda al elegirlo) */
const ROL_AYUDA: Record<string, string> = {
  ADMINISTRATOR: 'Acceso total: usuarios, roles y configuración.',
  SUPERVISOR: 'Revisa y registra incidencias de su equipo.',
  VALIDATOR: 'Aprueba o rechaza los informes enviados.',
  SENTINEL: 'Registra incidencias e inasistencias en campo.',
}

/** Seguridad de la contrasena (0 a 4) segun largo y variedad de caracteres */
function fuerza(clave: string): number {
  if (!clave) return 0
  let p = 0
  if (clave.length >= 8) p++
  if (clave.length >= 12) p++
  if (/[a-z]/.test(clave) && /[A-Z]/.test(clave)) p++
  if (/\d/.test(clave) && /[^A-Za-z0-9]/.test(clave)) p++
  return Math.min(4, p)
}
const FUERZA = [
  { label: 'Muy débil', color: 'var(--viz-rejected)' },
  { label: 'Débil', color: 'var(--viz-rejected)' },
  { label: 'Aceptable', color: 'var(--viz-pending)' },
  { label: 'Buena', color: 'var(--viz-approved)' },
  { label: 'Muy segura', color: 'var(--viz-approved)' },
]
import { useAppSelector } from '@/store/hooks'
import type { AppRole, OffenderDniLookup, Role, RoleOption, User } from '@/types'

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
  /** Roles que se pueden asignar (los que el usuario actual puede elegir) */
  roles?: RoleOption[]
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

export default function ModalUser({ initial, onClose, onSave, userRole, roles = [] }: ModalUserProps) {
  const [form, setForm] = useState<UserFormState>(defaultState)
  const [errors, setErrors] = useState<UserFormErrors>({})
  const [searchingDni, setSearchingDni] = useState<boolean>(false)
  const [dniError, setDniError] = useState<string>('')
  const [verClave, setVerClave] = useState(false)

  // Obtener token de autenticación
  const { token } = useAppSelector((state) => state.auth)

  // Solo el administrador asigna roles distintos de Centinela
  const isAdmin = userRole === 'admin'

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

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const result: OffenderLookupResponse = await response.json()

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
    } catch {
      setDniError('Error al conectar con el servidor')
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

    // Si no es admin, solo puede asignar el rol Centinela
    if (!isAdmin && form.rol !== 'SENTINEL') {
      newErrors.rol = 'Solo puedes crear centinelas'
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
    : !isAdmin && !initial
      ? 'Solo puedes crear centinelas'
      : undefined

  const nombre = `${form.name} ${form.lastname}`.trim()
  const nivel = fuerza(form.password)
  const rolActual = roles.find(r => r.key === form.rol)
  const estilo = estiloRol(form.rol)

  return (
    <Modal
      title={initial ? 'Editar usuario' : 'Nuevo usuario'}
      header={
        <ModalHero
          icon={initial ? <FiEdit3 /> : <FiUserPlus />}
          eyebrow={initial ? 'Editar acceso' : 'Nuevo acceso'}
          title={nombre || (initial ? 'Editar usuario' : 'Nuevo usuario')}
          subtitle={form.username ? `@${form.username}` : 'Los campos marcados con * son obligatorios.'}
          onClose={onClose}
        />
      }
      onClose={onClose}
      size="lg"
      bodyClassName="bg-page"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} icon={initial ? <FiSave /> : <FiUserPlus />}>
            {initial ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Vista previa: como aparecera en la lista */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_var(--shadow)]">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white shadow-sm"
            style={{ background: nombre ? colorAvatar(nombre) : 'var(--border-strong)' }}
            aria-hidden
          >
            {nombre ? iniciales(nombre) : <FiUser />}
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn('m-0 truncate text-base font-bold', nombre ? 'text-content' : 'text-muted')}>{nombre || 'Nombre y apellido'}</p>
            <p className="m-0 truncate text-xs text-muted">
              <span className="font-mono">@{form.username || 'usuario'}</span>
              {form.email && <> · {form.email}</>}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-white" style={{ background: estilo.color }}>
            <span aria-hidden>{estilo.icon}</span>
            {rolActual?.name ?? form.rol}
          </span>
        </div>

        <StepSection id="usr-datos" n={1} title="Datos personales" icon={<FiUser />} done={!!form.name.trim() && !!form.lastname.trim() && !!form.email.trim()}>
          {/* DNI con busqueda (solo al crear) */}
          {!initial && (
            <div className="flex flex-col gap-1.5 rounded-xl bg-subtle p-3">
              <label htmlFor="usuario-dni" className="text-[13px] font-medium text-content-2">
                Completar con el DNI <span className="font-normal text-muted">(opcional)</span>
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
                  className="flex-1 font-mono tracking-[0.06em]"
                />
                <Button variant="secondary" icon={<FiSearch />} onClick={searchByDni} disabled={form.dni.length !== 8} loading={searchingDni}>
                  {searchingDni ? 'Buscando…' : 'Buscar'}
                </Button>
              </div>
              <span className={dniError ? 'text-xs text-danger' : 'text-xs text-muted'}>
                {dniError || 'Trae el nombre, el correo y sugiere el usuario y el rol.'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Field label="Nombre" required error={errors.name}>
              <Input placeholder="Ej.: Juan" value={form.name} onChange={(e) => handleChange('name', e.target.value)} invalid={!!errors.name} />
            </Field>
            <Field label="Apellido" required error={errors.lastname}>
              <Input placeholder="Ej.: Pérez" value={form.lastname} onChange={(e) => handleChange('lastname', e.target.value)} invalid={!!errors.lastname} />
            </Field>
          </div>

          <Field label="Correo" required error={errors.email}>
            <Input type="email" placeholder="Ej.: juan@correo.com" value={form.email} onChange={(e) => handleChange('email', e.target.value)} invalid={!!errors.email} />
          </Field>
        </StepSection>

        <StepSection id="usr-acceso" n={2} title="Acceso" icon={<FiKey />} done={!!form.username.trim() && (!!initial || nivel >= 1)}>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Field label="Usuario" required error={errors.username}>
              <div className="relative">
                <FiAtSign className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
                <Input
                  placeholder="juanperez"
                  value={form.username}
                  onChange={(e) => handleChange('username', e.target.value.replace(/\s+/g, '').toLowerCase())}
                  invalid={!!errors.username}
                  autoComplete="off"
                  className="pl-9 font-mono"
                />
              </div>
            </Field>

            <Field
              label="Contraseña"
              required={!initial}
              error={errors.password}
              hint={errors.password ? undefined : initial ? 'Déjala vacía para no cambiarla.' : 'Mínimo 8 caracteres.'}
            >
              <div className="relative">
                <FiLock className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
                <Input
                  type={verClave ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  invalid={!!errors.password}
                  className="pr-10 pl-9"
                />
                <button
                  type="button"
                  onClick={() => setVerClave(v => !v)}
                  aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-muted hover:bg-subtle hover:text-content"
                >
                  {verClave ? <FiEyeOff aria-hidden /> : <FiEye aria-hidden />}
                </button>
              </div>
            </Field>
          </div>

          {/* Medidor de seguridad de la contrasena */}
          {form.password && (
            <div className="flex items-center gap-3" aria-live="polite">
              <div className="flex flex-1 gap-1" aria-hidden>
                {[0, 1, 2, 3].map(i => (
                  <span key={i} className="h-1.5 flex-1 rounded-full bg-subtle transition-colors" style={i < Math.max(1, nivel) ? { background: FUERZA[nivel].color } : undefined} />
                ))}
              </div>
              <span className="w-[86px] shrink-0 text-right text-xs font-semibold text-content-2">{FUERZA[nivel].label}</span>
            </div>
          )}

          {/* Rol: tarjetas con lo que puede hacer cada uno */}
          <Field label="Rol" required error={errors.rol} hint={roleHint}>
            <div role="radiogroup" aria-label="Rol" className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
              {(roles.length ? roles : [{ key: form.rol, name: form.rol } as RoleOption]).map(r => {
                const activo = form.rol === r.key
                const st = estiloRol(r.key)
                return (
                  <button
                    key={r.key}
                    type="button"
                    role="radio"
                    aria-checked={activo}
                    disabled={lockedRole && !activo}
                    onClick={() => handleChange('rol', r.key as Role)}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45',
                      activo ? 'border-primary bg-primary/6 dark:border-accent dark:bg-primary/15' : 'border-line bg-surface hover:border-line-hover hover:bg-subtle'
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: st.color }} aria-hidden>
                      {st.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-content">{r.name}</span>
                      <span className="block text-xs leading-snug text-muted">{ROL_AYUDA[r.key] ?? 'Rol personalizado: sus permisos se definen en Roles.'}</span>
                    </span>
                    {activo && <FiCheck className="mt-0.5 shrink-0 text-primary dark:text-accent-light" aria-hidden />}
                  </button>
                )
              })}
            </div>
          </Field>
        </StepSection>
      </form>
    </Modal>
  )
}
