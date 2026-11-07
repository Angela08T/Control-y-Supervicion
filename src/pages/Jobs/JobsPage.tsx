import React, { useEffect, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import JobTable from '../../components/JobTable'
import ModalJob from '../../components/ModalJob'
import { getJobs, getJobById, createJob, updateJob, deleteJob, searchJob } from '../../api/job'
import { getModulePermissions } from '../../utils/permissions'
import { FiPlus } from 'react-icons/fi'
import { toast } from '../../utils/toast'
import { fitCard, fitPage } from '../../utils/classes'
import PageHeader from '@/components/UI/PageHeader'
import SearchInput from '@/components/UI/SearchInput'
import Pagination from '@/components/UI/Pagination'
import Button from '@/components/UI/Button'
import { EmptyState, LoadingState } from '@/components/UI/EmptyState'
import { PAGE_SIZE, usePagedList } from '@/hooks/usePagedList'
import type { CreateJobDto, Job, Paginated, TablePagination } from '@/types'

/** Listado de cargos: `data` paginado (o array plano) y `pagination` opcional. */
interface JobsListResult {
  data?: Paginated<Job> | Job[];
  pagination?: TablePagination;
}

/** Resultado de búsqueda por ID: `{ data, found }`. */
interface JobLookupResult {
  data: Job[];
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

export default function JobsPage() {
  const { role: userRole } = useAppSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'cargos')

  const [jobs, setJobs] = useState<Job[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Job | null>(null)
  const [filters, setFilters] = useState({
    search: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = PAGE_SIZE
  const [pagination, setPagination] = useState<TablePagination>({
    currentPage: 1,
    totalPages: 1,
    perPage: PAGE_SIZE,
    total: 0,
    from: 0,
    to: 0
  })
  const [loading, setLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [searchResult, setSearchResult] = useState<Job[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  // Paginación en el navegador para los resultados de búsqueda (lista completa en memoria)
  const searchPaged = usePagedList(searchResult ?? [], filters.search)

  // Cargar cargos desde la API con paginación
  useEffect(() => {
    async function fetchJobs() {
      setLoading(true)
      try {
        const result: JobsListResult = await getJobs(currentPage, itemsPerPage)

        const jobsData: Job[] = Array.isArray(result.data) ? result.data : result.data?.data || []
        setJobs(jobsData)

        // Manejar paginación si existe, sino usar valores por defecto
        const meta = Array.isArray(result.data) ? undefined : result.data
        if (result.pagination) {
          setPagination(result.pagination)
        } else if (meta?.totalPages) {
          // El backend devuelve el total dentro de `data` (totalCount, totalPages, currentPage)
          const totalCount = meta.totalCount ?? jobsData.length
          setPagination({
            currentPage: meta.currentPage || currentPage,
            totalPages: meta.totalPages || 1,
            perPage: itemsPerPage,
            total: totalCount,
            from: jobsData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0,
            to: Math.min(currentPage * itemsPerPage, totalCount)
          })
        } else {
          // Si no hay paginación, calcular valores básicos
          setPagination({
            currentPage: currentPage,
            totalPages: Math.ceil(jobsData.length / itemsPerPage),
            perPage: itemsPerPage,
            total: jobsData.length,
            from: jobsData.length > 0 ? 1 : 0,
            to: jobsData.length
          })
        }
      } catch (error) {
        toast.error('No se pudieron cargar los cargos')
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [currentPage, itemsPerPage, refreshTrigger])

  // Verificar si el término de búsqueda es un UUID
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  // Buscar cargo por ID o nombre cuando el usuario escribe
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
          // La API tipa esta respuesta como ApiResponse<Job>, pero el adaptador devuelve { data, found }
          const lookup: unknown = await getJobById(searchTerm)
          const result = lookup as JobLookupResult

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
          const response = await searchJob(searchTerm)

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

  // Crear o editar cargo
  async function handleSave(data: CreateJobDto) {
    if (editItem) {
      // Actualizar cargo existente
      try {
        const response: MutationBody = await updateJob(editItem.id, data)

        toast.success(messageOf(response.data) || response.message || 'Cargo actualizado exitosamente')

        setEditItem(null)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        let errorMessage = 'Error al actualizar el cargo'
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
      // Crear nuevo cargo
      try {
        const response: MutationBody = await createJob(data)

        toast.success(messageOf(response.data) || response.message || 'Cargo creado exitosamente')

        setCurrentPage(1)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        let errorMessage = 'Error al crear el cargo'
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

  async function handleToggleStatus(item: Job) {
    const isEnabled = !item.deleted_at
    const action = isEnabled ? 'deshabilitar' : 'habilitar'
    const confirmMessage = isEnabled
      ? '¿Estás seguro de deshabilitar este cargo? Ya no estará disponible para asignación.'
      : '¿Estás seguro de habilitar este cargo? Volverá a estar disponible para asignación.'

    if (!confirm(confirmMessage)) return

    try {
      // El endpoint DELETE hace toggle automáticamente
      const response: MutationBody = await deleteJob(item.id)

      toast.success(messageOf(response.data) || response.message || `Cargo ${action === 'habilitar' ? 'habilitado' : 'deshabilitado'} exitosamente`)

      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      let errorMessage = `Error al ${action} el cargo`
      const err = error as ApiErrorLike

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

  function handleEdit(item: Job) {
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

  // Búsqueda: se muestra la página actual de searchResult; si no, la página del servidor
  const filteredData = searchResult !== null ? searchPaged.pageItems : jobs

  return (
    <div className={fitPage}>
      <PageHeader
        title="Cargos"
        description="Puestos de trabajo que se asignan al personal."
        actions={
          <Button icon={<FiPlus />} onClick={() => { setEditItem(null); setShowModal(true) }}>
            Agregar cargo
          </Button>
        }
      >
        <SearchInput
          value={filters.search}
          onChange={(value) => setFilters((f) => ({ ...f, search: value }))}
          placeholder="Buscar por nombre o ID"
          loading={isSearching}
        />
      </PageHeader>

      <div className={fitCard}>
        {loading ? (
          <LoadingState label="Cargando cargos…" />
        ) : filteredData.length === 0 ? (
          searchResult !== null ? (
            <EmptyState title="Sin resultados" description={`No hay cargos que coincidan con “${filters.search}”.`} />
          ) : (
            <EmptyState title="Aún no hay cargos" description="Agrega el primero con el botón “Agregar cargo”." />
          )
        ) : (
          <JobTable
            data={filteredData}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEdit}
            startIndex={searchResult !== null ? searchPaged.from - 1 : pagination.from - 1}
            canEdit={permissions.canEdit}
            canDelete={permissions.canDelete}
          />
        )}

        {!loading && (searchResult !== null ? (
          searchPaged.total > 0 && (
            <Pagination
              page={searchPaged.page}
              totalPages={searchPaged.totalPages}
              total={searchPaged.total}
              from={searchPaged.from}
              to={searchPaged.to}
              onPageChange={searchPaged.setPage}
            />
          )
        ) : (
          <Pagination
            page={currentPage}
            totalPages={pagination.totalPages}
            total={pagination.total}
            from={pagination.from}
            to={pagination.to}
            onPageChange={handlePageChange}
          />
        ))}
      </div>

      {showModal && (
        <ModalJob
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
