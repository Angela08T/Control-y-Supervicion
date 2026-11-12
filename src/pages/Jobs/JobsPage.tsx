import React, { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import JobTable, { JobGrid } from '../../components/JobTable'
import ModalJob from '../../components/ModalJob'
import { getJobs, getJobById, createJob, updateJob, deleteJob, searchJob } from '../../api/job'
import { getModulePermissions } from '../../utils/permissions'
import { FiAward, FiBarChart2, FiBriefcase, FiGrid, FiList, FiLock, FiPlus, FiUserMinus, FiUsers } from 'react-icons/fi'
import { toast } from '../../utils/toast'
import { cn, fitCard, fitPage } from '../../utils/classes'
import ConfirmModal from '@/components/ConfirmModal'
import useAllLeads from '@/hooks/Job/useAllLeads'
import { RankedBars } from '@/pages/Metricas/charts'
import SearchInput from '@/components/UI/SearchInput'
import Pagination from '@/components/UI/Pagination'
import Button from '@/components/UI/Button'
import { EmptyState, LoadingState } from '@/components/UI/EmptyState'
import { PAGE_SIZE, usePagedList } from '@/hooks/usePagedList'
import type { CreateJobDto, Job, Lead, Paginated, TablePagination } from '@/types'

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

type VistaCargos = 'tarjetas' | 'lista' | 'distribucion'
const VISTA_KEY = 'centinela-cargos-vista'

/** Vista recordada por persona; sin dato, tarjetas */
function leerVista(): VistaCargos {
  try {
    const v = localStorage.getItem(VISTA_KEY)
    return v === 'lista' || v === 'distribucion' ? v : 'tarjetas'
  } catch {
    return 'tarjetas'
  }
}

/** Id del cargo de una persona (el backend lo manda como job_id o dentro de job) */
const cargoDe = (l: Lead): string => String(l.job_id ?? l.job?.id ?? '')

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
  const [porConfirmar, setPorConfirmar] = useState<Job | null>(null) // Cargo a habilitar/deshabilitar
  const [vista, setVistaState] = useState<VistaCargos>(leerVista)
  const setVista = (v: VistaCargos) => {
    setVistaState(v)
    try {
      localStorage.setItem(VISTA_KEY, v)
    } catch {
      // sin persistencia
    }
  }

  // Todo el personal y todos los cargos: para contar cuantas personas tiene cada cargo
  const { allLeads, loading: leadsLoading } = useAllLeads()
  const [todosLosCargos, setTodosLosCargos] = useState<Job[] | null>(null)
  useEffect(() => {
    getJobs(1, 1000)
      .then(r => {
        const lista: Job[] = Array.isArray(r.data) ? (r.data as unknown as Job[]) : r.data?.data || []
        setTodosLosCargos(lista)
      })
      .catch(() => setTodosLosCargos([]))
  }, [refreshTrigger])

  const personasPorCargo = useMemo(() => {
    if (leadsLoading) return undefined
    const mapa: Record<string, Lead[]> = {}
    allLeads.filter(l => !l.deleted_at).forEach(l => {
      const id = cargoDe(l)
      if (!id) return
      ;(mapa[id] ??= []).push(l)
    })
    return mapa
  }, [allLeads, leadsLoading])
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

  /** Pide confirmacion en un modal antes de cambiar el estado */
  function handleToggleStatus(item: Job) {
    setPorConfirmar(item)
  }

  async function confirmarCambioEstado(item: Job) {
    setPorConfirmar(null)
    const isEnabled = !item.deleted_at
    const action = isEnabled ? 'deshabilitar' : 'habilitar'

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

  const total = searchResult !== null ? searchPaged.total : pagination.total

  // Resumen con todos los cargos y todo el personal activo
  const habilitados = (todosLosCargos ?? []).filter(c => !c.deleted_at)
  const conteo = habilitados
    .map(c => ({ id: String(c.id), name: c.name, n: personasPorCargo?.[String(c.id)]?.length ?? 0 }))
    .sort((a, b) => b.n - a.n)
  const personalActivo = allLeads.filter(l => !l.deleted_at).length
  const masNumeroso = conteo[0]
  const sinPersonal = conteo.filter(c => c.n === 0).length
  const listo = !!todosLosCargos && !!personasPorCargo

  const resumen = [
    { label: 'Cargos habilitados', value: listo ? habilitados.length : '—', detail: listo ? `${(todosLosCargos?.length ?? 0) - habilitados.length} deshabilitados` : 'Cargando…', icon: <FiBriefcase />, tone: 'bg-primary/10 text-primary dark:bg-primary/25 dark:text-accent-light' },
    { label: 'Personal activo', value: listo ? personalActivo : '—', detail: 'repartido en los cargos', icon: <FiUsers />, tone: 'bg-success/12 text-lime-ink' },
    { label: 'Cargo con más personal', value: listo && masNumeroso?.n ? masNumeroso.n : '—', detail: listo && masNumeroso?.n ? masNumeroso.name : 'Sin datos', icon: <FiAward />, tone: 'bg-warning/14 text-amber-ink' },
    { label: 'Cargos sin personal', value: listo ? sinPersonal : '—', detail: 'nadie asignado aún', icon: <FiUserMinus />, tone: 'bg-danger/10 text-red-ink' },
  ]

  const vistaBtn = (activa: boolean) =>
    cn(
      'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border-none px-2.5 text-[13px] font-semibold transition-colors',
      activa ? 'bg-subtle text-content shadow-[0_1px_2px_rgba(15,23,42,0.12)]' : 'bg-transparent text-muted hover:text-content'
    )

  // Gente del cargo que se va a deshabilitar (para avisar en la confirmacion)
  const genteAfectada = porConfirmar ? personasPorCargo?.[String(porConfirmar.id)]?.length ?? 0 : 0

  return (
    <div className={fitPage}>
      {/* Encabezado como el de Incidencias: titulo grande a la izquierda y la accion a la derecha */}
      <header className="mb-4 flex shrink-0 flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold tracking-[0.14em] text-primary/70 uppercase dark:text-accent-light">Organización · Puestos</p>
          <h2 className="m-0 mt-0.5 text-[30px] leading-tight font-bold tracking-[-0.02em] text-ink dark:text-content">Cargos</h2>
          <p className="m-0 mt-1 text-sm text-content-2">
            Puestos de trabajo que se asignan al personal ·{' '}
            <strong className="font-semibold text-ink tabular-nums dark:text-content">{loading ? '—' : total}</strong>{' '}
            {searchResult !== null ? 'encontrados' : 'registrados'}
          </p>
        </div>
        {permissions.canCreate && (
          <Button icon={<FiPlus />} onClick={() => { setEditItem(null); setShowModal(true) }}>
            Agregar cargo
          </Button>
        )}
      </header>

      {/* Resumen */}
      <div className="mb-4 grid shrink-0 grid-cols-4 gap-3 max-lg:grid-cols-2 max-[420px]:grid-cols-1">
        {resumen.map(r => (
          <div
            key={r.label}
            className="flex items-center gap-3.5 rounded-2xl border border-[#d3dceb] bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgba(12,26,75,0.06),0_12px_28px_-14px_rgba(12,26,75,0.28)] dark:border-line"
          >
            <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl text-xl', r.tone)} aria-hidden>
              {r.icon}
            </span>
            <div className="min-w-0">
              <p className="m-0 truncate text-[13px] font-medium text-content-2">{r.label}</p>
              <p className="m-0 text-[24px] leading-tight font-bold tracking-[-0.02em] text-ink dark:text-content">{r.value}</p>
              <p className="m-0 truncate text-xs text-muted" title={r.detail}>{r.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Barra: busqueda y tipo de vista */}
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-[#d3dceb] bg-surface p-3 shadow-[0_1px_2px_rgba(12,26,75,0.06),0_12px_28px_-14px_rgba(12,26,75,0.28)] dark:border-line">
        <div className="min-w-[240px] flex-1">
          <SearchInput
            value={filters.search}
            onChange={(value) => setFilters((f) => ({ ...f, search: value }))}
            placeholder="Buscar por nombre o ID"
            loading={isSearching}
            className="max-w-none!"
          />
        </div>
        <div role="group" aria-label="Vista" className="inline-flex h-10 items-center gap-0.5 rounded-xl border border-line bg-surface p-1">
          <button type="button" aria-pressed={vista === 'tarjetas'} onClick={() => setVista('tarjetas')} className={vistaBtn(vista === 'tarjetas')}>
            <FiGrid aria-hidden /> Tarjetas
          </button>
          <button type="button" aria-pressed={vista === 'lista'} onClick={() => setVista('lista')} className={vistaBtn(vista === 'lista')}>
            <FiList aria-hidden /> Lista
          </button>
          <button type="button" aria-pressed={vista === 'distribucion'} onClick={() => setVista('distribucion')} className={vistaBtn(vista === 'distribucion')}>
            <FiBarChart2 aria-hidden /> Distribución
          </button>
        </div>
      </div>

      {!permissions.canEdit && !permissions.canDelete && permissions.canView && (
        <p className="m-0 mb-3 inline-flex items-center gap-2 self-start rounded-lg bg-subtle px-3 py-1.5 text-[13px] text-content-2">
          <FiLock className="shrink-0 text-muted" aria-hidden />
          Tienes permisos de solo lectura: no puedes editar ni deshabilitar cargos.
        </p>
      )}

      {/* Distribucion: cuantas personas tiene cada cargo habilitado */}
      {vista === 'distribucion' && (
        <section className={cn(fitCard, 'gap-4 p-5 max-sm:p-4')}>
          <header className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary dark:bg-primary/25 dark:text-accent-light" aria-hidden>
              <FiBarChart2 />
            </span>
            <div>
              <h3 className="m-0 text-[15px] font-semibold text-content">Personal por cargo</h3>
              <p className="m-0 text-xs text-muted">¿Cómo se reparte el personal activo entre los cargos habilitados?</p>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-auto pr-1">
            {!listo ? (
              <LoadingState label="Contando personal…" />
            ) : conteo.length === 0 ? (
              <EmptyState title="Aún no hay cargos" description="Agrega el primero con el botón “Agregar cargo”." />
            ) : (
              <RankedBars
                unidad="Personas"
                total={personalActivo}
                items={conteo.map(c => ({ id: c.id, label: c.name, value: c.n }))}
              />
            )}
          </div>
        </section>
      )}

      {vista !== 'distribucion' && (
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
          vista === 'tarjetas' ? (
            <JobGrid
              data={filteredData}
              onToggleStatus={handleToggleStatus}
              onEdit={handleEdit}
              canEdit={permissions.canEdit}
              canDelete={permissions.canDelete}
              personas={personasPorCargo}
            />
          ) : (
          <JobTable
            data={filteredData}
            personas={personasPorCargo}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEdit}
            startIndex={searchResult !== null ? searchPaged.from - 1 : pagination.from - 1}
            canEdit={permissions.canEdit}
            canDelete={permissions.canDelete}
          />
          )
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
      )}

      <ConfirmModal
        isOpen={!!porConfirmar}
        type={porConfirmar && !porConfirmar.deleted_at ? 'danger' : 'info'}
        title={porConfirmar && !porConfirmar.deleted_at ? `¿Deshabilitar el cargo ${porConfirmar.name}?` : `¿Habilitar el cargo ${porConfirmar?.name ?? ''}?`}
        message={
          porConfirmar && !porConfirmar.deleted_at
            ? (genteAfectada > 0
                ? `Hay ${genteAfectada} ${genteAfectada === 1 ? 'persona' : 'personas'} con este cargo. Seguirán registradas, pero el cargo ya no se podrá asignar a nadie más.`
                : 'Ya no se podrá asignar al personal. Puedes volver a habilitarlo cuando quieras.')
            : 'Volverá a estar disponible para asignarlo al personal.'
        }
        confirmText={porConfirmar && !porConfirmar.deleted_at ? 'Deshabilitar' : 'Habilitar'}
        onConfirm={() => porConfirmar && confirmarCambioEstado(porConfirmar)}
        onCancel={() => setPorConfirmar(null)}
      />

      {showModal && (
        <ModalJob
          existentes={(todosLosCargos ?? []).map(c => c.name)}
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
