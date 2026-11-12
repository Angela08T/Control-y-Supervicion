import React, { useEffect, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import LackTable from '../../components/LackTable'
import ModalLack from '../../components/ModalLack'
import SuccessModal from '../../components/SuccessModal'
import ErrorModal from '../../components/ErrorModal'
import { getLacks, createLack, updateLack, deleteLack } from '../../api/lack'
import { getModulePermissions } from '../../utils/permissions'
import { FiLock, FiPlus } from 'react-icons/fi'
import useNotification from '../../hooks/useNotification'
import { fitCard, fitPage } from '../../utils/classes'
import ConfirmModal from '../../components/ConfirmModal'
import SearchInput from '../../components/UI/SearchInput'
import Button from '../../components/UI/Button'
import Pagination from '../../components/UI/Pagination'
import { EmptyState, LoadingState } from '../../components/UI/EmptyState'
import { PAGE_SIZE } from '@/hooks/usePagedList'
import type { CreateLackDto, Lack, Paginated, TablePagination } from '@/types'

/** Listado de faltas: `data` paginado (o array plano); la paginación va dentro de `data`. */
interface LacksListResult {
  data?: Paginated<Lack> | Lack[];
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

export default function LackPage() {
  const { role: userRole } = useAppSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'faltas')
  const { successModal, errorModal, showSuccess, showError, closeSuccess, closeError } = useNotification()

  const [lacks, setLacks] = useState<Lack[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Lack | null>(null)
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
  const [porConfirmar, setPorConfirmar] = useState<Lack | null>(null) // Falta a habilitar/deshabilitar

  // Cargar faltas desde la API con paginación y búsqueda
  useEffect(() => {
    async function fetchLacks() {
      setLoading(true)
      try {
        const searchTerm = filters.search.trim()

        const result: LacksListResult = await getLacks(
          currentPage,
          itemsPerPage,
          searchTerm || null
        )

        const lacksData: Lack[] = Array.isArray(result.data) ? result.data : result.data?.data || []
        setLacks(lacksData)

        // Metadatos de paginación (solo existen cuando data es el objeto paginado)
        const meta = Array.isArray(result.data) ? undefined : result.data

        // Manejar paginación si existe
        if (meta?.totalPages) {
          setPagination({
            currentPage: meta.currentPage || currentPage,
            totalPages: meta.totalPages || 1,
            perPage: itemsPerPage,
            total: meta.totalCount || lacksData.length,
            from: lacksData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0,
            to: Math.min(currentPage * itemsPerPage, meta.totalCount || lacksData.length)
          })
        } else {
          // Si no hay paginación, calcular valores básicos
          setPagination({
            currentPage: currentPage,
            totalPages: Math.ceil(lacksData.length / itemsPerPage),
            perPage: itemsPerPage,
            total: lacksData.length,
            from: lacksData.length > 0 ? 1 : 0,
            to: lacksData.length
          })
        }
      } catch (error) {
        showError('No se pudo cargar las faltas')
      } finally {
        setLoading(false)
      }
    }

    fetchLacks()
  }, [filters.search, currentPage, itemsPerPage, refreshTrigger])


  // Crear o editar falta
  async function handleSave(data: CreateLackDto) {
    if (editItem) {
      // Actualizar falta existente
      try {
        const response: MutationBody = await updateLack(editItem.id, data)

        showSuccess(messageOf(response.data) || response.message || 'Falta actualizada exitosamente')

        setEditItem(null)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        let errorMessage = 'Error al actualizar la falta'
        const err = error as ApiErrorLike

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
      // Crear nueva falta
      try {
        const response: MutationBody = await createLack(data)

        showSuccess(messageOf(response.data) || response.message || 'Falta creada exitosamente')

        setCurrentPage(1)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        let errorMessage = 'Error al crear la falta'
        const err = error as ApiErrorLike

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

  /** Pide confirmacion en un modal antes de cambiar el estado */
  function handleToggleStatus(item: Lack) {
    setPorConfirmar(item)
  }

  async function confirmarCambioEstado(item: Lack) {
    setPorConfirmar(null)
    const isEnabled = !item.deleted_at
    const action = isEnabled ? 'deshabilitar' : 'habilitar'

    try {
      // El endpoint DELETE hace toggle automáticamente
      const response: MutationBody = await deleteLack(item.id)

      showSuccess(messageOf(response.data) || response.message || `Falta ${action === 'habilitar' ? 'habilitada' : 'deshabilitada'} exitosamente`)

      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      let errorMessage = `Error al ${action} la falta`
      const err = error as ApiErrorLike

      if (err.response?.data?.message) {
        errorMessage = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(', ')
          : err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }

      showError(errorMessage)
    }
  }

  function handleEdit(item: Lack) {
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

  // Los datos ya vienen filtrados desde la API
  const filteredData = lacks
  const isEmpty = filteredData.length === 0
  const isSearching = filters.search.trim() !== ''

  return (
    <div className={fitPage}>
      {/* Encabezado como el de Incidencias: titulo grande a la izquierda y la accion a la derecha */}
      <header className="mb-4 flex shrink-0 flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold tracking-[0.14em] text-primary/70 uppercase dark:text-accent-light">Normativa · Registro</p>
          <h2 className="m-0 mt-0.5 text-[30px] leading-tight font-bold tracking-[-0.02em] text-ink dark:text-content">Faltas</h2>
          <p className="m-0 mt-1 text-sm text-content-2">
            Conductas que se pueden registrar, con su artículo, asunto y plantilla de informe ·{' '}
            <strong className="font-semibold text-ink tabular-nums dark:text-content">{loading ? '—' : pagination.total}</strong>{' '}
            {isSearching ? 'encontradas' : 'registradas'}
          </p>
        </div>
        {permissions.canCreate && (
          <Button icon={<FiPlus aria-hidden />} onClick={() => { setEditItem(null); setShowModal(true) }}>
            Agregar falta
          </Button>
        )}
      </header>

      {/* Barra de busqueda */}
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-[#d3dceb] bg-surface p-3 shadow-[0_1px_2px_rgba(12,26,75,0.06),0_12px_28px_-14px_rgba(12,26,75,0.28)] dark:border-line">
        <div className="min-w-[240px] flex-1">
          <SearchInput
            value={filters.search}
            onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
            placeholder="Buscar por nombre de la falta"
            loading={loading && isSearching}
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
          <LoadingState label="Cargando faltas…" />
        ) : isEmpty ? (
          isSearching ? (
            <EmptyState
              title="Sin resultados"
              description={`No hay faltas que coincidan con “${filters.search.trim()}”.`}
            />
          ) : (
            <EmptyState
              title="Aún no hay faltas"
              description="Agrega la primera con el botón “Agregar falta”."
            />
          )
        ) : (
          <LackTable
            data={filteredData}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEdit}
            startIndex={pagination.from - 1}
            canEdit={permissions.canEdit}
            canDelete={permissions.canDelete}
          />
        )}

        {!loading && !isEmpty && (
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

      <ConfirmModal
        isOpen={!!porConfirmar}
        type={porConfirmar && !porConfirmar.deleted_at ? 'danger' : 'info'}
        title={porConfirmar && !porConfirmar.deleted_at ? `¿Deshabilitar «${porConfirmar.name}»?` : `¿Habilitar «${porConfirmar?.name ?? ''}»?`}
        message={
          porConfirmar && !porConfirmar.deleted_at
            ? 'Ya no se podrá elegir al registrar incidencias. Las incidencias ya registradas no cambian.'
            : 'Volverá a estar disponible al registrar incidencias.'
        }
        confirmText={porConfirmar && !porConfirmar.deleted_at ? 'Deshabilitar' : 'Habilitar'}
        onConfirm={() => porConfirmar && confirmarCambioEstado(porConfirmar)}
        onCancel={() => setPorConfirmar(null)}
      />

      {showModal && (
        <ModalLack
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleSave}
        />
      )}

      {/* Modales de notificación */}
      <SuccessModal
        show={successModal.show}
        message={successModal.message}
        onClose={closeSuccess}
      />
      <ErrorModal
        show={errorModal.show}
        message={errorModal.message}
        onClose={closeError}
      />
    </div>
  )
}
