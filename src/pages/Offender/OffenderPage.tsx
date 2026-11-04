import React, { useEffect, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import OffenderTable from '../../components/OffenderTable'
import type { OffenderRow } from '../../components/OffenderTable'
import ModalOffender from '../../components/ModalOffender'
import type { OffenderFormData } from '../../components/ModalOffender'
import { getOffenders, getOffenderByDni, createOffender, updateOffender, deleteOffender } from '../../api/offender'
import { getModulePermissions } from '../../utils/permissions'
import { FiPlus } from 'react-icons/fi'
import { cardClass } from '../../utils/classes'
import { useNotification } from '../../context/NotificationContext'
import ConfirmModal from '../../components/ConfirmModal'
import { toast } from '../../utils/toast'
import PageHeader from '@/components/UI/PageHeader'
import SearchInput from '@/components/UI/SearchInput'
import Pagination from '@/components/UI/Pagination'
import Button from '@/components/UI/Button'
import { EmptyState, LoadingState } from '@/components/UI/EmptyState'
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
  const [searchResult, setSearchResult] = useState<OffenderRow[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [confirmModal, setConfirmModal] = useState<ConfirmState>({ isOpen: false, item: null })

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
      ? '¿Estás seguro de deshabilitar este infractor? Ya no estará disponible para asignación.'
      : '¿Estás seguro de habilitar este infractor? Volverá a estar disponible para asignación.'

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

  function handleItemsPerPageChange(newItemsPerPage: number) {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  // Filtros - cuando hay searchResult lo mostramos directamente
  const filteredData = searchResult !== null ? searchResult : offenders

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Infractores"
        description="Personas registradas como infractores."
        actions={
          permissions.canCreate && (
            <Button icon={<FiPlus />} onClick={() => { setEditItem(null); setShowModal(true) }}>
              Agregar infractor
            </Button>
          )
        }
      >
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters(f => ({ ...f, search: v.replace(/\D/g, '').slice(0, 8) }))}
          placeholder="Buscar por DNI (8 dígitos)"
          loading={isSearching}
        />
      </PageHeader>

      {!permissions.canCreate && (
        <p className="m-0 mb-3 text-[13px] text-muted">
          Como supervisor, solo puedes visualizar los infractores registrados.
        </p>
      )}

      <div className={cardClass}>
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
          <OffenderTable
            data={filteredData}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEdit}
            startIndex={searchResult !== null ? 0 : pagination.from - 1}
            canEdit={permissions.canEdit}
            canDelete={permissions.canDelete}
          />
        )}

        {/* Paginación solo cuando no hay búsqueda activa */}
        {!loading && searchResult === null && (
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
        <ModalOffender
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleSave}
        />
      )}

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.action === 'habilitar' ? 'Confirmar Habilitación' : 'Confirmar Deshabilitación'}
        message={confirmModal.message ?? ''}
        type={confirmModal.action === 'habilitar' ? 'info' : 'warning'}
        onConfirm={confirmToggleStatus}
        onCancel={() => setConfirmModal({ isOpen: false, item: null })}
        confirmText={confirmModal.action === 'habilitar' ? 'Habilitar' : 'Deshabilitar'}
        cancelText="Cancelar"
      />
    </div>
  )
}
