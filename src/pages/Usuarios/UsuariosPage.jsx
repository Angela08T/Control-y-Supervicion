import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import UserTable from '../../components/UserTable'
import ModalUser from '../../components/ModalUser'
import {
  getUsers,
  searchUser,
  createUser,
  updateUser,
  deleteUser
} from '../../api/user'
import { FaPlus, FaSearch } from 'react-icons/fa'

export default function UsuariosPage() {
  const { role: userRole } = useSelector((state) => state.auth) // Rol del usuario actual
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    roleFilter: 'all' // all, SUPERVISOR, SENTINEL
  })
  const [loading, setLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isSearching, setIsSearching] = useState(false)

  // Permisos según rol
  const canCreateSupervisor = userRole === 'admin'
  const canCreateSentinel = userRole === 'admin' || userRole === 'supervisor'
  const canCreate = canCreateSentinel || canCreateSupervisor
  const canEdit = userRole === 'admin' || userRole === 'supervisor'
  const canDelete = userRole === 'admin' || userRole === 'supervisor'

  // Cargar usuarios desde la API
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      try {
        const response = await getUsers(1, 1000)
        const allUsers = response?.data?.data || []
        setUsers(allUsers)
      } catch (error) {
        console.error('Error al cargar usuarios:', error)
        alert('Error al cargar usuarios')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [refreshTrigger])

  // Buscar usuarios
  useEffect(() => {
    const searchTerm = filters.search.trim()

    if (!searchTerm) {
      return
    }

    const searchUsers = async () => {
      setIsSearching(true)
      try {
        const response = await searchUser(searchTerm)
        const searchResults = response?.data || []

        // Si hay búsqueda activa, reemplazar los usuarios actuales
        if (searchTerm) {
          setUsers(searchResults)
        }
      } catch (error) {
        console.error('Error al buscar usuarios:', error)
      } finally {
        setIsSearching(false)
      }
    }

    searchUsers()
  }, [filters.search])

  // Crear o editar usuario
  async function handleSave(data) {
    if (editItem) {
      // Actualizar usuario existente
      try {
        const response = await updateUser(editItem.id, data)

        alert(response.data?.message || response.message || 'Usuario actualizado exitosamente')

        setEditItem(null)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        console.error('Error al actualizar usuario:', error)

        let errorMessage = 'Error al actualizar el usuario'

        if (error.response?.data?.message) {
          errorMessage = Array.isArray(error.response.data.message)
            ? 'Errores de validación:\n' + error.response.data.message.join('\n')
            : error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }

        alert(errorMessage)
      }
    } else {
      // Crear nuevo usuario
      try {
        // Verificar permisos antes de crear
        if (data.rol === 'SUPERVISOR' && !canCreateSupervisor) {
          alert('No tienes permisos para crear supervisores')
          return
        }

        if (!canCreateSentinel) {
          alert('No tienes permisos para crear usuarios')
          return
        }

        const response = await createUser(data)

        alert(response.data?.message || response.message || 'Usuario creado exitosamente')

        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        console.error('Error al crear usuario:', error)

        let errorMessage = 'Error al crear el usuario'

        if (error.response?.data?.message) {
          errorMessage = Array.isArray(error.response.data.message)
            ? 'Errores de validación:\n' + error.response.data.message.join('\n')
            : error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }

        alert(errorMessage)
      }
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return

    try {
      const response = await deleteUser(id)

      alert(response.data?.message || response.message || 'Usuario eliminado exitosamente')

      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error al eliminar usuario:', error)

      let errorMessage = 'Error al eliminar el usuario'

      if (error.response?.data?.message) {
        errorMessage = Array.isArray(error.response.data.message)
          ? error.response.data.message.join('\n')
          : error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      alert(errorMessage)
    }
  }

  function handleEdit(item) {
    setEditItem(item)
    setShowModal(true)
  }

  // Filtrar por rol
  const filteredData = users.filter(user => {
    if (filters.roleFilter === 'all') return true
    return user.rol === filters.roleFilter || user.role === filters.roleFilter
  })

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
          <h2>GESTIÓN DE USUARIOS</h2>
          <div className="controls">
            {/* Filtro por rol */}
            <select
              value={filters.roleFilter}
              onChange={e => setFilters(f => ({ ...f, roleFilter: e.target.value }))}
            >
              <option value="all">Todos los roles</option>
              {userRole === 'admin' && <option value="SUPERVISOR">Supervisores</option>}
              <option value="SENTINEL">Sentinels</option>
            </select>

            {/* Búsqueda */}
            <div style={{ position: 'relative' }}>
              <FaSearch
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)'
                }}
              />
              <input
                placeholder="Buscar por nombre, usuario o email"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                style={{ paddingLeft: '35px', paddingRight: isSearching ? '35px' : '12px' }}
              />
              {isSearching && (
                <div
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--primary)',
                    animation: 'spin 1s linear infinite'
                  }}
                >
                  ⏳
                </div>
              )}
            </div>

            {/* Botón agregar (solo si tiene permisos) */}
            {canCreate && (
              <button className="btn-primary" onClick={() => { setEditItem(null); setShowModal(true) }}>
                <FaPlus style={{ marginRight: '8px' }} />
                Agregar Usuario
              </button>
            )}
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-muted)',
          fontSize: '1.1rem'
        }}>
          Cargando usuarios...
        </div>
      ) : (
        <div className="table-container-wrapper">
          {/* Mensaje informativo según permisos */}
          {!canCreate && (
            <div style={{
              textAlign: 'center',
              padding: '12px',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              borderRadius: '8px',
              marginBottom: '15px',
              border: '1px solid rgba(251, 191, 36, 0.3)'
            }}>
              <p style={{ fontSize: '0.9rem', color: '#f59e0b', margin: '0' }}>
                ⚠️ Como Sentinel, solo puedes ver los usuarios registrados
              </p>
            </div>
          )}

          <UserTable
            data={filteredData}
            onDelete={handleDelete}
            onEdit={handleEdit}
            startIndex={0}
            canEdit={canEdit}
            canDelete={canDelete}
          />

          {/* Contador de usuarios */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            marginTop: '20px',
            background: 'var(--card-bg)',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              color: 'var(--text)',
              fontSize: '0.95rem',
              fontWeight: '500'
            }}>
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
