import React, { useEffect, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import OffenderTable from '../../components/OffenderTable'
import type { OffenderRow } from '../../components/OffenderTable'
import ModalOffender from '../../components/ModalOffender'
import type { OffenderFormData } from '../../components/ModalOffender'
import { getOffenders, getOffenderByDni, createOffender, updateOffender, deleteOffender } from '../../api/offender'
import { getModulePermissions } from '../../utils/permissions'
import { FaPlus, FaSearch } from 'react-icons/fa'
import { btnPrimary, btnSecondary, cn, controlsBar, controlsInput, incidenciasPage, pageHeaderIncidencias, pageTitle, tableWrapper } from '../../utils/classes'
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
    <div className={incidenciasPage}>
      <header className={cn(pageHeaderIncidencias, 'border-t-0 border-x-0')}>
        <div className="flex flex-1 items-center gap-5">
          <h2 className={pageTitle}>GESTIÓN DE INFRACTORES</h2>
          <div className={cn(controlsBar, 'max-[900px]:flex-wrap max-[900px]:justify-between max-[900px]:gap-2')}>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Buscar por DNI (8 dígitos)"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                maxLength={8}
                className={cn(
                  controlsInput,
                  'max-[900px]:min-w-0 max-[900px]:flex-[1_1_100%] pl-[35px]!',
                  isSearching ? 'pr-[35px]!' : 'pr-3!'
                )}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                  ⏳
                </div>
              )}
            </div>

            {permissions.canCreate && (
              <button className={btnPrimary} onClick={() => { setEditItem(null); setShowModal(true) }}>
                <FaPlus className="mr-2" />
                Agregar Infractor
              </button>
            )}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="p-10 text-center text-[1.1rem] text-muted">
          Cargando infractores...
        </div>
      ) : (
        <div className={tableWrapper}>
          {/* Mensaje cuando se busca pero no se encuentra */}
          {searchResult !== null && searchResult.length === 0 && !isSearching && (
            <div className="mb-5 rounded-lg border-2 border-dashed border-line bg-card p-[30px] text-center">
              <p className="m-0 text-[1.1rem] text-content-2">
                🔍 No se encontró ningún infractor con DNI: <strong>{filters.search}</strong>
              </p>
              <p className="mt-2 text-[0.9rem] text-muted">
                Verifica que el DNI sea correcto (8 dígitos).
              </p>
            </div>
          )}

          {/* Mensaje cuando se encuentra infractor */}
          {searchResult !== null && searchResult.length > 0 && (
            <div className="mb-[15px] rounded-lg border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] p-3 text-center">
              <p className="m-0 text-[0.95rem] font-medium text-success">
                ✅ Infractor encontrado
              </p>
            </div>
          )}

          {/* Mensaje informativo para supervisor */}
          {!permissions.canCreate && (
            <div className="mb-[15px] rounded-lg border border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.1)] p-3 text-center">
              <p className="m-0 text-[0.9rem] text-warning">
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
            <div className="mt-5 flex flex-wrap items-center justify-between gap-[15px] rounded-lg border border-line p-5">
              {/* Lado izquierdo: Contador y selector */}
              <div className="flex flex-wrap items-center gap-5">
                <div className="text-[0.95rem] font-medium">
                  {pagination.from}-{pagination.to} de {pagination.total}
                </div>

                {/* Selector de items por página */}
                <div className="flex items-center gap-2">
                  <label className="text-[0.9rem] text-muted">
                    Mostrar:
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="cursor-pointer rounded border border-line px-3 py-1.5 text-[0.9rem] [background:var(--bg)] [color:inherit]"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Lado derecho: Botones de navegación */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={cn(btnSecondary, 'flex items-center gap-[5px] px-4! py-2! disabled:cursor-not-allowed disabled:opacity-50')}
                >
                  ← Anterior
                </button>

                {/* Números de página */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center gap-[5px]">
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
                          className={cn(
                            'min-w-[40px] cursor-pointer rounded border px-3 py-2',
                            currentPage === pageNum
                              ? 'border-primary bg-primary font-bold text-white'
                              : 'border-line bg-transparent font-normal [color:inherit]'
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Indicador de página actual si solo hay 1 página */}
                {pagination.totalPages === 1 && (
                  <div className="min-w-[40px] rounded border border-primary bg-primary px-3 py-2 text-center font-bold text-white">
                    1
                  </div>
                )}

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === pagination.totalPages}
                  className={cn(btnSecondary, 'flex items-center gap-[5px] px-4! py-2! disabled:cursor-not-allowed disabled:opacity-50')}
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
