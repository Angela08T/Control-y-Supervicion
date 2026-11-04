import React, { useEffect, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import LeadTable from '../../components/LeadTable'
import ModalLead from '../../components/ModalLead'
import { getLeads, getLeadById, createLead, updateLead, deleteLead, searchLead } from '../../api/lead'
import { getModulePermissions } from '../../utils/permissions'
import { FiPlus } from 'react-icons/fi'
import { toast } from '../../utils/toast'
import { cardClass } from '../../utils/classes'
import PageHeader from '@/components/UI/PageHeader'
import SearchInput from '@/components/UI/SearchInput'
import Pagination from '@/components/UI/Pagination'
import Button from '@/components/UI/Button'
import { EmptyState, LoadingState } from '@/components/UI/EmptyState'
import { PAGE_SIZE, usePagedList } from '@/hooks/usePagedList'
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
  const [searchResult, setSearchResult] = useState<Lead[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  // Paginación en el navegador para los resultados de búsqueda (lista completa en memoria)
  const searchPaged = usePagedList(searchResult ?? [], filters.search)

  // Cargar personal desde la API con paginación
  useEffect(() => {
    async function fetchLeads() {
      setLoading(true)
      try {
        const result: LeadsListResult = await getLeads(currentPage, itemsPerPage)

        const leadsData: Lead[] = Array.isArray(result.data) ? result.data : result.data?.data || []
        setLeads(leadsData)

        // Manejar paginación si existe, sino usar valores por defecto
        const meta = Array.isArray(result.data) ? undefined : result.data
        if (result.pagination) {
          setPagination(result.pagination)
        } else if (meta?.totalPages) {
          // El backend devuelve el total dentro de `data` (totalCount, totalPages, currentPage)
          const totalCount = meta.totalCount ?? leadsData.length
          setPagination({
            currentPage: meta.currentPage || currentPage,
            totalPages: meta.totalPages || 1,
            perPage: itemsPerPage,
            total: totalCount,
            from: leadsData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0,
            to: Math.min(currentPage * itemsPerPage, totalCount)
          })
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

  // Búsqueda: se muestra la página actual de searchResult; si no, la página del servidor
  const filteredData = searchResult !== null ? searchPaged.pageItems : leads

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Personal"
        description="Personas registradas y el cargo que ocupan."
        actions={
          <Button icon={<FiPlus />} onClick={() => { setEditItem(null); setShowModal(true) }}>
            Agregar personal
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

      <div className={cardClass}>
        {loading ? (
          <LoadingState label="Cargando personal…" />
        ) : filteredData.length === 0 ? (
          searchResult !== null ? (
            <EmptyState title="Sin resultados" description={`No hay personal que coincidan con “${filters.search}”.`} />
          ) : (
            <EmptyState title="Aún no hay personal" description="Agrega el primero con el botón “Agregar personal”." />
          )
        ) : (
          <LeadTable
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
        <ModalLead
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
