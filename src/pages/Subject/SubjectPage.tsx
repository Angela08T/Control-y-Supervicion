import React, { useEffect, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import SubjectTable from '../../components/SubjectTable'
import ModalSubject from '../../components/ModalSubject'
import { getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject, searchSubject } from '../../api/subject'
import { getModulePermissions } from '../../utils/permissions'
import { FaPlus, FaSearch } from 'react-icons/fa'
import { btnPrimary, btnSecondary, cn, controlsBar, controlsInput, incidenciasPage, pageHeaderIncidencias, pageTitle, tableWrapper } from '../../utils/classes'
import { toast } from '../../utils/toast'
import type {
  ApiMessageResponse,
  ApiResponse,
  CreateSubjectDto,
  Subject,
  TablePagination,
} from '@/types'

/** Respuesta de mutación: el código lee `message` en la raíz o dentro de `data`. */
type SubjectMutationResponse = ApiResponse<Subject> & { data: Subject & { message?: string } }

/** Respuesta de DELETE: el código lee `message` en la raíz o dentro de `data`. */
type SubjectDeleteResponse = ApiMessageResponse & { data?: { message?: string } }

/** Forma mínima del error de Axios que leen los catch de esta página. */
interface RequestErrorLike {
  message?: string
  response?: { data?: { message?: string | string[] } }
}

export default function SubjectPage() {
  const { role: userRole } = useAppSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'asuntos')

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Subject | null>(null)
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
  const [searchResult, setSearchResult] = useState<Subject[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Cargar asuntos desde la API con paginación
  useEffect(() => {
    async function fetchSubjects() {
      setLoading(true)
      try {
        const result = await getSubjects(currentPage, itemsPerPage)

        const subjectsData = result.data?.data || result.data || []
        setSubjects(subjectsData)

        // Manejar paginación si existe
        if (result.data?.totalPages) {
          setPagination({
            currentPage: result.data.currentPage || currentPage,
            totalPages: result.data.totalPages || 1,
            perPage: itemsPerPage,
            total: result.data.totalCount || subjectsData.length,
            from: subjectsData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0,
            to: Math.min(currentPage * itemsPerPage, result.data.totalCount || subjectsData.length)
          })
        } else {
          // Si no hay paginación, calcular valores básicos
          setPagination({
            currentPage: currentPage,
            totalPages: Math.ceil(subjectsData.length / itemsPerPage),
            perPage: itemsPerPage,
            total: subjectsData.length,
            from: subjectsData.length > 0 ? 1 : 0,
            to: subjectsData.length
          })
        }
      } catch (error) {
        toast.error('No se pudo cargar los asuntos')
      } finally {
        setLoading(false)
      }
    }

    fetchSubjects()
  }, [currentPage, itemsPerPage, refreshTrigger])

  // Verificar si el término de búsqueda es un UUID
  const isUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  // Buscar asuntos por ID o nombre cuando el usuario escribe
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
          // GET /subject/:id devuelve un solo asunto en `data`
          const result = await getSubjectById(searchTerm)

          if (result.data) {
            setSearchResult([result.data])
          } else {
            setSearchResult([])
          }
        } catch (error) {
          // El backend responde 400 cuando el asunto no existe
          setSearchResult([])
        } finally {
          setIsSearching(false)
        }
      }

      searchById()
    } else {
      // Si NO es UUID, buscar por nombre
      const searchByName = async () => {
        setIsSearching(true)
        try {
          const response = await searchSubject(searchTerm)

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

  // Crear o editar asunto
  async function handleSave(data: CreateSubjectDto) {
    if (editItem) {
      // Actualizar asunto existente
      try {
        const response = (await updateSubject(editItem.id, data)) as SubjectMutationResponse

        toast.success(response.data?.message || response.message || 'Asunto actualizado exitosamente')

        setEditItem(null)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        const err = error as RequestErrorLike
        let errorMessage = 'Error al actualizar el asunto'

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
      // Crear nuevo asunto
      try {
        const response = (await createSubject(data)) as SubjectMutationResponse

        toast.success(response.data?.message || response.message || 'Asunto creado exitosamente')

        setCurrentPage(1)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        const err = error as RequestErrorLike
        let errorMessage = 'Error al crear el asunto'

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

  async function handleToggleStatus(item: Subject) {
    const isEnabled = !item.deleted_at
    const action = isEnabled ? 'deshabilitar' : 'habilitar'
    const confirmMessage = isEnabled
      ? '¿Estás seguro de deshabilitar este asunto? Ya no estará disponible para asignación.'
      : '¿Estás seguro de habilitar este asunto? Volverá a estar disponible para asignación.'

    if (!confirm(confirmMessage)) return

    try {
      // El endpoint DELETE hace toggle automáticamente
      const response = (await deleteSubject(item.id)) as SubjectDeleteResponse

      toast.success(response.data?.message || response.message || `Asunto ${action === 'habilitar' ? 'habilitado' : 'deshabilitado'} exitosamente`)

      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      const err = error as RequestErrorLike
      let errorMessage = `Error al ${action} el asunto`

      if (err.response?.data?.message) {
        errorMessage = Array.isArray(err.response.data.message)
          ? err.response.data.message.join('\n')
          : err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }

      toast.error(errorMessage)
    }
  }

  function handleEdit(item: Subject) {
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
  const filteredData = searchResult !== null ? searchResult : subjects

  return (
    <div className={incidenciasPage}>
      <header className={cn(pageHeaderIncidencias, 'border-t-0 border-x-0')}>
        <div className="flex flex-1 items-center gap-5">
          <h2 className={pageTitle}>GESTIÓN DE ASUNTOS</h2>
          <div className={cn(controlsBar, 'max-[900px]:flex-wrap max-[900px]:justify-between max-[900px]:gap-2')}>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Buscar por nombre o ID"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
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
                Agregar Asunto
              </button>
            )}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="p-10 text-center text-[1.1rem] text-muted">
          Cargando asuntos...
        </div>
      ) : (
        <div className={tableWrapper}>
          {/* Mensaje cuando se busca pero no se encuentra */}
          {searchResult !== null && searchResult.length === 0 && !isSearching && (
            <div className="mb-5 rounded-lg border-2 border-dashed border-line bg-card p-[30px] text-center">
              <p className="m-0 text-[1.1rem] text-content-2">
                🔍 No se encontró ningún asunto con: <strong>{filters.search}</strong>
              </p>
              <p className="mt-2 text-[0.9rem] text-muted">
                Verifica que el nombre o ID sea correcto.
              </p>
            </div>
          )}

          {/* Mensaje cuando se encuentra asunto */}
          {searchResult !== null && searchResult.length > 0 && (
            <div className="mb-[15px] rounded-lg border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] p-3 text-center">
              <p className="m-0 text-[0.95rem] font-medium text-success">
                ✅ {searchResult.length} asunto(s) encontrado(s)
              </p>
            </div>
          )}

          <SubjectTable
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
        <ModalSubject
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
