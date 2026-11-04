import React, { useEffect, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import LackTable from '../../components/LackTable'
import ModalLack from '../../components/ModalLack'
import SuccessModal from '../../components/SuccessModal'
import ErrorModal from '../../components/ErrorModal'
import { getLacks, createLack, updateLack, deleteLack } from '../../api/lack'
import { getModulePermissions } from '../../utils/permissions'
import { FiPlus } from 'react-icons/fi'
import useNotification from '../../hooks/useNotification'
import { cardClass } from '../../utils/classes'
import PageHeader from '../../components/UI/PageHeader'
import SearchInput from '../../components/UI/SearchInput'
import Button from '../../components/UI/Button'
import Pagination from '../../components/UI/Pagination'
import { EmptyState, LoadingState } from '../../components/UI/EmptyState'
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

  async function handleToggleStatus(item: Lack) {
    const isEnabled = !item.deleted_at
    const action = isEnabled ? 'deshabilitar' : 'habilitar'
    const confirmMessage = isEnabled
      ? '¿Estás seguro de deshabilitar esta falta? Ya no estará disponible para asignación.'
      : '¿Estás seguro de habilitar esta falta? Volverá a estar disponible para asignación.'

    if (!confirm(confirmMessage)) return

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

  function handleItemsPerPageChange(newItemsPerPage: number) {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  // Los datos ya vienen filtrados desde la API
  const filteredData = lacks
  const isEmpty = filteredData.length === 0
  const isSearching = filters.search.trim() !== ''

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Faltas"
        description="Conductas que se pueden registrar, con su asunto y su contenido de informe."
        actions={
          permissions.canCreate && (
            <Button icon={<FiPlus aria-hidden />} onClick={() => { setEditItem(null); setShowModal(true) }}>
              Agregar falta
            </Button>
          )
        }
      >
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
          placeholder="Buscar por nombre de la falta"
        />
      </PageHeader>

      <div className={cardClass}>
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
            perPage={itemsPerPage}
            onPageChange={handlePageChange}
            onPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>

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
