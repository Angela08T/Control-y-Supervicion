import React, { useEffect, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import BodycamTable, { type BodycamTableRow } from '../../components/BodycamTable'
import ModalBodycam from '../../components/ModalBodycam'
import { getBodycams, getBodycamById, createBodycam, updateBodycam, deleteBodycam, searchBodycam } from '../../api/bodycam'
import { getModulePermissions } from '../../utils/permissions'
import { FaPlus, FaSearch } from 'react-icons/fa'
import { toast } from '../../utils/toast'
import type { BodycamView, CreateBodycamDto, TablePagination } from '@/types'

/** Tipos de filtro de dispositivo del selector */
type DeviceType = 'all' | 'camera' | 'sg' | 'fisca'

/** Tipo de dispositivo detectado por nombre */
type DeviceKind = 'unknown' | 'sg' | 'fisca' | 'camera' | 'other'

/** Fila de resultado de busqueda (sin el campo cam) */
type BodycamRow = Pick<BodycamView, 'id' | 'name' | 'serie' | 'deleted_at'>

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

export default function BodycamPage() {
  const { role: userRole } = useAppSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'bodycam')

  const [bodycams, setBodycams] = useState<BodycamView[]>([])
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editItem, setEditItem] = useState<BodycamTableRow | null>(null)
  const [filters, setFilters] = useState<{ search: string; deviceType: DeviceType }>({
    search: '',
    deviceType: 'all' // all, camera, sg, fisca
  })

  // Función para determinar el tipo de dispositivo basado en el nombre
  const getDeviceType = (name: string): DeviceKind => {
    if (!name) return 'unknown'
    const upperName = name.toUpperCase()
    if (upperName.startsWith('SG')) return 'sg'
    if (upperName.startsWith('FISCA')) return 'fisca'
    // Si es numérico o alfanumérico simple (1, 20A, 510, etc.) es cámara
    if (/^[0-9]+[A-Z]?$/i.test(name.trim())) return 'camera'
    return 'other'
  }

  // Efecto para buscar por tipo de dispositivo
  useEffect(() => {
    if (filters.deviceType === 'all') {
      setSearchResult(null)
      return
    }

    // Si hay búsqueda activa, no hacer búsqueda por tipo
    if (filters.search.trim()) return

    const searchByType = async () => {
      setIsSearching(true)
      try {
        let searchPrefix = ''
        if (filters.deviceType === 'sg') searchPrefix = 'SG'
        else if (filters.deviceType === 'fisca') searchPrefix = 'FISCA'
        else if (filters.deviceType === 'camera') {
          // Para cámaras, cargar todos y filtrar localmente
          const result = await getBodycams(1, 1000)
          const cameras = result.data.filter(item => getDeviceType(item.name) === 'camera')
          setSearchResult(cameras)
          setIsSearching(false)
          return
        }

        if (searchPrefix) {
          const response = await searchBodycam(searchPrefix)
          const results = response?.data?.data || []
          const transformed = results.map(b => ({
            id: b.id,
            name: b.name,
            serie: b.serie,
            deleted_at: b.deleted_at
          }))
          setSearchResult(transformed)
        }
      } catch (error) {
        setSearchResult([])
      } finally {
        setIsSearching(false)
      }
    }

    searchByType()
  }, [filters.deviceType])
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [pagination, setPagination] = useState<TablePagination>({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
    from: 0,
    to: 0
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [searchResult, setSearchResult] = useState<BodycamRow[] | null>(null)
  const [isSearching, setIsSearching] = useState<boolean>(false)

  // Cargar bodycams desde la API con paginación
  useEffect(() => {
    async function fetchBodycams() {
      setLoading(true)
      try {
        const result = await getBodycams(currentPage, itemsPerPage)
        setBodycams(result.data)
        setPagination(result.pagination)
      } catch (error) {
        toast.info('No se pudieron cargar los dispositivos')
      } finally {
        setLoading(false)
      }
    }

    fetchBodycams()
  }, [currentPage, itemsPerPage, refreshTrigger])

  // Verificar si el término de búsqueda es un UUID
  const isUUID = (str: string): boolean => {
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
          const result = await getBodycamById(searchTerm)

          if (result.found && result.data.length > 0) {
            setSearchResult(result.data)
          } else {
            setSearchResult([])
          }
        } catch (error) {
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
          const response = await searchBodycam(searchTerm)

          // La API devuelve los datos en response.data?.data?.data
          const results = response?.data?.data || []

          if (results.length > 0) {
            // Transformar los resultados al formato esperado
            const transformed = results.map(b => ({
              id: b.id,
              name: b.name,
              serie: b.serie,
              deleted_at: b.deleted_at
            }))
            setSearchResult(transformed)
          } else {
            setSearchResult([])
          }
        } catch (error) {
          setSearchResult(null)
        } finally {
          setIsSearching(false)
        }
      }

      searchByNameOrSerie()
    }
  }, [filters.search])

  // Crear o editar dispositivo
  async function handleSave(data: Pick<CreateBodycamDto, 'name' | 'serie'>) {
    if (editItem) {
      // Actualizar dispositivo existente
      try {
        const response = await updateBodycam(editItem.id, data)

        toast.success(readMutationBody(response).data?.message || response.message || 'Dispositivo actualizado exitosamente')

        setEditItem(null)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        const apiError = error as MutationError

        let errorMessage = 'Error al actualizar el dispositivo'

        if (apiError.response?.data?.message) {
          errorMessage = Array.isArray(apiError.response.data.message)
            ? 'Errores de validación:\n' + apiError.response.data.message.join('\n')
            : apiError.response.data.message
        } else if (apiError.message) {
          errorMessage = apiError.message
        }

        toast.error(errorMessage)
      }
    } else {
      // Crear nuevo dispositivo
      try {
        const response = await createBodycam({ ...data, cam: 'BODYCAM' })

        toast.success(readMutationBody(response).data?.message || response.message || 'Dispositivo creado exitosamente')

        setCurrentPage(1)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        const apiError = error as MutationError

        let errorMessage = 'Error al crear el dispositivo'

        if (apiError.response?.data?.message) {
          errorMessage = Array.isArray(apiError.response.data.message)
            ? 'Errores de validación:\n' + apiError.response.data.message.join('\n')
            : apiError.response.data.message
        } else if (apiError.message) {
          errorMessage = apiError.message
        }

        toast.error(errorMessage)
      }
    }
  }

  async function handleToggleStatus(item: BodycamTableRow) {
    const isEnabled = !item.deleted_at
    const action = isEnabled ? 'deshabilitar' : 'habilitar'
    const confirmMessage = isEnabled
      ? '¿Estás seguro de deshabilitar este dispositivo? Ya no estará disponible para asignación.'
      : '¿Estás seguro de habilitar este dispositivo? Volverá a estar disponible para asignación.'

    if (!confirm(confirmMessage)) return

    try {
      // El endpoint DELETE hace toggle automáticamente
      const response = await deleteBodycam(item.id)

      toast.success(readMutationBody(response).data?.message || response.message || `Dispositivo ${action === 'habilitar' ? 'habilitado' : 'deshabilitado'} exitosamente`)

      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      const apiError = error as MutationError

      let errorMessage = `Error al ${action} el dispositivo`

      if (apiError.response?.data?.message) {
        errorMessage = Array.isArray(apiError.response.data.message)
          ? apiError.response.data.message.join('\n')
          : apiError.response.data.message
      } else if (apiError.message) {
        errorMessage = apiError.message
      }

      toast.error(errorMessage)
    }
  }

  function handleEdit(item: BodycamTableRow) {
    setEditItem(item)
    setShowModal(true)
  }

  // Funciones de paginación
  function handlePageChange(newPage: number) {
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

  function handleItemsPerPageChange(newItemsPerPage: number) {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  // Filtros - cuando hay searchResult lo mostramos directamente
  const filteredData = searchResult !== null ? searchResult : bodycams

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
          <h2>GESTIÓN DE DISPOSITIVOS</h2>
          <div className="controls">
            {/* Filtro por tipo de dispositivo */}
            <select
              value={filters.deviceType}
              onChange={e => setFilters(f => ({ ...f, deviceType: e.target.value as DeviceType }))}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.95rem',
                cursor: 'pointer',
                minWidth: '150px'
              }}
            >
              <option value="all">📋 Todos</option>
              <option value="camera">📹 Cámaras</option>
              <option value="sg">🎥 Bodycam SG</option>
              <option value="fisca">🎥 Bodycam FISCA</option>
            </select>

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
                Agregar Dispositivo
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
            ℹ️ Tienes permisos de solo lectura. No puedes crear, editar o eliminar dispositivos.
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
          Cargando dispositivos...
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
                🔍 No se encontró ningún dispositivo con: <strong>{filters.search}</strong>
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Verifica que el nombre, serie o ID sea correcto.
              </p>
            </div>
          )}

          {/* Mensaje cuando se encuentra dispositivo */}
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
                ✅ {filteredData.length} dispositivo(s) encontrado(s)
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
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {/* Botón Primera página */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="btn-secondary"
                  title="Primera página"
                  style={{
                    padding: '8px 12px',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ««
                </button>

                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="btn-secondary"
                  style={{
                    padding: '8px 12px',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ←
                </button>

                {/* Números de página */}
                {pagination.totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center'
                  }}>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum: number;
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
                    padding: '8px 12px',
                    opacity: currentPage === pagination.totalPages ? 0.5 : 1,
                    cursor: currentPage === pagination.totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  →
                </button>

                {/* Botón Última página */}
                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={currentPage === pagination.totalPages}
                  className="btn-secondary"
                  title="Última página"
                  style={{
                    padding: '8px 12px',
                    opacity: currentPage === pagination.totalPages ? 0.5 : 1,
                    cursor: currentPage === pagination.totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  »»
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
