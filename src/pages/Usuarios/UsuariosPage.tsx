import React, { useEffect, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import UserTable from '../../components/UserTable'
import ModalUser, { type UserSavePayload } from '../../components/ModalUser'
import {
  getUsers,
  searchUser,
  createUser,
  updateUser,
  deleteUser,
  deactivateSession
} from '../../api/user'
import { FaPlus, FaSearch } from 'react-icons/fa'
import { toast } from '../../utils/toast'
import type { CreateUserDto, ID, Role, User } from '@/types'
import {
  btnPrimary,
  cn,
  controlsBar,
  controlsInput,
  incidenciasPage,
  pageHeaderIncidencias,
  pageTitle,
  tableWrapper
} from '../../utils/classes'

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

/** Ajustes de .controls a ancho tablet (<=900px) que no incluyen las constantes compartidas */
const controlsBarResponsive = cn(controlsBar, 'max-[900px]:flex-wrap max-[900px]:justify-between max-[900px]:gap-2')
const controlsInputResponsive = cn(controlsInput, 'max-[900px]:flex-[1_1_100%] max-[900px]:min-w-0')

/** Select de filtro por rol (el borde y el padding inline del original anulan el hover/focus de .controls select) */
const roleSelect = cn(
  'max-w-[200px] max-[900px]:flex-[1_1_100%] overflow-hidden text-ellipsis whitespace-nowrap',
  'cursor-pointer rounded-[8px] border border-line [background:var(--bg)] px-3 py-2 min-w-[180px]',
  'text-[15.2px] text-content! outline-none [backdrop-filter:blur(5px)] transition-all duration-300',
  'hover:shadow-[0_0_0_3px_rgba(30,58,138,0.1)] focus:-translate-y-0.5 focus:shadow-[0_0_0_4px_rgba(30,58,138,0.15)] dark:text-[#f8fafc]!'
)

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

  // Permisos según rol
  const canCreateSupervisor = userRole === 'admin'
  const canCreateValidator = userRole === 'admin' // Solo admin puede crear VALIDATOR
  const canCreateSentinel = userRole === 'admin' || userRole === 'supervisor'
  const canCreate = canCreateSentinel || canCreateSupervisor
  const canEdit = userRole === 'admin' || userRole === 'supervisor'
  const canDelete = userRole === 'admin' || userRole === 'supervisor'

  // Cargar usuarios con filtros aplicados desde la API
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      setIsSearching(true)
      try {
        const searchTerm = filters.search.trim()
        const selectedRole = filters.roleFilter !== 'all' ? filters.roleFilter : null

        const response = await getUsers(
          1, // página
          1000, // límite
          selectedRole, // filtro de rol
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
  }, [filters.search, filters.roleFilter, refreshTrigger])

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
        if (data.rol === 'ADMINISTRATOR' && userRole !== 'admin') {
          toast.warning('No tienes permisos para crear administradores')
          return
        }

        if (data.rol === 'SUPERVISOR' && !canCreateSupervisor) {
          toast.warning('No tienes permisos para crear supervisores')
          return
        }

        if (data.rol === 'VALIDATOR' && !canCreateValidator) {
          toast.warning('No tienes permisos para crear validadores')
          return
        }

        if (!canCreateSentinel) {
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

  async function handleToggleStatus(item: User) {
    const isEnabled = !item.deleted_at
    const action = isEnabled ? 'deshabilitar' : 'habilitar'
    const confirmMessage = isEnabled
      ? '¿Estás seguro de deshabilitar este usuario? Ya no podrá acceder al sistema.'
      : '¿Estás seguro de habilitar este usuario? Podrá volver a acceder al sistema.'

    if (!confirm(confirmMessage)) return

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

  async function handleDeactivateSession(userId: ID, ip: string) {
    if (!confirm(`¿Estás seguro de cerrar la sesión en ${ip}?`)) return

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

  // Los usuarios ya vienen filtrados desde la API, no necesitamos filtrar en el frontend
  const filteredData = users

  return (
    <div className={incidenciasPage}>
      <header className={pageHeaderIncidencias}>
        <div className="flex flex-1 items-center gap-5">
          <h2 className={pageTitle}>GESTIÓN DE USUARIOS</h2>
          <div className={controlsBarResponsive}>
            {/* Filtro por rol */}
            <select
              className={roleSelect}
              value={filters.roleFilter}
              onChange={e => setFilters(f => ({ ...f, roleFilter: e.target.value as RoleFilter }))}
            >
              <option value="all">📋 Todos los roles</option>
              {userRole === 'admin' && <option value="ADMINISTRATOR">👑 Administradores</option>}
              {userRole === 'admin' && <option value="SUPERVISOR">👨‍💼 Supervisores</option>}
              {userRole === 'admin' && <option value="VALIDATOR">✅ Validadores</option>}
              <option value="SENTINEL">🛡️ Sentinels</option>
            </select>

            {/* Búsqueda */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className={cn(controlsInputResponsive, 'pl-[35px]!', isSearching ? 'pr-[35px]!' : 'pr-3!')}
                placeholder="Buscar por nombre, usuario o email"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                  ⏳
                </div>
              )}
            </div>

            {/* Botón agregar (solo si tiene permisos) */}
            {canCreate && (
              <button className={btnPrimary} onClick={() => { setEditItem(null); setShowModal(true) }}>
                <FaPlus className="mr-2" />
                Agregar Usuario
              </button>
            )}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="p-10 text-center text-[17.6px] text-muted">
          Cargando usuarios...
        </div>
      ) : (
        <div className={tableWrapper}>
          {/* Mensaje informativo según permisos */}
          {!canCreate && (
            <div className="mb-[15px] rounded-[8px] border border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.1)] p-3 text-center">
              <p className="m-0 text-[14.4px] text-[#f59e0b]">
                ⚠️ Como Sentinel, solo puedes ver los usuarios registrados
              </p>
            </div>
          )}

          <UserTable
            data={filteredData}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEdit}
            onDeactivateSession={userRole === 'admin' ? handleDeactivateSession : null}
            startIndex={0}
            canEdit={canEdit}
            canDelete={canDelete}
          />

          {/* Contador de usuarios */}
          <div className="mt-5 flex items-center justify-center rounded-[8px] border border-line p-5">
            <div className="text-[15.2px] font-medium">
              Total: {filteredData.length} usuario(s)
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <ModalUser
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleSave}
          userRole={userRole}
        />
      )}
    </div>
  )
}
