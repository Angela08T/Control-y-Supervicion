import React, { useEffect, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import SubjectTable, { colorAsunto } from '../../components/SubjectTable'
import ModalSubject from '../../components/ModalSubject'
import { getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject, searchSubject } from '../../api/subject'
import { getModulePermissions } from '../../utils/permissions'
import { FiFileText, FiFolder, FiLock, FiPieChart, FiPlus } from 'react-icons/fi'
import { cn, fitCard, fitPage } from '../../utils/classes'
import ConfirmModal from '../../components/ConfirmModal'
import { nombreCorto } from '@/pages/Dashboard/asuntos'
import SearchInput from '../../components/UI/SearchInput'
import Button from '../../components/UI/Button'
import Pagination from '../../components/UI/Pagination'
import { EmptyState, LoadingState } from '../../components/UI/EmptyState'
import { toast } from '../../utils/toast'
import { PAGE_SIZE, usePagedList } from '@/hooks/usePagedList'
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
  const [searchResult, setSearchResult] = useState<Subject[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [porConfirmar, setPorConfirmar] = useState<Subject | null>(null) // Asunto a habilitar/deshabilitar
  // Paginación en el navegador para los resultados de búsqueda (lista completa en memoria)
  const searchPaged = usePagedList(searchResult ?? [], filters.search)

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

  /** Pide confirmacion en un modal antes de cambiar el estado */
  function handleToggleStatus(item: Subject) {
    setPorConfirmar(item)
  }

  async function confirmarCambioEstado(item: Subject) {
    setPorConfirmar(null)
    const isEnabled = !item.deleted_at
    const action = isEnabled ? 'deshabilitar' : 'habilitar'

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

  // Búsqueda: se muestra la página actual de searchResult; si no, la página del servidor
  const filteredData = searchResult !== null ? searchPaged.pageItems : subjects

  const isEmpty = filteredData.length === 0

  const total = searchResult !== null ? searchPaged.total : pagination.total

  // Distribucion de faltas entre los asuntos habilitados que se ven en pantalla
  const habilitados = filteredData.filter(a => !a.deleted_at)
  const reparto = habilitados
    .map(a => ({ id: String(a.id), name: a.name, n: a.lacks?.length ?? 0, color: colorAsunto(a.name) }))
    .filter(r => r.n > 0)
    .sort((a, b) => b.n - a.n)
  const totalFaltas = reparto.reduce((sum, r) => sum + r.n, 0)
  const esParcial = searchResult === null && pagination.totalPages > 1

  return (
    <div className={fitPage}>
      {/* Encabezado como el de Incidencias: titulo grande a la izquierda y la accion a la derecha */}
      <header className="mb-4 flex shrink-0 flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold tracking-[0.14em] text-primary/70 uppercase dark:text-accent-light">Normativa · Catálogo</p>
          <h2 className="m-0 mt-0.5 text-[30px] leading-tight font-bold tracking-[-0.02em] text-ink dark:text-content">Asuntos</h2>
          <p className="m-0 mt-1 text-sm text-content-2">
            Agrupan las faltas disciplinarias por tipo de conducta ·{' '}
            <strong className="font-semibold text-ink tabular-nums dark:text-content">{loading ? '—' : total}</strong>{' '}
            {searchResult !== null ? 'encontrados' : 'registrados'}
          </p>
        </div>
        {permissions.canCreate && (
          <Button icon={<FiPlus aria-hidden />} onClick={() => { setEditItem(null); setShowModal(true) }}>
            Agregar asunto
          </Button>
        )}
      </header>

      {/* Resumen: cuantos asuntos y faltas, y como se reparten las faltas */}
      <div className="mb-4 grid shrink-0 grid-cols-[auto_minmax(0,1fr)] gap-3 max-lg:grid-cols-1">
        <div className="flex gap-3 max-sm:flex-col">
          {[
            { label: 'Asuntos habilitados', value: habilitados.length, icon: <FiFolder />, tone: 'bg-primary/10 text-primary dark:bg-primary/25 dark:text-accent-light' },
            { label: 'Faltas agrupadas', value: totalFaltas, icon: <FiFileText />, tone: 'bg-warning/14 text-amber-ink' },
          ].map(r => (
            <div
              key={r.label}
              className="flex min-w-[190px] flex-1 items-center gap-3.5 rounded-2xl border border-[#d3dceb] bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgba(12,26,75,0.06),0_12px_28px_-14px_rgba(12,26,75,0.28)] dark:border-line"
            >
              <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl text-xl', r.tone)} aria-hidden>
                {r.icon}
              </span>
              <div>
                <p className="m-0 text-[13px] font-medium text-content-2">{r.label}</p>
                <p className="m-0 text-[24px] leading-tight font-bold tracking-[-0.02em] text-ink dark:text-content">{loading ? '—' : r.value}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="flex min-w-0 flex-col justify-center gap-2.5 rounded-2xl border border-[#d3dceb] bg-surface px-5 py-3.5 shadow-[0_1px_2px_rgba(12,26,75,0.06),0_12px_28px_-14px_rgba(12,26,75,0.28)] dark:border-line">
          <p className="m-0 flex items-center gap-2 text-[13px] font-semibold text-content">
            <FiPieChart className="text-muted" aria-hidden />
            Reparto de las faltas por asunto
            {esParcial && <span className="font-normal text-muted">· asuntos de esta página</span>}
          </p>
          {loading ? (
            <span className="h-3 w-full animate-pulse rounded-full bg-subtle" aria-hidden />
          ) : totalFaltas === 0 ? (
            <span className="text-xs text-muted">Aún no hay faltas asociadas.</span>
          ) : (
            <>
              <div className="flex h-3 w-full gap-[2px]" role="img" aria-label={reparto.map(r => `${nombreCorto(r.name)}: ${r.n} faltas`).join(', ')}>
                {reparto.map(r => (
                  <div
                    key={r.id}
                    title={`${nombreCorto(r.name)}: ${r.n} faltas (${Math.round((r.n / totalFaltas) * 100)}%)`}
                    className="h-full rounded-[3px]"
                    style={{ flexGrow: r.n, flexBasis: 0, background: r.color }}
                  />
                ))}
              </div>
              <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-content-2">
                {reparto.map(r => (
                  <li key={r.id} className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm" style={{ background: r.color }} aria-hidden />
                    {nombreCorto(r.name)}
                    <strong className="font-semibold text-content tabular-nums">{r.n}</strong>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {/* Barra de busqueda */}
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-[#d3dceb] bg-surface p-3 shadow-[0_1px_2px_rgba(12,26,75,0.06),0_12px_28px_-14px_rgba(12,26,75,0.28)] dark:border-line">
        <div className="min-w-[240px] flex-1">
          <SearchInput
            value={filters.search}
            onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
            placeholder="Buscar por nombre o ID"
            loading={isSearching}
            className="max-w-none!"
          />
        </div>
        {!permissions.canEdit && !permissions.canDelete && (
          <span className="inline-flex items-center gap-2 rounded-lg bg-subtle px-3 py-1.5 text-[13px] text-content-2">
            <FiLock className="shrink-0 text-muted" aria-hidden />
            Solo lectura
          </span>
        )}
      </div>

      <div className={fitCard}>
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
            startIndex={searchResult !== null ? searchPaged.from - 1 : pagination.from - 1}
            canEdit={permissions.canEdit}
            canDelete={permissions.canDelete}
          />
        )}

        {/* Búsqueda: paginación en el navegador; sin búsqueda: paginación del servidor */}
        {!loading && !isEmpty && (searchResult !== null ? (
          <Pagination
            page={searchPaged.page}
            totalPages={searchPaged.totalPages}
            total={searchPaged.total}
            from={searchPaged.from}
            to={searchPaged.to}
            onPageChange={searchPaged.setPage}
          />
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

      <ConfirmModal
        isOpen={!!porConfirmar}
        type={porConfirmar && !porConfirmar.deleted_at ? 'danger' : 'info'}
        title={
          porConfirmar && !porConfirmar.deleted_at
            ? `¿Deshabilitar «${nombreCorto(porConfirmar.name)}»?`
            : `¿Habilitar «${porConfirmar ? nombreCorto(porConfirmar.name) : ''}»?`
        }
        message={
          porConfirmar && !porConfirmar.deleted_at
            ? ((porConfirmar.lacks?.length ?? 0) > 0
                ? `Agrupa ${porConfirmar.lacks?.length} faltas. Ya no se podrá elegir al registrar incidencias; puedes volver a habilitarlo cuando quieras.`
                : 'Ya no se podrá elegir al registrar incidencias. Puedes volver a habilitarlo cuando quieras.')
            : 'Volverá a estar disponible al registrar incidencias.'
        }
        confirmText={porConfirmar && !porConfirmar.deleted_at ? 'Deshabilitar' : 'Habilitar'}
        onConfirm={() => porConfirmar && confirmarCambioEstado(porConfirmar)}
        onCancel={() => setPorConfirmar(null)}
      />

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
