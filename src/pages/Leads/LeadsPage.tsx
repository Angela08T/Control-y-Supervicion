import React, { useEffect, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import LeadTable from '../../components/LeadTable'
import ModalLead from '../../components/ModalLead'
import { getLeads, getLeadById, createLead, updateLead, deleteLead, searchLead } from '../../api/lead'
import { getModulePermissions } from '../../utils/permissions'
import { FaPlus, FaSearch } from 'react-icons/fa'
import { toast } from '../../utils/toast'
import { btnPrimary, cn, controlsBar, controlsInput, incidenciasPage, pageHeaderIncidencias, pageTitle, tableWrapper } from '../../utils/classes'
import type { CreateLeadDto, Lead, Paginated, TablePagination } from '@/types'

/** Listado de personal: `data` paginado (o array plano) y `pagination` opcional. */
interface LeadsListResult {
  data?: Paginated<Lead> | Lead[];
  pagination?: TablePagination;
}

/** Resultado de búsqueda por ID: `{ data, found }`. */
interface LeadLookupResult {
  data: Lead[];
  found: boolean;
}

/** Cuerpo de respuesta de mutaciones (`message` y `data` opcionales). */
interface MutationBody {
  message?: string;
  data?: unknown;
}

/** Forma mínima del error (Axios / Error) que se lee en los catch. */
interface ApiErrorLike {
  response?: { data?: { message?: string | string[] } };
  message?: string;
}

/** Lee `message` de un valor desconocido (equivale a `value?.message`). */
const messageOf = (value: unknown): string | undefined => {
  if (typeof value !== 'object' || value === null) return undefined
  return (value as { message?: string }).message
}

// Clases propias de esta vista (buscador, mensajes, paginación)
const headerLeft = 'flex flex-1 items-center gap-5'
const searchIcon = 'absolute top-1/2 left-3 -translate-y-1/2'
const searchSpinner = 'absolute top-1/2 right-3 -translate-y-1/2 text-primary'
const searchInput = 'pl-[35px]! max-[900px]:flex-[1_1_100%] min-[601px]:max-[900px]:min-w-0'
const tableContainer = cn(tableWrapper, '[&::-webkit-scrollbar-thumb]:[border:2px_solid_var(--bg)]')
const loadingText = 'p-10 text-center text-[1.1rem] text-muted'
const emptyBanner = 'mb-5 rounded-lg border-2 border-dashed border-line bg-card p-[30px] text-center'
const emptyTitle = 'm-0 text-[1.1rem] text-content-2'
const emptyHint = 'mt-2 text-[0.9rem] text-muted'
const foundBanner = 'mb-[15px] rounded-lg border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] p-3 text-center'
const foundText = 'm-0 text-[0.95rem] font-medium text-success'
const paginationBar = 'mt-5 flex flex-wrap items-center justify-between gap-[15px] rounded-lg border border-line bg-transparent p-5'
const paginationLeft = 'flex flex-wrap items-center gap-5'
const rowCount = 'text-[0.95rem] font-medium'
const perPageWrap = 'flex items-center gap-2'
const perPageLabel = 'text-[0.9rem] text-muted'
const perPageSelect = 'cursor-pointer rounded-[4px] border border-line [background:var(--bg)] px-3 py-1.5 text-[0.9rem] [color:inherit]'
const pagesRight = 'flex items-center gap-2.5'
const navButton = 'flex items-center gap-[5px] rounded-[10px] border-2 border-[#6b7280] bg-[#f3f4f6] px-4 py-2 text-[14px] font-semibold text-[#374151] [transition:all_0.3s_ease] hover:-translate-y-[2px] hover:border-[#1e3a8a] hover:bg-[#e5e7eb] hover:text-[#1e3a8a]'
const pageNumber = 'min-w-10 cursor-pointer rounded-[4px] border px-3 py-2'
const pageNumberActive = 'border-primary bg-primary font-bold text-white'
const pageNumberIdle = 'border-line bg-transparent font-normal [color:inherit]'
const onlyPage = 'min-w-10 rounded-[4px] border border-primary bg-primary px-3 py-2 text-center font-bold text-white'

export default function LeadsPage() {
  const { role: userRole } = useAppSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'personal')

  const [leads, setLeads] = useState<Lead[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Lead | null>(null)
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
  const [searchResult, setSearchResult] = useState<Lead[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Cargar personal desde la API con paginación
  useEffect(() => {
    async function fetchLeads() {
      setLoading(true)
      try {
        const result: LeadsListResult = await getLeads(currentPage, itemsPerPage)

        const leadsData: Lead[] = Array.isArray(result.data) ? result.data : result.data?.data || []
        setLeads(leadsData)

        // Manejar paginación si existe, sino usar valores por defecto
        if (result.pagination) {
          setPagination(result.pagination)
        } else {
          // Si no hay paginación, calcular valores básicos
          setPagination({
            currentPage: currentPage,
            totalPages: Math.ceil(leadsData.length / itemsPerPage),
            perPage: itemsPerPage,
            total: leadsData.length,
            from: leadsData.length > 0 ? 1 : 0,
            to: leadsData.length
          })
        }
      } catch (error) {
        toast.error('No se pudo cargar el personal')
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [currentPage, itemsPerPage, refreshTrigger])

  // Verificar si el término de búsqueda es un UUID
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  // Buscar personal por ID o nombre cuando el usuario escribe
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
          // La API tipa esta respuesta como ApiResponse<Lead>, pero el adaptador devuelve { data, found }
          const lookup: unknown = await getLeadById(searchTerm)
          const result = lookup as LeadLookupResult

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
      // Si NO es UUID, buscar por nombre en toda la base de datos
      const searchByName = async () => {
        setIsSearching(true)
        try {
          const response = await searchLead(searchTerm)

          // La API devuelve los datos en response.data?.data
          const results = response?.data?.data || []

          if (results.length > 0) {
            setSearchResult(results)
          } else {
            setSearchResult([])
          }
        } catch (error) {
          setSearchResult(null)
        } finally {
          setIsSearching(false)
        }
      }

      searchByName()
    }
  }, [filters.search])

  // Crear o editar personal
  async function handleSave(data: CreateLeadDto) {
    if (editItem) {
      // Actualizar personal existente
      try {
        const response: MutationBody = await updateLead(editItem.id, data)

        toast.success(messageOf(response.data) || response.message || 'Personal actualizado exitosamente')

        setEditItem(null)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        let errorMessage = 'Error al actualizar el personal'
        const err = error as ApiErrorLike

        if (err.response?.data?.message) {
          errorMessage = Array.isArray(err.response.data.message)
            ? 'Errores de validación:\n' + err.response.data.message.join('\n')
            : err.response.data.message
        } else if (err.message) {
          errorMessage = err.message
        }

        toast.error(errorMessage)
      }
    } else {
      // Crear nuevo personal
      try {
        const response: MutationBody = await createLead(data)

        toast.success(messageOf(response.data) || response.message || 'Personal creado exitosamente')

        setCurrentPage(1)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        let errorMessage = 'Error al crear el personal'
        const err = error as ApiErrorLike

        if (err.response?.data?.message) {
          errorMessage = Array.isArray(err.response.data.message)
            ? 'Errores de validación:\n' + err.response.data.message.join('\n')
            : err.response.data.message
        } else if (err.message) {
          errorMessage = err.message
        }

        toast.error(errorMessage)
      }
    }
  }

  async function handleToggleStatus(item: Lead) {
    const isEnabled = !item.deleted_at
    const action = isEnabled ? 'deshabilitar' : 'habilitar'
    const confirmMessage = isEnabled
      ? '¿Estás seguro de deshabilitar este personal? Ya no estará disponible para asignación.'
      : '¿Estás seguro de habilitar este personal? Volverá a estar disponible para asignación.'

    if (!confirm(confirmMessage)) return

    try {
      // El endpoint DELETE hace toggle automáticamente
      const response: MutationBody = await deleteLead(item.id)

      toast.success(messageOf(response.data) || response.message || `Personal ${action === 'habilitar' ? 'habilitado' : 'deshabilitado'} exitosamente`)

      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      let errorMessage = `Error al ${action} el personal`
      const err = error as ApiErrorLike

      if (err.response?.data?.message) {
        errorMessage = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(', ')
          : err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }

      toast.error(errorMessage)
    }
  }

  function handleEdit(item: Lead) {
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
  const filteredData = searchResult !== null ? searchResult : leads

  return (
    <div className={incidenciasPage}>
      <header className={pageHeaderIncidencias}>
        <div className={headerLeft}>
          <h2 className={pageTitle}>GESTIÓN DE PERSONAL</h2>
          <div className={controlsBar}>
            <div className="relative">
              <FaSearch className={searchIcon} />
              <input
                placeholder="Buscar por nombre o ID"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className={cn(controlsInput, searchInput, isSearching ? 'pr-[35px]!' : 'pr-3!')}
              />
              {isSearching && (
                <div className={searchSpinner}>
                  ⏳
                </div>
              )}
            </div>

            <button className={btnPrimary} onClick={() => { setEditItem(null); setShowModal(true) }}>
              <FaPlus className="mr-2" />
              Agregar Personal
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className={loadingText}>
          Cargando personal...
        </div>
      ) : (
        <div className={tableContainer}>
          {/* Mensaje cuando se busca pero no se encuentra */}
          {searchResult !== null && searchResult.length === 0 && !isSearching && (
            <div className={emptyBanner}>
              <p className={emptyTitle}>
                🔍 No se encontró ningún personal con: <strong>{filters.search}</strong>
              </p>
              <p className={emptyHint}>
                Verifica que el nombre o ID sea correcto.
              </p>
            </div>
          )}

          {/* Mensaje cuando se encuentra personal */}
          {searchResult !== null && searchResult.length > 0 && (
            <div className={foundBanner}>
              <p className={foundText}>
                ✅ {searchResult.length} persona(s) encontrada(s)
              </p>
            </div>
          )}

          <LeadTable
            data={filteredData}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEdit}
            startIndex={searchResult !== null ? 0 : pagination.from - 1}
            canEdit={permissions.canEdit}
            canDelete={permissions.canDelete}
          />

          {/* Controles de paginación (ocultar cuando se busca) */}
          {searchResult === null && (
            <div className={paginationBar}>
              {/* Lado izquierdo: Contador y selector */}
              <div className={paginationLeft}>
                <div className={rowCount}>
                  {pagination.from}-{pagination.to} de {pagination.total}
                </div>

                {/* Selector de items por página */}
                <div className={perPageWrap}>
                  <label className={perPageLabel}>
                    Mostrar:
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className={perPageSelect}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Lado derecho: Botones de navegación */}
              <div className={pagesRight}>
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={cn(navButton, currentPage === 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}
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
                          className={cn(pageNumber, currentPage === pageNum ? pageNumberActive : pageNumberIdle)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Indicador de página actual si solo hay 1 página */}
                {pagination.totalPages === 1 && (
                  <div className={onlyPage}>
                    1
                  </div>
                )}

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === pagination.totalPages}
                  className={cn(navButton, currentPage === pagination.totalPages ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <ModalLead
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
