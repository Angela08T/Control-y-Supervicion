import React, { useEffect, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import SubjectTable from '../../components/SubjectTable'
import ModalSubject from '../../components/ModalSubject'
import { getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject, searchSubject } from '../../api/subject'
import { getModulePermissions } from '../../utils/permissions'
import { FiPlus } from 'react-icons/fi'
import { cardClass } from '../../utils/classes'
import PageHeader from '../../components/UI/PageHeader'
import SearchInput from '../../components/UI/SearchInput'
import Button from '../../components/UI/Button'
import Pagination from '../../components/UI/Pagination'
import { EmptyState, LoadingState } from '../../components/UI/EmptyState'
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

  function handleItemsPerPageChange(newItemsPerPage: number) {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  // Filtros - cuando hay searchResult lo mostramos directamente
  const filteredData = searchResult !== null ? searchResult : subjects

  const isEmpty = filteredData.length === 0

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Asuntos"
        description="Agrupan las faltas disciplinarias por tipo de conducta."
        actions={
          permissions.canCreate && (
            <Button icon={<FiPlus aria-hidden />} onClick={() => { setEditItem(null); setShowModal(true) }}>
              Agregar asunto
            </Button>
          )
        }
      >
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
          placeholder="Buscar por nombre o ID"
          loading={isSearching}
        />
      </PageHeader>

      <div className={cardClass}>
        {loading ? (
          <LoadingState label="Cargando asuntos…" />
        ) : isEmpty ? (
          searchResult !== null ? (
            <EmptyState
              title="Sin resultados"
              description={`No hay asuntos que coincidan con “${filters.search}”.`}
            />
          ) : (
            <EmptyState
              title="Aún no hay asuntos"
              description="Agrega el primero con el botón “Agregar asunto”."
            />
          )
        ) : (
          <SubjectTable
            data={filteredData}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEdit}
            startIndex={searchResult !== null ? 0 : pagination.from - 1}
            canEdit={permissions.canEdit}
            canDelete={permissions.canDelete}
          />
        )}

        {/* La paginación se oculta mientras se busca, como antes */}
        {!loading && !isEmpty && searchResult === null && (
          <Pagination
            page={currentPage}
            totalPages={pagination.totalPages}
            total={pagination.total}
            from={pagination.from}
            to={pagination.to}
            perPage={itemsPerPage}
            onPageChange={handlePageChange}
            onPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>

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
