import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import BodycamTable from '../../components/BodycamTable'
import ModalBodycam from '../../components/ModalBodycam'
import { getBodycams, getBodycamById, createBodycam, updateBodycam, deleteBodycam, searchBodycam } from '../../api/bodycam'
import { getModulePermissions } from '../../utils/permissions'
import { FaPlus, FaSearch } from 'react-icons/fa'

export default function BodycamPage() {
  const { role: userRole } = useSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'bodycam')

  const [bodycams, setBodycams] = useState([])
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
  const [searchResult, setSearchResult] = useState(null)
  const [isSearching, setIsSearching] = useState(false)

  // Cargar bodycams desde la API con paginación
  useEffect(() => {
    async function fetchBodycams() {
      setLoading(true)
      try {
        console.log(`📡 Obteniendo bodycams desde API (página ${currentPage}, ${itemsPerPage} por página)...`)
        const result = await getBodycams(currentPage, itemsPerPage)
        console.log('✅ Bodycams obtenidas:', result)
        setBodycams(result.data)
        setPagination(result.pagination)
      } catch (error) {
        console.error('⚠️ Error al cargar bodycams:', error)
        alert('No se pudieron cargar las bodycams')
      } finally {
        setLoading(false)
      }
    }

    fetchBodycams()
  }, [currentPage, itemsPerPage, refreshTrigger])

  // Verificar si el término de búsqueda es un UUID
  const isUUID = (str) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  // Buscar bodycam por ID o nombre/serie cuando el usuario escribe
  useEffect(() => {
    const searchTerm = filters.search.trim()

    // Si no hay término de búsqueda, limpiar resultados
    if (!searchTerm) {
      setSearchResult(null)
      return
    }

    // Si es UUID, buscar por ID
    if (isUUID(searchTerm)) {
      const searchById = async () => {
        setIsSearching(true)
        try {
          console.log('🔍 Buscando bodycam por ID:', searchTerm)
          const result = await getBodycamById(searchTerm)

          if (result.found && result.data.length > 0) {
            console.log('✅ Bodycam encontrada:', result.data[0])
            setSearchResult(result.data)
          } else {
            console.log('⚠️ No se encontró bodycam con ese ID')
            setSearchResult([])
          }
        } catch (error) {
          console.error('❌ Error al buscar por ID:', error)
          setSearchResult(null)
        } finally {
          setIsSearching(false)
        }
      }

      searchById()
    } else {
      // Si NO es UUID, buscar por nombre/serie en toda la base de datos
      const searchByNameOrSerie = async () => {
        setIsSearching(true)
        try {
          console.log('🔍 Buscando bodycam por nombre/serie:', searchTerm)
          const response = await searchBodycam(searchTerm)

          // La API devuelve los datos en response.data?.data?.data
          const results = response?.data?.data || []

          if (results.length > 0) {
            console.log('✅ Bodycams encontradas:', results)
            // Transformar los resultados al formato esperado
            const transformed = results.map(b => ({
              id: b.id,
              name: b.name,
              serie: b.serie,
              deleted_at: b.deleted_at
            }))
            setSearchResult(transformed)
          } else {
            console.log('⚠️ No se encontraron bodycams con ese término')
            setSearchResult([])
          }
        } catch (error) {
          console.error('❌ Error al buscar por nombre/serie:', error)
          setSearchResult(null)
        } finally {
          setIsSearching(false)
        }
      }

      searchByNameOrSerie()
    }
  }, [filters.search])

  // Crear o editar bodycam
  async function handleSave(data) {
    if (editItem) {
      // Actualizar bodycam existente
      try {
        console.log('📤 Actualizando bodycam:', editItem.id, data)
        const response = await updateBodycam(editItem.id, data)
        console.log('✅ Bodycam actualizada:', response)

        alert(response.data?.message || response.message || 'Bodycam actualizada exitosamente')

        setEditItem(null)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        console.error('❌ Error al actualizar bodycam:', error)

        let errorMessage = 'Error al actualizar la bodycam'

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
      // Crear nueva bodycam
      try {
        console.log('📤 Creando bodycam:', data)
        const response = await createBodycam(data)
        console.log('✅ Bodycam creada:', response)

        alert(response.data?.message || response.message || 'Bodycam creada exitosamente')

        setCurrentPage(1)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        console.error('❌ Error al crear bodycam:', error)

        let errorMessage = 'Error al crear la bodycam'

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
      ? '¿Estás seguro de deshabilitar esta bodycam? Ya no estará disponible para asignación.'
      : '¿Estás seguro de habilitar esta bodycam? Volverá a estar disponible para asignación.'

    if (!confirm(confirmMessage)) return

    try {
      console.log(`🔄 Cambiando estado de bodycam con ID:`, item.id)

      // El endpoint DELETE hace toggle automáticamente
      const response = await deleteBodycam(item.id)

      console.log('✅ Respuesta:', response)

      alert(response.data?.message || response.message || `Bodycam ${action === 'habilitar' ? 'habilitada' : 'deshabilitada'} exitosamente`)

      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error(`❌ Error al ${action} bodycam:`, error)

      let errorMessage = `Error al ${action} la bodycam`

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

  // Filtros - cuando hay searchResult lo mostramos directamente
  const filteredData = searchResult !== null ? searchResult : bodycams

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
          <h2>GESTIÓN DE BODYCAMS</h2>
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
                placeholder="Buscar por nombre, serie o ID"
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

            {permissions.canCreate && (
              <button className="btn-primary" onClick={() => { setEditItem(null); setShowModal(true) }}>
                <FaPlus style={{ marginRight: '8px' }} />
                Agregar Bodycam
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mensaje informativo para roles con permisos de solo lectura */}
      {!permissions.canCreate && permissions.canView && (
        <div style={{
          textAlign: 'center',
          padding: '12px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '8px',
          margin: '20px',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <p style={{ fontSize: '0.9rem', color: '#3b82f6', margin: '0' }}>
            ℹ️ Tienes permisos de solo lectura. No puedes crear, editar o eliminar bodycams.
          </p>
        </div>
      )}

      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-muted)',
          fontSize: '1.1rem'
        }}>
          Cargando bodycams...
        </div>
      ) : (
        <div className="table-container-wrapper">
          {/* Mensaje cuando se busca pero no se encuentra */}
          {searchResult !== null && searchResult.length === 0 && !isSearching && (
            <div style={{
              textAlign: 'center',
              padding: '30px',
              backgroundColor: 'var(--card)',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '2px dashed var(--border)'
            }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: '0' }}>
                🔍 No se encontró ninguna bodycam con: <strong>{filters.search}</strong>
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Verifica que el nombre, serie o ID sea correcto.
              </p>
            </div>
          )}

          {/* Mensaje cuando se encuentra bodycam */}
          {searchResult !== null && searchResult.length > 0 && (
            <div style={{
              textAlign: 'center',
              padding: '12px',
              backgroundColor: 'rgba(74, 222, 128, 0.1)',
              borderRadius: '8px',
              marginBottom: '15px',
              border: '1px solid rgba(74, 222, 128, 0.3)'
            }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--success)', margin: '0', fontWeight: '500' }}>
                ✅ {searchResult.length} bodycam(s) encontrada(s)
              </p>
            </div>
          )}

          <BodycamTable
            data={filteredData}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEdit}
            startIndex={searchResult !== null ? 0 : pagination.from - 1}
            canEdit={permissions.canEdit}
            canDelete={permissions.canDelete}
          />

          {/* Controles de paginación (ocultar cuando se busca) */}
          {searchResult === null && (
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
          )}
        </div>
      )}

      {showModal && (
        <ModalBodycam
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
