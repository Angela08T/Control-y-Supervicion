import React, { useEffect, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import OffenderTable from '../../components/OffenderTable'
import type { OffenderRow } from '../../components/OffenderTable'
import ModalOffender from '../../components/ModalOffender'
import type { OffenderFormData } from '../../components/ModalOffender'
import { getOffenders, getOffenderByDni, createOffender, updateOffender, deleteOffender } from '../../api/offender'
import { getModulePermissions } from '../../utils/permissions'
import { FaPlus, FaSearch } from 'react-icons/fa'
import { useNotification } from '../../context/NotificationContext'
import ConfirmModal from '../../components/ConfirmModal'
import { toast } from '../../utils/toast'
import type {
  ApiMessageResponse,
  ApiResponse,
  CreateOffenderDto,
  Offender,
  OffenderEntity,
  TablePagination,
} from '@/types'

/** Respuesta de mutación: el código lee `message` en la raíz o dentro de `data`. */
type OffenderMutationResponse = ApiResponse<OffenderEntity> & { data: OffenderEntity & { message?: string } }

/** Respuesta de DELETE: el código lee `message` en la raíz o dentro de `data`. */
type OffenderDeleteResponse = ApiMessageResponse & { data?: { message?: string } }

/** Forma mínima del error de Axios que leen los catch de esta página. */
interface RequestErrorLike {
  message?: string
  response?: { status?: number; data?: { message?: string | string[] } }
}

/** Respuesta de GET /offender/dni/:dni: el backend puede anidar `data` dentro de `data`. */
interface OffenderDniBody {
  data?: OffenderRow | OffenderRow[] | null
}

interface OffenderDniEnvelope {
  data?: OffenderRow | OffenderRow[] | null
}

/** Estado del modal de confirmación de habilitar/deshabilitar. */
interface ConfirmState {
  isOpen: boolean
  item: OffenderRow | null
  message?: string
  action?: string
}

export default function OffenderPage() {
  const { role: userRole } = useAppSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'offenders')
  const { showSuccess, showError } = useNotification()

  const [offenders, setOffenders] = useState<OffenderRow[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<OffenderRow | null>(null)
  const [filters, setFilters] = useState({
    search: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [pagination, setPagination] = useState<TablePagination>({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
    from: 0,
    to: 0
  })
  const [loading, setLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [searchResult, setSearchResult] = useState<OffenderRow[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [confirmModal, setConfirmModal] = useState<ConfirmState>({ isOpen: false, item: null })

  // Cargar infractores desde la API con paginación
  useEffect(() => {
    async function fetchOffenders() {
      setLoading(true)
      try {
        const result = await getOffenders(currentPage, itemsPerPage)

        const offendersData = (result.data?.data || result.data || []) as Offender[]
        setOffenders(offendersData)

        // Manejar paginación si existe
        if (result.data?.totalPages) {
          setPagination({
            currentPage: result.data.currentPage || currentPage,
            totalPages: result.data.totalPages || 1,
            perPage: itemsPerPage,
            total: result.data.totalCount || offendersData.length,
            from: offendersData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0,
            to: Math.min(currentPage * itemsPerPage, result.data.totalCount || offendersData.length)
          })
        } else {
          // Si no hay paginación, calcular valores básicos
          setPagination({
            currentPage: currentPage,
            totalPages: Math.ceil(offendersData.length / itemsPerPage),
            perPage: itemsPerPage,
            total: offendersData.length,
            from: offendersData.length > 0 ? 1 : 0,
            to: offendersData.length
          })
        }
      } catch (error) {
        toast.error('No se pudo cargar los infractores')
      } finally {
        setLoading(false)
      }
    }

    fetchOffenders()
  }, [currentPage, itemsPerPage, refreshTrigger])

  // Verificar si el término de búsqueda es un DNI válido (8 dígitos)
  const isValidDNI = (str: string) => {
    return /^\d{8}$/.test(str)
  }

  // Buscar infractor por DNI cuando el usuario escribe
  useEffect(() => {
    const searchTerm = filters.search.trim()

    // Si no hay término de búsqueda, limpiar resultados
    if (!searchTerm) {
      setSearchResult(null)
      return
    }

    // Si es un DNI válido (8 dígitos), buscar por DNI
    if (isValidDNI(searchTerm)) {
      const searchByDNI = async () => {
        setIsSearching(true)
        try {
          const body = (await getOffenderByDni(searchTerm)) as unknown as OffenderDniBody

          // El backend puede devolver la data en diferentes estructuras
          const resultData = (body.data as OffenderDniEnvelope | null | undefined)?.data || body.data || []
          const dataArray = Array.isArray(resultData) ? resultData : [resultData]

          if (dataArray.length > 0 && dataArray[0]) {
            setSearchResult(dataArray)
          } else {
            setSearchResult([])
          }
        } catch (error) {
          // Si el error es 404, significa que no se encontró
          if ((error as RequestErrorLike).response?.status === 404) {
            setSearchResult([])
          } else {
            setSearchResult(null)
          }
        } finally {
          setIsSearching(false)
        }
      }

      searchByDNI()
    }
  }, [filters.search])

  // Crear o editar infractor
  async function handleSave(data: OffenderFormData) {
    if (editItem) {
      // Actualizar infractor existente
      try {
        const response = (await updateOffender(editItem.id, data)) as OffenderMutationResponse

        showSuccess(response.data?.message || response.message || 'Infractor actualizado exitosamente')

        setEditItem(null)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {

        const err = error as RequestErrorLike
        let errorMessage = 'Error al actualizar el infractor'

        if (err.response?.data?.message) {
          errorMessage = Array.isArray(err.response.data.message)
            ? 'Errores de validación: ' + err.response.data.message.join(', ')
            : err.response.data.message
        } else if (err.message) {
          errorMessage = err.message
        }

        showError(errorMessage)
      }
    } else {
      // Crear nuevo infractor
      try {
        const response = (await createOffender(data as CreateOffenderDto)) as OffenderMutationResponse

        showSuccess(response.data?.message || response.message || 'Infractor creado exitosamente')

        setCurrentPage(1)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {

        const err = error as RequestErrorLike
        let errorMessage = 'Error al crear el infractor'

        if (err.response?.data?.message) {
          errorMessage = Array.isArray(err.response.data.message)
            ? 'Errores de validación: ' + err.response.data.message.join(', ')
            : err.response.data.message
        } else if (err.message) {
          errorMessage = err.message
        }

        showError(errorMessage)
      }
    }
  }

  async function handleToggleStatus(item: OffenderRow) {
    const isEnabled = !item.deleted_at
    const action = isEnabled ? 'deshabilitar' : 'habilitar'
    const confirmMessage = isEnabled
      ? '¿Estás seguro de deshabilitar este infractor? Ya no estará disponible para asignación.'
      : '¿Estás seguro de habilitar este infractor? Volverá a estar disponible para asignación.'

    setConfirmModal({
      isOpen: true,
      item,
      message: confirmMessage,
      action
    })
  }

  async function confirmToggleStatus() {
    const { item, action } = confirmModal

    try {
      if (!item) throw new Error('No se seleccionó ningún infractor')
      // El endpoint DELETE hace toggle automáticamente
      const response = (await deleteOffender(item.id)) as OffenderDeleteResponse

      showSuccess(response.data?.message || response.message || `Infractor ${action === 'habilitar' ? 'habilitado' : 'deshabilitado'} exitosamente`)

      setRefreshTrigger(prev => prev + 1)
    } catch (error) {

      const err = error as RequestErrorLike
      let errorMessage = `Error al ${action} el infractor`

      if (err.response?.data?.message) {
        errorMessage = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(', ')
          : err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }

      showError(errorMessage)
    } finally {
      setConfirmModal({ isOpen: false, item: null })
    }
  }

  function handleEdit(item: OffenderRow) {
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
  const filteredData = searchResult !== null ? searchResult : offenders

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
          <h2>GESTIÓN DE INFRACTORES</h2>
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
                placeholder="Buscar por DNI (8 dígitos)"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                maxLength={8}
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
                Agregar Infractor
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
          Cargando infractores...
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
                🔍 No se encontró ningún infractor con DNI: <strong>{filters.search}</strong>
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Verifica que el DNI sea correcto (8 dígitos).
              </p>
            </div>
          )}

          {/* Mensaje cuando se encuentra infractor */}
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
                ✅ Infractor encontrado
              </p>
            </div>
          )}

          {/* Mensaje informativo para supervisor */}
          {!permissions.canCreate && (
            <div style={{
              textAlign: 'center',
              padding: '12px',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              borderRadius: '8px',
              marginBottom: '15px',
              border: '1px solid rgba(251, 191, 36, 0.3)'
            }}>
              <p style={{ fontSize: '0.9rem', color: '#f59e0b', margin: '0' }}>
                ⚠️ Como Supervisor, solo puedes visualizar los infractores registrados
              </p>
            </div>
          )}

          <OffenderTable
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
        <ModalOffender
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleSave}
        />
      )}

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.action === 'habilitar' ? 'Confirmar Habilitación' : 'Confirmar Deshabilitación'}
        message={confirmModal.message ?? ''}
        type={confirmModal.action === 'habilitar' ? 'info' : 'warning'}
        onConfirm={confirmToggleStatus}
        onCancel={() => setConfirmModal({ isOpen: false, item: null })}
        confirmText={confirmModal.action === 'habilitar' ? 'Habilitar' : 'Deshabilitar'}
        cancelText="Cancelar"
      />
    </div>
  )
}
