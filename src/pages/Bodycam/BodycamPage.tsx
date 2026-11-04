import React, { useEffect, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import BodycamTable, { type BodycamTableRow } from '../../components/BodycamTable'
import ModalBodycam from '../../components/ModalBodycam'
import { getBodycams, getBodycamById, createBodycam, updateBodycam, deleteBodycam, searchBodycam } from '../../api/bodycam'
import { getModulePermissions } from '../../utils/permissions'
import { FiPlus } from 'react-icons/fi'
import { toast } from '../../utils/toast'
import type { BodycamView, CreateBodycamDto, TablePagination } from '@/types'
import PageHeader from '@/components/UI/PageHeader'
import SearchInput from '@/components/UI/SearchInput'
import Pagination from '@/components/UI/Pagination'
import Button from '@/components/UI/Button'
import { Select } from '@/components/UI/Field'
import { EmptyState, LoadingState } from '@/components/UI/EmptyState'
import { cardClass } from '@/utils/classes'
import { PAGE_SIZE, usePagedList } from '@/hooks/usePagedList'

/** Tipos de filtro de dispositivo del selector */
type DeviceType = 'all' | 'camera' | 'sg' | 'fisca'

/** Tipo de dispositivo detectado por nombre */
type DeviceKind = 'unknown' | 'sg' | 'fisca' | 'camera' | 'other'

/** Fila de resultado de busqueda */
type BodycamRow = Pick<BodycamView, 'id' | 'name' | 'serie' | 'cam' | 'deleted_at'>

/** Cuerpo de respuesta de mutaciones: el mensaje puede venir en la raiz o dentro de data */
interface MutationBody {
  message?: string
  data?: { message?: string }
}

/** Forma minima de un error de axios usada para leer el mensaje del backend */
interface MutationError {
  message?: string
  response?: { data?: { message?: string | string[] } }
}

const readMutationBody = (body: unknown): MutationBody => body as MutationBody

export default function BodycamPage() {
  const { role: userRole } = useAppSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'bodycam')

  const [bodycams, setBodycams] = useState<BodycamView[]>([])
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editItem, setEditItem] = useState<BodycamTableRow | null>(null)
  const [filters, setFilters] = useState<{ search: string; deviceType: DeviceType }>({
    search: '',
    deviceType: 'all' // all, camera, sg, fisca
  })

  // Función para determinar el tipo de dispositivo basado en el nombre
  const getDeviceType = (name: string): DeviceKind => {
    if (!name) return 'unknown'
    const upperName = name.toUpperCase()
    if (upperName.startsWith('SG')) return 'sg'
    if (upperName.startsWith('FISCA')) return 'fisca'
    // Si es numérico o alfanumérico simple (1, 20A, 510, etc.) es cámara
    if (/^[0-9]+[A-Z]?$/i.test(name.trim())) return 'camera'
    return 'other'
  }

  // Efecto para buscar por tipo de dispositivo
  useEffect(() => {
    if (filters.deviceType === 'all') {
      setSearchResult(null)
      return
    }

    // Si hay búsqueda activa, no hacer búsqueda por tipo
    if (filters.search.trim()) return

    const searchByType = async () => {
      setIsSearching(true)
      try {
        let searchPrefix = ''
        if (filters.deviceType === 'sg') searchPrefix = 'SG'
        else if (filters.deviceType === 'fisca') searchPrefix = 'FISCA'
        else if (filters.deviceType === 'camera') {
          // Para cámaras, cargar todos y filtrar localmente
          const result = await getBodycams(1, 1000)
          const cameras = result.data.filter(item => getDeviceType(item.name) === 'camera')
          setSearchResult(cameras)
          setIsSearching(false)
          return
        }

        if (searchPrefix) {
          const response = await searchBodycam(searchPrefix)
          const results = response?.data?.data || []
          const transformed = results.map(b => ({
            id: b.id,
            name: b.name,
            serie: b.serie,
            cam: b.cam,
            deleted_at: b.deleted_at
          }))
          setSearchResult(transformed)
        }
      } catch (error) {
        setSearchResult([])
      } finally {
        setIsSearching(false)
      }
    }

    searchByType()
  }, [filters.deviceType])
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = PAGE_SIZE
  const [pagination, setPagination] = useState<TablePagination>({
    currentPage: 1,
    totalPages: 1,
    perPage: PAGE_SIZE,
    total: 0,
    from: 0,
    to: 0
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [searchResult, setSearchResult] = useState<BodycamRow[] | null>(null)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  // Resultados de búsqueda: paginación en navegador (vuelve a la página 1 al cambiar búsqueda o tipo)
  const searchPaged = usePagedList(searchResult ?? [], `${filters.search}|${filters.deviceType}`)

  // Cargar bodycams desde la API con paginación
  useEffect(() => {
    async function fetchBodycams() {
      setLoading(true)
      try {
        const result = await getBodycams(currentPage, itemsPerPage)
        setBodycams(result.data)
        setPagination(result.pagination)
      } catch (error) {
        toast.info('No se pudieron cargar los dispositivos')
      } finally {
        setLoading(false)
      }
    }

    fetchBodycams()
  }, [currentPage, itemsPerPage, refreshTrigger])

  // Verificar si el término de búsqueda es un UUID
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  // Buscar bodycam por ID o nombre/serie cuando el usuario escribe
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
          const result = await getBodycamById(searchTerm)

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
      // Si NO es UUID, buscar por nombre/serie en toda la base de datos
      const searchByNameOrSerie = async () => {
        setIsSearching(true)
        try {
          const response = await searchBodycam(searchTerm)

          // La API devuelve los datos en response.data?.data?.data
          const results = response?.data?.data || []

          if (results.length > 0) {
            // Transformar los resultados al formato esperado
            const transformed = results.map(b => ({
              id: b.id,
              name: b.name,
              serie: b.serie,
              cam: b.cam,
              deleted_at: b.deleted_at
            }))
            setSearchResult(transformed)
          } else {
            setSearchResult([])
          }
        } catch (error) {
          setSearchResult(null)
        } finally {
          setIsSearching(false)
        }
      }

      searchByNameOrSerie()
    }
  }, [filters.search])

  // Crear o editar dispositivo
  async function handleSave(data: Pick<CreateBodycamDto, 'name' | 'serie'>) {
    if (editItem) {
      // Actualizar dispositivo existente
      try {
        const response = await updateBodycam(editItem.id, data)

        toast.success(readMutationBody(response).data?.message || response.message || 'Dispositivo actualizado exitosamente')

        setEditItem(null)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        const apiError = error as MutationError

        let errorMessage = 'Error al actualizar el dispositivo'

        if (apiError.response?.data?.message) {
          errorMessage = Array.isArray(apiError.response.data.message)
            ? 'Errores de validación:\n' + apiError.response.data.message.join('\n')
            : apiError.response.data.message
        } else if (apiError.message) {
          errorMessage = apiError.message
        }

        toast.error(errorMessage)
      }
    } else {
      // Crear nuevo dispositivo
      try {
        const response = await createBodycam({ ...data, cam: 'BODYCAM' })

        toast.success(readMutationBody(response).data?.message || response.message || 'Dispositivo creado exitosamente')

        setCurrentPage(1)
        setShowModal(false)
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        const apiError = error as MutationError

        let errorMessage = 'Error al crear el dispositivo'

        if (apiError.response?.data?.message) {
          errorMessage = Array.isArray(apiError.response.data.message)
            ? 'Errores de validación:\n' + apiError.response.data.message.join('\n')
            : apiError.response.data.message
        } else if (apiError.message) {
          errorMessage = apiError.message
        }

        toast.error(errorMessage)
      }
    }
  }

  async function handleToggleStatus(item: BodycamTableRow) {
    const isEnabled = !item.deleted_at
    const action = isEnabled ? 'deshabilitar' : 'habilitar'
    const confirmMessage = isEnabled
      ? '¿Estás seguro de deshabilitar este dispositivo? Ya no estará disponible para asignación.'
      : '¿Estás seguro de habilitar este dispositivo? Volverá a estar disponible para asignación.'

    if (!confirm(confirmMessage)) return

    try {
      // El endpoint DELETE hace toggle automáticamente
      const response = await deleteBodycam(item.id)

      toast.success(readMutationBody(response).data?.message || response.message || `Dispositivo ${action === 'habilitar' ? 'habilitado' : 'deshabilitado'} exitosamente`)

      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      const apiError = error as MutationError

      let errorMessage = `Error al ${action} el dispositivo`

      if (apiError.response?.data?.message) {
        errorMessage = Array.isArray(apiError.response.data.message)
          ? apiError.response.data.message.join('\n')
          : apiError.response.data.message
      } else if (apiError.message) {
        errorMessage = apiError.message
      }

      toast.error(errorMessage)
    }
  }

  function handleEdit(item: BodycamTableRow) {
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
  const filteredData = searchResult !== null ? searchPaged.pageItems : bodycams

  // Texto del estado vacío según haya búsqueda o no
  const emptySearchDescription = filters.search.trim()
    ? `No hay dispositivos que coincidan con “${filters.search}”.`
    : 'No hay dispositivos de este tipo.'

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Dispositivos"
        description="Bodycams y cámaras disponibles para asignar a los turnos."
        actions={
          permissions.canCreate && (
            <Button icon={<FiPlus />} onClick={() => { setEditItem(null); setShowModal(true) }}>
              Agregar dispositivo
            </Button>
          )
        }
      >
        <Select
          aria-label="Filtrar por tipo de dispositivo"
          className="md:w-[200px]"
          value={filters.deviceType}
          onChange={e => setFilters(f => ({ ...f, deviceType: e.target.value as DeviceType }))}
        >
          <option value="all">Todos los tipos</option>
          <option value="camera">Cámaras</option>
          <option value="sg">Bodycam SG</option>
          <option value="fisca">Bodycam FISCA</option>
        </Select>

        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters(f => ({ ...f, search: v }))}
          placeholder="Buscar por nombre, serie o ID"
          loading={isSearching}
        />
      </PageHeader>

      {!permissions.canCreate && permissions.canView && (
        <p className="m-0 mb-3 text-[13px] text-muted">
          Tienes permisos de solo lectura. No puedes crear, editar o eliminar dispositivos.
        </p>
      )}

      <div className={cardClass}>
        {loading ? (
          <LoadingState label="Cargando dispositivos…" />
        ) : filteredData.length === 0 ? (
          isSearching ? (
            <LoadingState label="Buscando dispositivos…" />
          ) : searchResult !== null ? (
            <EmptyState title="Sin resultados" description={emptySearchDescription} />
          ) : (
            <EmptyState
              title="Aún no hay dispositivos"
              description={permissions.canCreate ? 'Agrega el primero con el botón “Agregar dispositivo”.' : undefined}
            />
          )
        ) : (
          <BodycamTable
            data={filteredData}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEdit}
            startIndex={searchResult !== null ? searchPaged.from - 1 : pagination.from - 1}
            canEdit={permissions.canEdit}
            canDelete={permissions.canDelete}
          />
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
        <ModalBodycam
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
