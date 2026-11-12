import React, { useEffect, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import UserTable, { claveRol, estiloRol, nombreRol, UserAvatar, type UserRow } from '../../components/UserTable'
import ModalUser, { type UserSavePayload } from '../../components/ModalUser'
import {
  getUsers,
  searchUser,
  createUser,
  updateUser,
  deleteUser,
  deactivateSession
} from '../../api/user'
import { FiLogOut, FiMonitor, FiPlus, FiUserCheck, FiUsers, FiUserX, FiWifi } from 'react-icons/fi'
import { toast } from '../../utils/toast'
import { getRoleOptions } from '../../api/role'
import { getModulePermissions } from '../../utils/permissions'
import type { CreateUserDto, ID, Role, RoleOption, User } from '@/types'
import Button from '@/components/UI/Button'
import ConfirmModal from '@/components/ConfirmModal'
import SearchInput from '@/components/UI/SearchInput'
import { EmptyState, LoadingState } from '@/components/UI/EmptyState'
import { cn, fitCard, fitPage } from '@/utils/classes'

/** Filtro de rol: 'all' o un rol del backend */
type RoleFilter = 'all' | Role

/** Cuerpo de respuesta de mutaciones: el mensaje puede venir en la raiz o dentro de data */
interface MutationBody {
  message?: string
  data?: { message?: string }
}

/** Forma minima de un error de axios usada para leer el mensaje del backend */
interface MutationError {
  message?: string
  response?: { data?: { message?: string | string[] } }
}

const readMutationBody = (body: unknown): MutationBody => body as MutationBody

export default function UsuariosPage() {
  const { role: userRole } = useAppSelector((state) => state.auth) // Rol del usuario actual
  const [users, setUsers] = useState<User[]>([])
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editItem, setEditItem] = useState<User | null>(null)
  const [filters, setFilters] = useState<{ search: string; roleFilter: RoleFilter }>({
    search: '',
    roleFilter: 'all' // all, ADMINISTRATOR, SUPERVISOR, SENTINEL, VALIDATOR
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  // Confirmaciones en modal (habilitar/deshabilitar y cerrar sesion)
  const [porConfirmar, setPorConfirmar] = useState<User | null>(null)
  const [sesionPorCerrar, setSesionPorCerrar] = useState<{ userId: ID; ip: string; nombre: string } | null>(null)

  // Permisos del rol (se definen en Roles y permisos). Solo el administrador asigna roles distintos de Centinela.
  const permissions = getModulePermissions(userRole, 'usuarios')
  const { canCreate, canEdit, canDelete } = permissions
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([])
  const assignableRoles = userRole === 'admin' ? roleOptions : roleOptions.filter((role) => role.key === 'SENTINEL')
  const roleNames = Object.fromEntries(roleOptions.map((role) => [role.key, role.name]))

  useEffect(() => {
    getRoleOptions()
      .then(setRoleOptions)
      .catch(() => toast.info('No se pudieron cargar los roles'))
  }, [])

  // Cargar usuarios con filtros aplicados desde la API
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      setIsSearching(true)
      try {
        const searchTerm = filters.search.trim()

        // Se piden todos los roles: el filtro de rol se aplica en el navegador para poder contar por rol
        const response = await getUsers(
          1, // página
          1000, // límite
          null, // filtro de rol (en el navegador)
          searchTerm || null // búsqueda
        )

        const allUsers = response?.data?.data || []
        setUsers(allUsers)
      } catch (error) {
        toast.error('Error al cargar usuarios')
      } finally {
        setLoading(false)
        setIsSearching(false)
      }
    }

    fetchUsers()
  }, [filters.search, refreshTrigger])

  // Crear o editar usuario
  async function handleSave(data: UserSavePayload) {
    if (editItem) {
      // Actualizar usuario existente
      try {
        const response = await updateUser(editItem.id, data)

        toast.success(readMutationBody(response).data?.message || response.message || 'Usuario actualizado exitosamente')

        setEditItem(null)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        const apiError = error as MutationError

        let errorMessage = 'Error al actualizar el usuario'

        if (apiError.response?.data?.message) {
          errorMessage = Array.isArray(apiError.response.data.message)
            ? 'Errores de validación: ' + apiError.response.data.message.join(', ')
            : apiError.response.data.message
        } else if (apiError.message) {
          errorMessage = apiError.message
        }

        toast.error(errorMessage)
      }
    } else {
      // Crear nuevo usuario
      try {
        // Verificar permisos antes de crear
        if (userRole !== 'admin' && data.rol !== 'SENTINEL') {
          toast.warning('Solo puedes crear centinelas')
          return
        }

        if (!canCreate) {
          toast.warning('No tienes permisos para crear usuarios')
          return
        }

        const response = await createUser(data as CreateUserDto)

        toast.success(readMutationBody(response).data?.message || response.message || 'Usuario creado exitosamente')

        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        const apiError = error as MutationError

        let errorMessage = 'Error al crear el usuario'

        if (apiError.response?.data?.message) {
          errorMessage = Array.isArray(apiError.response.data.message)
            ? 'Errores de validación: ' + apiError.response.data.message.join(', ')
            : apiError.response.data.message
        } else if (apiError.message) {
          errorMessage = apiError.message
        }

        toast.error(errorMessage)
      }
    }
  }

  /** Pide confirmacion en un modal antes de cambiar el estado */
  function handleToggleStatus(item: User) {
    setPorConfirmar(item)
  }

  async function confirmarCambioEstado(item: User) {
    setPorConfirmar(null)
    const isEnabled = !item.deleted_at
    const action = isEnabled ? 'deshabilitar' : 'habilitar'

    try {
      // El endpoint DELETE hace toggle automáticamente
      const response = await deleteUser(item.id)

      toast.success(readMutationBody(response).data?.message || response.message || `Usuario ${action === 'habilitar' ? 'habilitado' : 'deshabilitado'} exitosamente`)

      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      const apiError = error as MutationError

      let errorMessage = `Error al ${action} el usuario`

      if (apiError.response?.data?.message) {
        errorMessage = Array.isArray(apiError.response.data.message)
          ? apiError.response.data.message.join(', ')
          : apiError.response.data.message
      } else if (apiError.message) {
        errorMessage = apiError.message
      }

      toast.error(errorMessage)
    }
  }

  function handleEdit(item: User) {
    setEditItem(item)
    setShowModal(true)
  }

  /** Pide confirmacion en un modal antes de cerrar una sesion */
  function handleDeactivateSession(userId: ID, ip: string) {
    const u = users.find(x => x.id === userId)
    setSesionPorCerrar({ userId, ip, nombre: u ? `${u.name ?? ''} ${u.lastname ?? ''}`.trim() || u.username : 'el usuario' })
  }

  async function confirmarCierreSesion(userId: ID, ip: string) {
    setSesionPorCerrar(null)
    try {
      const response = await deactivateSession(userId, ip)
      toast.success(readMutationBody(response).data?.message || response.message || 'Sesión cerrada exitosamente')
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      const apiError = error as MutationError

      let errorMessage = 'Error al cerrar la sesión'

      if (apiError.response?.data?.message) {
        errorMessage = Array.isArray(apiError.response.data.message)
          ? apiError.response.data.message.join(', ')
          : apiError.response.data.message
      } else if (apiError.message) {
        errorMessage = apiError.message
      }

      toast.error(errorMessage)
    }
  }

  // Busqueda en el servidor; el rol se filtra aqui
  const filas = users as UserRow[]
  const filteredData = filters.roleFilter === 'all' ? filas : filas.filter(u => claveRol(u) === filters.roleFilter)
  const hasFilters = filters.search.trim() !== '' || filters.roleFilter !== 'all'

  // Resumen y pestanas por rol (con la busqueda aplicada)
  const activos = filas.filter(u => !u.deleted_at)
  const enLinea = activos.filter(u => (u.sessions?.length ?? 0) > 0)
  const totalSesiones = enLinea.reduce((n, u) => n + (u.sessions?.length ?? 0), 0)
  const porRol = new Map<string, number>()
  filas.forEach(u => porRol.set(claveRol(u), (porRol.get(claveRol(u)) ?? 0) + 1))
  const pestanas = [...porRol.entries()].sort((a, b) => estiloRol(a[0]).orden - estiloRol(b[0]).orden)

  const resumen = [
    { label: 'Usuarios', value: filas.length, detail: 'con acceso al sistema', icon: <FiUsers />, tone: 'bg-primary/10 text-primary dark:bg-primary/25 dark:text-accent-light' },
    { label: 'Activos', value: activos.length, detail: `${filas.length - activos.length} deshabilitados`, icon: <FiUserCheck />, tone: 'bg-success/12 text-lime-ink' },
    { label: 'En línea ahora', value: enLinea.length, detail: `${totalSesiones} ${totalSesiones === 1 ? 'sesión abierta' : 'sesiones abiertas'}`, icon: <FiWifi />, tone: 'bg-brand-cyan/14 text-cyan-ink', vivo: true },
    { label: 'Deshabilitados', value: filas.length - activos.length, detail: 'sin acceso', icon: <FiUserX />, tone: 'bg-danger/10 text-red-ink' },
  ]

  const tabBtn = (activo: boolean) =>
    cn(
      'inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border px-3 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150',
      activo
        ? 'border-primary bg-primary text-white shadow-[0_6px_14px_-8px_rgba(30,58,138,0.9)]'
        : 'border-line bg-surface text-content hover:border-line-strong hover:bg-subtle'
    )

  return (
    <div className={fitPage}>
      {/* Encabezado como el de Incidencias: titulo grande a la izquierda y la accion a la derecha */}
      <header className="mb-4 flex shrink-0 flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold tracking-[0.14em] text-primary/70 uppercase dark:text-accent-light">Administración · Accesos</p>
          <h2 className="m-0 mt-0.5 text-[30px] leading-tight font-bold tracking-[-0.02em] text-ink dark:text-content">Usuarios</h2>
          <p className="m-0 mt-1 text-sm text-content-2">Personas con acceso al sistema, su rol y sus sesiones abiertas.</p>
        </div>
        {canCreate && (
          <Button
            icon={<FiPlus />}
            onClick={() => {
              setEditItem(null)
              setShowModal(true)
            }}
          >
            Agregar usuario
          </Button>
        )}
      </header>

      {/* Resumen */}
      <div className="mb-4 grid shrink-0 grid-cols-4 gap-3 max-lg:grid-cols-2 max-[420px]:grid-cols-1">
        {resumen.map(r => (
          <div
            key={r.label}
            className="flex items-center gap-3.5 rounded-2xl border border-[#d3dceb] bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgba(12,26,75,0.06),0_12px_28px_-14px_rgba(12,26,75,0.28)] dark:border-line"
          >
            <span className={cn('relative flex size-11 shrink-0 items-center justify-center rounded-xl text-xl', r.tone)} aria-hidden>
              {r.icon}
              {r.vivo && r.value > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-3">
                  <span className="absolute size-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative size-3 rounded-full border-2 border-surface bg-success" />
                </span>
              )}
            </span>
            <div className="min-w-0">
              <p className="m-0 truncate text-[13px] font-medium text-content-2">{r.label}</p>
              <p className="m-0 text-[24px] leading-tight font-bold tracking-[-0.02em] text-ink dark:text-content">{loading && !users.length ? '—' : r.value}</p>
              <p className="m-0 truncate text-xs text-muted">{r.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Barra: busqueda y rol (con la cantidad de cada uno) */}
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-[#d3dceb] bg-surface p-3 shadow-[0_1px_2px_rgba(12,26,75,0.06),0_12px_28px_-14px_rgba(12,26,75,0.28)] dark:border-line">
        <div className="min-w-[240px] flex-1">
          <SearchInput
            value={filters.search}
            onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
            placeholder="Buscar por nombre, usuario o correo"
            loading={isSearching}
            className="max-w-none!"
          />
        </div>
        <div role="tablist" aria-label="Filtrar por rol" className="flex flex-wrap items-center gap-1.5">
          <button type="button" role="tab" aria-selected={filters.roleFilter === 'all'} onClick={() => setFilters(f => ({ ...f, roleFilter: 'all' }))} className={tabBtn(filters.roleFilter === 'all')}>
            Todos
            <span className={cn('rounded-full px-1.5 text-[11px] tabular-nums', filters.roleFilter === 'all' ? 'bg-white/20' : 'bg-subtle text-content-2')}>{filas.length}</span>
          </button>
          {pestanas.map(([clave, n]) => {
            const activo = filters.roleFilter === clave
            const estilo = estiloRol(clave)
            return (
              <button key={clave} type="button" role="tab" aria-selected={activo} onClick={() => setFilters(f => ({ ...f, roleFilter: clave as RoleFilter }))} className={tabBtn(activo)}>
                <span className="size-2 rounded-full" style={{ background: activo ? '#fff' : estilo.color }} aria-hidden />
                {nombreRol(clave, roleNames)}
                <span className={cn('rounded-full px-1.5 text-[11px] tabular-nums', activo ? 'bg-white/20' : 'bg-subtle text-content-2')}>{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_300px] gap-4 max-xl:grid-cols-1">
        <div className={fitCard}>
          {loading && !users.length ? (
            <LoadingState label="Cargando usuarios…" />
          ) : filteredData.length === 0 ? (
            hasFilters ? (
              <EmptyState title="Sin resultados" description="Ningún usuario coincide con la búsqueda o el rol elegido." />
            ) : (
              <EmptyState title="Aún no hay usuarios" description="Cuando se registren usuarios, aparecerán aquí." />
            )
          ) : (
            <UserTable
              data={filteredData}
              onToggleStatus={handleToggleStatus}
              onEdit={handleEdit}
              onDeactivateSession={userRole === 'admin' ? handleDeactivateSession : null}
              canEdit={canEdit}
              canDelete={canDelete}
              roleNames={roleNames}
            />
          )}
        </div>

        {/* En linea ahora: quien tiene sesion abierta y desde que equipo */}
        <aside className={cn(fitCard, 'max-xl:hidden')} aria-label="En línea ahora">
          <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
            <span className="relative flex size-2.5" aria-hidden>
              <span className="absolute size-full animate-ping rounded-full bg-success opacity-50" />
              <span className="relative size-2.5 rounded-full bg-success" />
            </span>
            <h3 className="m-0 text-[14px] font-semibold text-content">En línea ahora</h3>
            <span className="ml-auto rounded-full bg-subtle px-2 py-px text-[11px] font-bold text-content-2 tabular-nums">{enLinea.length}</span>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {enLinea.length === 0 ? (
              <p className="m-0 px-3 py-8 text-center text-[13px] text-muted">Nadie tiene una sesión abierta en este momento.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {enLinea.map(u => {
                  const nombre = `${u.name ?? ''} ${u.lastname ?? ''}`.trim() || u.username
                  const estilo = estiloRol(claveRol(u))
                  return (
                    <li key={u.id} className="rounded-xl px-2.5 py-2 transition-colors hover:bg-subtle">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar user={u} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="m-0 truncate text-[13px] font-semibold text-content">{nombre}</p>
                          <p className="m-0 flex items-center gap-1 text-[11px] text-muted">
                            <span className="size-1.5 rounded-full" style={{ background: estilo.color }} aria-hidden />
                            {nombreRol(claveRol(u), roleNames)}
                          </p>
                        </div>
                      </div>
                      <ul className="m-0 mt-1.5 flex list-none flex-col gap-1 p-0 pl-[42px]">
                        {(u.sessions ?? []).map(ip => (
                          <li key={ip} className="flex items-center gap-1.5 text-xs text-content-2">
                            <FiMonitor className="shrink-0 text-muted" aria-hidden />
                            <span className="flex-1 truncate font-mono">{ip}</span>
                            {userRole === 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleDeactivateSession(u.id, ip)}
                                title={`Cerrar sesión en ${ip}`}
                                aria-label={`Cerrar la sesión de ${nombre} en ${ip}`}
                                className="flex size-6 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                              >
                                <FiLogOut aria-hidden />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <ConfirmModal
        isOpen={!!porConfirmar}
        type={porConfirmar && !porConfirmar.deleted_at ? 'danger' : 'info'}
        title={
          porConfirmar && !porConfirmar.deleted_at
            ? `¿Deshabilitar a ${`${porConfirmar.name ?? ''} ${porConfirmar.lastname ?? ''}`.trim() || porConfirmar.username}?`
            : `¿Habilitar a ${porConfirmar ? `${porConfirmar.name ?? ''} ${porConfirmar.lastname ?? ''}`.trim() || porConfirmar.username : ''}?`
        }
        message={
          porConfirmar && !porConfirmar.deleted_at
            ? 'Ya no podrá iniciar sesión en el sistema. Puedes volver a habilitarlo cuando quieras.'
            : 'Podrá volver a iniciar sesión en el sistema.'
        }
        confirmText={porConfirmar && !porConfirmar.deleted_at ? 'Deshabilitar' : 'Habilitar'}
        onConfirm={() => porConfirmar && confirmarCambioEstado(porConfirmar)}
        onCancel={() => setPorConfirmar(null)}
      />

      <ConfirmModal
        isOpen={!!sesionPorCerrar}
        type="warning"
        title={`¿Cerrar la sesión de ${sesionPorCerrar?.nombre ?? ''}?`}
        message={`Se cerrará la sesión abierta desde ${sesionPorCerrar?.ip ?? ''}. Tendrá que volver a iniciar sesión en ese equipo.`}
        confirmText="Cerrar sesión"
        onConfirm={() => sesionPorCerrar && confirmarCierreSesion(sesionPorCerrar.userId, sesionPorCerrar.ip)}
        onCancel={() => setSesionPorCerrar(null)}
      />

      {showModal && (
        <ModalUser
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleSave}
          userRole={userRole}
          roles={assignableRoles}
        />
      )}
    </div>
  )
}
