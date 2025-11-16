import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import LackTable from '@/Components/Table/LackTable'
import ModalLack from '@/Components/Modal/ModalLack'
import { getLacks, createLack, updateLack, deleteLack } from '@/helpers/api/lack'
import { getModulePermissions } from '@/helpers/permissions'
import { FaPlus, FaSearch } from 'react-icons/fa'

export default function LackPage() {
  const { role: userRole } = useSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'faltas')

  const [lacks, setLacks] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [filters, setFilters] = useState({
    search: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
    from: 0,
    to: 0
  })
  const [loading, setLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Cargar faltas desde la API con paginación y búsqueda
  useEffect(() => {
    async function fetchLacks() {
      setLoading(true)
      try {
        const searchTerm = filters.search.trim()

        console.log('🔍 Filtrando faltas:', {
          search: searchTerm || 'sin búsqueda',
          página: currentPage,
          límite: itemsPerPage
        })

        const result = await getLacks(
          currentPage,
          itemsPerPage,
          searchTerm || null
        )

        console.log('✅ Faltas obtenidas:', result)

        const lacksData = result.data?.data || result.data || []
        setLacks(lacksData)

        // Manejar paginación si existe
        if (result.data?.totalPages) {
          setPagination({
            currentPage: result.data.currentPage || currentPage,
            totalPages: result.data.totalPages || 1,
            perPage: itemsPerPage,
            total: result.data.totalCount || lacksData.length,
            from: lacksData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0,
            to: Math.min(currentPage * itemsPerPage, result.data.totalCount || lacksData.length)
          })
        } else {
          // Si no hay paginación, calcular valores básicos
          setPagination({
            currentPage: currentPage,
            totalPages: Math.ceil(lacksData.length / itemsPerPage),
            perPage: itemsPerPage,
            total: lacksData.length,
            from: lacksData.length > 0 ? 1 : 0,
            to: lacksData.length
          })
        }
      } catch (error) {
        console.error('⚠️ Error al cargar faltas:', error)
        alert('No se pudo cargar las faltas')
      } finally {
        setLoading(false)
      }
    }

    fetchLacks()
  }, [filters.search, currentPage, itemsPerPage, refreshTrigger])


  // Crear o editar falta
  async function handleSave(data) {
    if (editItem) {
      // Actualizar falta existente
      try {
        console.log('📤 Actualizando falta:', editItem.id, data)
        const response = await updateLack(editItem.id, data)
        console.log('✅ Falta actualizada:', response)

        alert(response.data?.message || response.message || 'Falta actualizada exitosamente')

        setEditItem(null)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        console.error('❌ Error al actualizar falta:', error)

        let errorMessage = 'Error al actualizar la falta'

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
      // Crear nueva falta
      try {
        console.log('📤 Creando falta:', data)
        const response = await createLack(data)
        console.log('✅ Falta creada:', response)

        alert(response.data?.message || response.message || 'Falta creada exitosamente')

        setCurrentPage(1)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        console.error('❌ Error al crear falta:', error)

        let errorMessage = 'Error al crear la falta'

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

  async function handleToggleStatus(item) {
    const isEnabled = !item.deleted_at
    const action = isEnabled ? 'deshabilitar' : 'habilitar'
    const confirmMessage = isEnabled
      ? '¿Estás seguro de deshabilitar esta falta? Ya no estará disponible para asignación.'
      : '¿Estás seguro de habilitar esta falta? Volverá a estar disponible para asignación.'

    if (!confirm(confirmMessage)) return

    try {
      console.log(`🔄 Cambiando estado de falta con ID:`, item.id)

      // El endpoint DELETE hace toggle automáticamente
      const response = await deleteLack(item.id)

      console.log('✅ Respuesta:', response)

      alert(response.data?.message || response.message || `Falta ${action === 'habilitar' ? 'habilitada' : 'deshabilitada'} exitosamente`)

      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error(`❌ Error al ${action} falta:`, error)

      let errorMessage = `Error al ${action} la falta`

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

  // Funciones de paginación
  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handlePreviousPage() {
    handlePageChange(currentPage - 1)
  }

  function handleNextPage() {
    handlePageChange(currentPage + 1)
  }

  function handleItemsPerPageChange(newItemsPerPage) {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  // Los datos ya vienen filtrados desde la API
  const filteredData = lacks

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
          <h2>GESTIÓN DE FALTAS</h2>
          <div className="controls">
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
                placeholder="Buscar por nombre de la falta"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                style={{ paddingLeft: '35px' }}
              />
            </div>

            {permissions.canCreate && (
              <button className="btn-primary" onClick={() => { setEditItem(null); setShowModal(true) }}>
                <FaPlus style={{ marginRight: '8px' }} />
                Agregar Falta
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
          Cargando faltas...
        </div>
      ) : (
        <div className="table-container-wrapper">
          <LackTable
            data={filteredData}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEdit}
            startIndex={pagination.from - 1}
            canEdit={permissions.canEdit}
            canDelete={permissions.canDelete}
          />

          {/* Controles de paginación */}
          <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              marginTop: '20px',
              background: 'var(--card-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              {/* Lado izquierdo: Contador y selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{
                  color: 'var(--text)',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}>
                  {pagination.from}-{pagination.to} de {pagination.total}
                </div>

                {/* Selector de items por página */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Mostrar:
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Lado derecho: Botones de navegación */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="btn-secondary"
                  style={{
                    padding: '8px 16px',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  ← Anterior
                </button>

                {/* Números de página */}
                {pagination.totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    gap: '5px',
                    alignItems: 'center'
                  }}>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          style={{
                            padding: '8px 12px',
                            background: currentPage === pageNum ? 'var(--primary)' : 'transparent',
                            color: currentPage === pageNum ? 'white' : 'var(--text)',
                            border: `1px solid ${currentPage === pageNum ? 'var(--primary)' : 'var(--border)'}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                            minWidth: '40px'
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Indicador de página actual si solo hay 1 página */}
                {pagination.totalPages === 1 && (
                  <div style={{
                    padding: '8px 12px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: '1px solid var(--primary)',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    minWidth: '40px',
                    textAlign: 'center'
                  }}>
                    1
                  </div>
                )}

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === pagination.totalPages}
                  className="btn-secondary"
                  style={{
                    padding: '8px 16px',
                    opacity: currentPage === pagination.totalPages ? 0.5 : 1,
                    cursor: currentPage === pagination.totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  Siguiente →
                </button>
              </div>
            </div>
        </div>
      )}

      {showModal && (
        <ModalLack
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
