import React, { useEffect, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import OffenderTable, { OffenderMasterDetail } from '../../components/OffenderTable'
import type { OffenderRow } from '../../components/OffenderTable'
import ModalOffender from '../../components/ModalOffender'
import type { OffenderFormData } from '../../components/ModalOffender'
import { getOffenders, getOffenderByDni, createOffender, updateOffender, deleteOffender } from '../../api/offender'
import { getModulePermissions } from '../../utils/permissions'
import { FiCreditCard, FiEye, FiList, FiPlus, FiSearch, FiX } from 'react-icons/fi'
import { cn, controlsInput, fitCard, fitPage } from '../../utils/classes'
import { useNotification } from '../../context/NotificationContext'
import ConfirmModal from '../../components/ConfirmModal'
import { toast } from '../../utils/toast'
import Pagination from '@/components/UI/Pagination'
import Button from '@/components/UI/Button'
import { EmptyState, LoadingState } from '@/components/UI/EmptyState'
import { PAGE_SIZE, usePagedList } from '@/hooks/usePagedList'
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

const VISTA_KEY = 'centinela-infractores-vista'

/** Vista recordada por persona; sin dato, credencial */
function leerVista(): 'credencial' | 'lista' {
  try {
    return localStorage.getItem(VISTA_KEY) === 'lista' ? 'lista' : 'credencial'
  } catch {
    return 'credencial'
  }
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
  const [searchResult, setSearchResult] = useState<OffenderRow[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [confirmModal, setConfirmModal] = useState<ConfirmState>({ isOpen: false, item: null })
  const [vista, setVistaState] = useState<'credencial' | 'lista'>(leerVista)
  const setVista = (v: 'credencial' | 'lista') => {
    setVistaState(v)
    try {
      localStorage.setItem(VISTA_KEY, v)
    } catch {
      // sin persistencia
    }
  }
  // Resultados de búsqueda por DNI: paginación en navegador (vuelve a la página 1 al cambiar la búsqueda)
  const searchPaged = usePagedList(searchResult ?? [], filters.search)

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
      ? 'Ya no aparecerá al registrar incidencias ni inasistencias. Puedes volver a habilitarlo cuando quieras.'
      : 'Volverá a aparecer al registrar incidencias e inasistencias.'

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

  // Con búsqueda activa se muestra la página actual de searchResult; si no, la página del servidor
  const filteredData = searchResult !== null ? searchPaged.pageItems : offenders

  const total = searchResult !== null ? searchPaged.total : pagination.total
  const digitos = filters.search.length
  const vistaBtn = (activa: boolean) =>
    cn(
      'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border-none px-2.5 text-[13px] font-semibold transition-colors',
      activa ? 'bg-subtle text-content shadow-[0_1px_2px_rgba(15,23,42,0.12)]' : 'bg-transparent text-muted hover:text-content'
    )

  return (
    <div className={fitPage}>
      {/* Encabezado como el de Incidencias: titulo grande a la izquierda y la accion a la derecha */}
      <header className="mb-4 flex shrink-0 flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold tracking-[0.14em] text-primary/70 uppercase dark:text-accent-light">Registro · Personas</p>
          <h2 className="m-0 mt-0.5 text-[30px] leading-tight font-bold tracking-[-0.02em] text-ink dark:text-content">Infractores</h2>
          <p className="m-0 mt-1 text-sm text-content-2">
            Personas registradas como infractores ·{' '}
            <strong className="font-semibold text-ink tabular-nums dark:text-content">{loading ? '—' : total}</strong>{' '}
            {searchResult !== null ? 'encontrados' : 'registrados'}
          </p>
        </div>
        {permissions.canCreate && (
          <Button icon={<FiPlus />} onClick={() => { setEditItem(null); setShowModal(true) }}>
            Agregar infractor
          </Button>
        )}
      </header>

      {/* Barra: busqueda por DNI (con contador de digitos) y tipo de vista */}
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-[#d3dceb] bg-surface p-3 shadow-[0_1px_2px_rgba(12,26,75,0.06),0_12px_28px_-14px_rgba(12,26,75,0.28)] dark:border-line">
        <div className="relative min-w-[240px] flex-1">
          <FiSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            inputMode="numeric"
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
            placeholder="Buscar por DNI (8 dígitos)"
            aria-label="Buscar por DNI"
            className={cn(controlsInput, 'w-full min-w-0! pr-28 pl-9 font-mono tracking-[0.06em] [&::-webkit-search-cancel-button]:hidden')}
          />
          <span className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1.5">
            {isSearching ? (
              <span className="text-xs text-muted">Buscando…</span>
            ) : digitos > 0 && digitos < 8 ? (
              <span className="rounded-md bg-subtle px-1.5 py-0.5 text-[11px] font-semibold text-content-2 tabular-nums">
                faltan {8 - digitos}
              </span>
            ) : digitos === 8 ? (
              <span className="rounded-md bg-success/12 px-1.5 py-0.5 text-[11px] font-semibold text-lime-ink">DNI completo</span>
            ) : null}
            {digitos > 0 && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setFilters(f => ({ ...f, search: '' }))}
                className="flex size-6 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-muted hover:bg-subtle hover:text-content"
              >
                <FiX aria-hidden />
              </button>
            )}
          </span>
        </div>
        <div role="group" aria-label="Vista" className="inline-flex h-10 items-center gap-0.5 rounded-xl border border-line bg-surface p-1">
          <button type="button" aria-pressed={vista === 'credencial'} onClick={() => setVista('credencial')} className={vistaBtn(vista === 'credencial')}>
            <FiCreditCard aria-hidden /> Credencial
          </button>
          <button type="button" aria-pressed={vista === 'lista'} onClick={() => setVista('lista')} className={vistaBtn(vista === 'lista')}>
            <FiList aria-hidden /> Lista
          </button>
        </div>
      </div>

      {!permissions.canCreate && (
        <p className="m-0 mb-3 inline-flex items-center gap-2 self-start rounded-lg bg-subtle px-3 py-1.5 text-[13px] text-content-2">
          <FiEye className="shrink-0 text-muted" aria-hidden />
          Como supervisor, solo puedes visualizar los infractores registrados.
        </p>
      )}

      <div className={fitCard}>
        {loading ? (
          <LoadingState label="Cargando infractores…" />
        ) : filteredData.length === 0 ? (
          isSearching ? (
            <LoadingState label="Buscando infractor…" />
          ) : searchResult !== null ? (
            <EmptyState
              title="Sin resultados"
              description={`No hay infractores con el DNI “${filters.search}”. Verifica que tenga 8 dígitos.`}
            />
          ) : (
            <EmptyState
              title="Aún no hay infractores"
              description={permissions.canCreate ? 'Agrega el primero con el botón “Agregar infractor”.' : undefined}
            />
          )
        ) : (
          vista === 'credencial' ? (
            <OffenderMasterDetail
              data={filteredData}
              onToggleStatus={handleToggleStatus}
              onEdit={handleEdit}
              canEdit={permissions.canEdit}
              canDelete={permissions.canDelete}
            />
          ) : (
          <OffenderTable
            data={filteredData}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEdit}
            startIndex={searchResult !== null ? searchPaged.from - 1 : pagination.from - 1}
            canEdit={permissions.canEdit}
            canDelete={permissions.canDelete}
          />
          )
        )}

        {/* Búsqueda activa: paginación en navegador (sin resultados no hay paginación, como antes) */}
        {!loading && searchResult !== null && searchPaged.total > 0 && (
          <Pagination
            page={searchPaged.page}
            totalPages={searchPaged.totalPages}
            total={searchPaged.total}
            from={searchPaged.from}
            to={searchPaged.to}
            onPageChange={searchPaged.setPage}
          />
        )}

        {/* Sin búsqueda: paginación del servidor */}
        {!loading && searchResult === null && (
          <Pagination
            page={currentPage}
            totalPages={pagination.totalPages}
            total={pagination.total}
            from={pagination.from}
            to={pagination.to}
            onPageChange={handlePageChange}
          />
        )}
      </div>

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
        title={
          confirmModal.action === 'habilitar'
            ? `¿Habilitar a ${confirmModal.item?.name ?? ''} ${confirmModal.item?.lastname ?? ''}?`
            : `¿Deshabilitar a ${confirmModal.item?.name ?? ''} ${confirmModal.item?.lastname ?? ''}?`
        }
        message={confirmModal.message ?? ''}
        type={confirmModal.action === 'habilitar' ? 'info' : 'danger'}
        onConfirm={confirmToggleStatus}
        onCancel={() => setConfirmModal({ isOpen: false, item: null })}
        confirmText={confirmModal.action === 'habilitar' ? 'Habilitar' : 'Deshabilitar'}
        cancelText="Cancelar"
      />
    </div>
  )
}
