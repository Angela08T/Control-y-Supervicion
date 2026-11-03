import React, { useEffect, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import BodycamTable, { type BodycamTableRow } from '../../components/BodycamTable'
import ModalBodycam from '../../components/ModalBodycam'
import { getBodycams, getBodycamById, createBodycam, updateBodycam, deleteBodycam, searchBodycam } from '../../api/bodycam'
import { getModulePermissions } from '../../utils/permissions'
import { FaPlus, FaSearch } from 'react-icons/fa'
import { toast } from '../../utils/toast'
import type { BodycamView, CreateBodycamDto, TablePagination } from '@/types'
import {
  btnPrimary,
  btnSecondary,
  cn,
  controlsBar,
  controlsInput,
  incidenciasPage,
  pageHeaderIncidencias,
  pageTitle,
  tableWrapper
} from '../../utils/classes'

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

/** Ajustes de .controls a ancho tablet (<=900px) que no incluyen las constantes compartidas */
const controlsBarResponsive = cn(controlsBar, 'max-[900px]:flex-wrap max-[900px]:justify-between max-[900px]:gap-2')
const controlsInputResponsive = cn(controlsInput, 'max-[900px]:flex-[1_1_100%] max-[900px]:min-w-0')

/** Select de filtro del encabezado (el borde y el padding inline del original anulan el hover/focus de .controls select) */
const deviceSelect = cn(
  'max-w-[200px] max-[900px]:flex-[1_1_100%] overflow-hidden text-ellipsis whitespace-nowrap',
  'cursor-pointer rounded-[8px] border border-line [background:var(--bg)] px-3 py-2 min-w-[150px]',
  'text-[15.2px] text-content! outline-none [backdrop-filter:blur(5px)] transition-all duration-300',
  'hover:shadow-[0_0_0_3px_rgba(30,58,138,0.1)] focus:-translate-y-0.5 focus:shadow-[0_0_0_4px_rgba(30,58,138,0.15)] dark:text-[#f8fafc]!'
)

/** Boton de pagina numerica (activo / inactivo) */
const pageButton = (active: boolean) =>
  cn(
    'min-w-10 cursor-pointer rounded-[4px] border px-3 py-2',
    active ? 'border-primary bg-primary font-bold text-white' : 'border-line bg-transparent font-normal [color:inherit]'
  )

/** Botones primera / anterior / siguiente / ultima de la paginacion */
const navButton = cn(btnSecondary, 'px-3! py-2! disabled:cursor-not-allowed disabled:opacity-50')

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
    <div className={incidenciasPage}>
      <header className={pageHeaderIncidencias}>
        <div className="flex flex-1 items-center gap-5">
          <h2 className={pageTitle}>GESTIÓN DE DISPOSITIVOS</h2>
          <div className={controlsBarResponsive}>
            {/* Filtro por tipo de dispositivo */}
            <select
              className={deviceSelect}
              value={filters.deviceType}
              onChange={e => setFilters(f => ({ ...f, deviceType: e.target.value as DeviceType }))}
            >
              <option value="all">📋 Todos</option>
              <option value="camera">📹 Cámaras</option>
              <option value="sg">🎥 Bodycam SG</option>
              <option value="fisca">🎥 Bodycam FISCA</option>
            </select>

            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className={cn(controlsInputResponsive, 'pl-[35px]!', isSearching ? 'pr-[35px]!' : 'pr-3!')}
                placeholder="Buscar por nombre, serie o ID"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
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
                Agregar Dispositivo
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mensaje informativo para roles con permisos de solo lectura */}
      {!permissions.canCreate && permissions.canView && (
        <div className="m-5 rounded-[8px] border border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.1)] p-3 text-center">
          <p className="m-0 text-[14.4px] text-[#3b82f6]">
            ℹ️ Tienes permisos de solo lectura. No puedes crear, editar o eliminar dispositivos.
          </p>
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center text-[17.6px] text-muted">
          Cargando dispositivos...
        </div>
      ) : (
        <div className={tableWrapper}>
          {/* Mensaje cuando se busca pero no se encuentra */}
          {searchResult !== null && searchResult.length === 0 && !isSearching && (
            <div className="mb-5 rounded-[8px] border-2 border-dashed border-line bg-card p-[30px] text-center">
              <p className="m-0 text-[17.6px] text-content-2">
                🔍 No se encontró ningún dispositivo con: <strong>{filters.search}</strong>
              </p>
              <p className="mt-2 text-[14.4px] text-muted">
                Verifica que el nombre, serie o ID sea correcto.
              </p>
            </div>
          )}

          {/* Mensaje cuando se encuentra dispositivo */}
          {searchResult !== null && searchResult.length > 0 && (
            <div className="mb-[15px] rounded-[8px] border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] p-3 text-center">
              <p className="m-0 text-[15.2px] font-medium text-success">
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
            <div className="mt-5 flex flex-wrap items-center justify-between gap-[15px] rounded-[8px] border border-line p-5">
              {/* Lado izquierdo: Contador y selector */}
              <div className="flex flex-wrap items-center gap-5">
                <div className="text-[15.2px] font-medium">
                  {pagination.from}-{pagination.to} de {pagination.total}
                </div>

                {/* Selector de items por página */}
                <div className="flex items-center gap-2">
                  <label className="text-[14.4px] text-muted">
                    Mostrar:
                  </label>
                  <select
                    className="cursor-pointer rounded-[4px] border border-line [background:var(--bg)] px-3 py-1.5 text-[14.4px] [color:inherit]"
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Lado derecho: Botones de navegación */}
              <div className="flex items-center gap-1.5">
                {/* Botón Primera página */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={navButton}
                  title="Primera página"
                >
                  ««
                </button>

                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={navButton}
                >
                  ←
                </button>

                {/* Números de página */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center gap-1">
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
                          className={pageButton(currentPage === pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Indicador de página actual si solo hay 1 página */}
                {pagination.totalPages === 1 && (
                  <div className="min-w-10 rounded-[4px] border border-primary bg-primary px-3 py-2 text-center font-bold text-white">
                    1
                  </div>
                )}

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === pagination.totalPages}
                  className={navButton}
                >
                  →
                </button>

                {/* Botón Última página */}
                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={currentPage === pagination.totalPages}
                  className={navButton}
                  title="Última página"
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
