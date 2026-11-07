import React, { useEffect, useState, useCallback } from 'react'
import IncidenciasTable from '../../components/IncidenciasTable'
import ModalIncidencia from '../../components/ModalIncidencia'
import ModalPDFInforme from '../../components/ModalPDFInforme'
import ModalPDFInasistencias from '../../components/ModalPDFInasistencias'
import AlertModal, { type AlertModalType } from '../../components/AlertModal'
import ConfirmModal, { type ConfirmModalType } from '../../components/ConfirmModal'
import Button from '@/components/UI/Button'
import PageHeader from '@/components/UI/PageHeader'
import SearchInput from '@/components/UI/SearchInput'
import Pagination from '@/components/UI/Pagination'
import { PAGE_SIZE } from '@/hooks/usePagedList'
import Badge from '@/components/UI/Badge'
import { Select } from '@/components/UI/Field'
import { EmptyState, LoadingState } from '@/components/UI/EmptyState'
import { loadIncidencias, saveIncidencias } from '../../utils/storage'
import { createReport, mapFormDataToAPI, getReports, getReportById, deleteReport, searchReport, sendToValidator, validateReport, exportReportsExcel } from '../../api/report'
import { getSubgerencias } from '../../api/offender'
import useSubjects from '../../hooks/Subject/useSubjects'
import useLacks from '../../hooks/Lack/useLacks'
import useJurisdictions from '../../hooks/Jurisdiction/useJurisdictions'
import { getModulePermissions } from '../../utils/permissions'
import { useAppSelector } from '../../store/hooks'
import { FiDownload, FiFilter, FiPlus } from 'react-icons/fi'
import { initSocket, onReportStatusChanged, onReportStatusValidate, disconnectSocket } from '../../services/websocket'
import type {
  ISODateString,
  Evidence,
  ID,
  Incidencia,
  IncidenciaForm,
  IncidenciaStatus,
  Lead,
  NamedRef,
  Offender,
  PaginationMeta,
  Process,
  Report,
  ReportFilters,
  ReportHeader,
  Shift,
  StoredIncidencia,
  TablePagination,
} from '@/types'
import { cardClass, cn, fitPage } from '../../utils/classes'

/** Forma mínima de un error (axios / NestJS) que lee esta página. */
interface ApiErrorLike {
  response?: { data?: { message?: string | string[] } };
  message?: string;
}

/** Cuerpo de respuesta de acciones (ApiResponse o ApiMessageResponse): solo se leen `message`. */
interface ActionResponse {
  message?: string | null;
  data?: { message?: string | null } | null;
}

/** Estado de los filtros. Los valores de los <select> llegan como string. */
interface IncidenciasFilters {
  turno: string;
  search: string;
  lackId: string;
  subjectId: string;
  jurisdictionId: string;
  subgerencia: string;
  showDeleted: 'all' | 'active' | 'deleted';
  process: string;
}

interface AlertModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: AlertModalType;
}

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: ConfirmModalType;
  confirmText?: string;
  onConfirm: (() => void) | null;
}

/** Reporte tal como llega por WebSocket (campos parciales). */
interface ReportSocketPayload {
  id?: ID;
  report_id?: ID;
  reportId?: ID;
  code?: string | null;
  status?: string;
  state?: string;
  process?: string | null;
  offender?: Partial<Offender> | null;
  subject?: { name: string } | null;
  lack?: { name: string } | null;
  bodycam?: { name: string } | null;
  bodycam_user?: string | null;
  camera_number?: string | null;
  date?: ISODateString;
  shift?: string | null;
  jurisdiction?: NamedRef | null;
  user?: { name: string; lastname: string } | null;
  header?: ReportHeader | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  evidences?: Evidence[];
  message?: string | null;
  link?: string | null;
  created_at?: ISODateString;
  updated_at?: ISODateString;
  deleted_at?: ISODateString | null;
}

/** Reporte de búsqueda: el lack puede traer fechas de auditoría. */
interface SearchReportRecord extends Report {
  lack: NamedRef & { created_at?: ISODateString; updated_at?: ISODateString };
}

/** Opciones del control de estado (mismos valores que los antiguos <option> de filters.process) */
const STATUS_OPTIONS: { value: string; label: string; dot?: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'null', label: 'Borrador', dot: '#94a3b8' },
  { value: 'PENDING', label: 'Pendiente', dot: 'var(--c-amber)' },
  { value: 'APPROVED', label: 'Aprobado', dot: 'var(--c-lime)' },
  { value: 'REJECTED', label: 'Rechazado', dot: 'var(--c-red)' },
]

/** Clase de los selects de filtros avanzados (`!w-auto` porque el kit Select fuerza w-full) */
const advancedSelect = 'h-9 !w-auto max-w-[220px]'

/** Convierte incidencias de la API al formato legado de localStorage (utils/storage.ts). */
function toStoredList(list: Incidencia[]): StoredIncidencia[] {
  return list as unknown as StoredIncidencia[];
}

/** Convierte el formato legado de localStorage a incidencias (campos faltantes se heredan tal cual). */
function fromStoredList(list: StoredIncidencia[]): Incidencia[] {
  return list as unknown as Incidencia[];
}

/** Mensaje de error para AlertModal: `response.data.message` (puede ser lista), luego `message`, luego fallback. */
function errorMessageOf(error: unknown, fallback: string): string {
  const err = error as ApiErrorLike;
  return (err.response?.data?.message as string | undefined) || err.message || fallback;
}

export default function IncidenciasPage() {
  const { role: userRole } = useAppSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'incidencias')

  /** Valores iniciales de los filtros; "Limpiar filtros" vuelve a ellos */
  const defaultFilters: IncidenciasFilters = {
    turno: '', // Ahora usa letras: M=Mañana, T=Tarde, N=Noche, ''=Todos
    search: '',
    lackId: '', // Filtro por ID de falta
    subjectId: '', // Filtro por ID de asunto
    jurisdictionId: '', // Filtro por ID de jurisdicción
    subgerencia: '', // Filtro por subgerencia
    showDeleted: permissions.canDelete ? 'all' : 'active', // 'all' = todos, 'active' = solo activos, 'deleted' = solo eliminados
    process: '' // '' = todos, 'PENDING', 'APPROVED', 'REJECTED', null=draft
  }

  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [editItem, setEditItem] = useState<Incidencia | null>(null)
  const [filters, setFilters] = useState<IncidenciasFilters>(defaultFilters)
  const [showAdvanced, setShowAdvanced] = useState(false) // Panel de filtros avanzados (asunto, falta, jurisdicción, subgerencia, turno)
  const [subgerencias, setSubgerencias] = useState<string[]>([])
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
  const [exporting, setExporting] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Trigger para forzar recarga
  const [searchResult, setSearchResult] = useState<Incidencia[] | null>(null) // Resultado de búsqueda por ID
  const [isSearching, setIsSearching] = useState(false) // Indica si está buscando
  const [searchPagination, setSearchPagination] = useState<TablePagination | null>(null) // Paginación de búsqueda
  const [isSearchMode, setIsSearchMode] = useState(false) // Indica si está en modo búsqueda

  // Estados para modales personalizados
  const [alertModal, setAlertModal] = useState<AlertModalState>({ isOpen: false, title: '', message: '', type: 'success' })
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null })

  const { subjects, loading: subjectsLoading } = useSubjects()
  const { lacks, loading: lacksLoading } = useLacks()
  const { jurisdictions, loading: jurisdictionsLoading } = useJurisdictions()

  useEffect(() => {
    getSubgerencias().then(data => {
      const lista: string[] = Array.isArray(data) ? data : []
      const seen = new Map<string, string>()
      lista.forEach(s => {
        const key = s.trim().toUpperCase()
        if (key && !seen.has(key)) seen.set(key, s.trim())
      })
      setSubgerencias([...seen.values()].sort())
    }).catch(() => {})
  }, [])

  // Función para actualizar estado de un reporte específico
  const updateReportStatus = useCallback(async (reportId: ID, updates: Partial<Incidencia>, fullData: ReportSocketPayload | null = null): Promise<void> => {
    // Actualizar en la lista principal
    setIncidencias(prev => {
      const found = prev.find(i => i.id === reportId)

      // Si el reporte ya está en la lista, actualizarlo
      if (found) {
        return prev.map(inc =>
          inc.id === reportId ? { ...inc, ...updates } : inc
        )
      }

      // Si NO está en la lista pero tenemos los datos completos del socket, agregarlo
      if (fullData && fullData.offender && fullData.subject && fullData.lack) {
        const newReport = {
          id: fullData.id,
          code: fullData.code || null,
          dni: fullData.offender?.dni || '',
          asunto: fullData.subject?.name || '',
          falta: fullData.lack?.name || '',
          tipoInasistencia: fullData.subject?.name === 'Inasistencia' ? fullData.lack?.name : null,
          medio: fullData.bodycam ? 'Bodycam' : (fullData.camera_number ? 'Cámara' : 'Otro'),
          tipoMedio: fullData.bodycam ? 'bodycam' : (fullData.camera_number ? 'camara' : 'bodycam'),
          numeroCamara: fullData.camera_number || '',
          fechaIncidente: fullData.date ? fullData.date.substring(0, 10).split('-').reverse().join('/') : '',
          horaIncidente: fullData.date ? fullData.date.substring(11, 16) : '',
          turno: fullData.offender?.shift || fullData.shift || '',
          cargo: fullData.offender?.job || '',
          regLab: fullData.offender?.regime || '',
          jurisdiccion: fullData.jurisdiction?.name || '',
          jurisdictionId: fullData.jurisdiction?.id || null,
          bodycamNumber: fullData.bodycam?.name || '',
          bodycamAsignadaA: fullData.bodycam_user || '',
          encargadoBodycam: fullData.user ? `${fullData.user.name} ${fullData.user.lastname}`.trim() : '',
          dirigidoA: fullData.header?.to?.job || '',
          destinatario: fullData.header?.to?.name || '',
          cargoDestinatario: fullData.header?.to?.job || '',
          cc: (fullData.header?.cc || []).map(c => c.name),
          ubicacion: {
            address: fullData.address || '',
            coordinates: [fullData.latitude || null, fullData.longitude || null]
          },
          nombreCompleto: fullData.offender ? `${fullData.offender.name} ${fullData.offender.lastname}`.trim() : '',
          status: fullData.process ? fullData.process.toLowerCase() : 'draft',
          evidences: fullData.evidences || [],
          message: fullData.message || '',
          link: fullData.link || '',
          createdAt: fullData.created_at || fullData.date,
          updatedAt: fullData.updated_at || fullData.date,
          deletedAt: fullData.deleted_at || null
        } as Incidencia

        // Agregar al inicio de la lista
        return [newReport, ...prev]
      }

      return prev
    })

    // Actualizar en searchResult si existe
    setSearchResult(prev => {
      if (!prev || prev.length === 0) return prev

      const found = prev.find(i => i.id === reportId)
      if (found) {
        return prev.map(inc =>
          inc.id === reportId ? { ...inc, ...updates } : inc
        )
      }

      return prev
    })
  }, [])

  // WebSocket: Escuchar cambios de estado de reportes en tiempo real
  useEffect(() => {
    // Inicializar conexión WebSocket
    initSocket()

    // Suscribirse al evento de cambio de estado
    const unsubscribeStatusChanged = onReportStatusChanged<ReportSocketPayload>((data) => {
      if (!data) return

      const reportId = data.id || data.report_id || data.reportId
      const newStatus = data.status || data.process || data.state

      if (reportId && newStatus) {
        updateReportStatus(
          reportId,
          {
            status: newStatus.toLowerCase() as IncidenciaStatus,
            ...(data.code ? { code: data.code } : {})
          },
          data
        )
      }
    })

    // Suscribirse al evento de validación (APPROVED/REJECTED)
    const unsubscribeStatusValidate = onReportStatusValidate<ReportSocketPayload>((data) => {
      if (!data) return

      const reportId = data.id || data.report_id || data.reportId
      const newStatus = data.status || data.process || data.state

      if (reportId) {
        const updates: Partial<Incidencia> = {}

        if (newStatus) {
          updates.status = newStatus.toLowerCase() as IncidenciaStatus
        }
        if (data.code) {
          updates.code = data.code
        }

        if (Object.keys(updates).length > 0) {
          updateReportStatus(reportId, updates, data)
        }
      }
    })

    // Cleanup: desuscribirse al desmontar
    return () => {
      unsubscribeStatusChanged()
      unsubscribeStatusValidate()
      disconnectSocket()
    }
  }, [updateReportStatus])

  // Cargar incidencias desde la API con paginación y filtros
  useEffect(() => {
    async function fetchIncidencias() {
      setLoading(true)
      try {
        // Construir objeto de filtros solo con valores no vacíos
        const apiFilters: ReportFilters = {}
        if (filters.lackId) apiFilters.lackId = filters.lackId
        if (filters.subjectId) apiFilters.subjectId = filters.subjectId
        if (filters.jurisdictionId) apiFilters.jurisdictionId = filters.jurisdictionId
        if (filters.turno) apiFilters.shift = filters.turno as Shift
        if (filters.process) apiFilters.process = filters.process as Process
        if (filters.subgerencia) apiFilters.subgerencia = filters.subgerencia

        console.log('🔍 Filtros enviados al backend:', apiFilters)

        const result = await getReports(currentPage, itemsPerPage, apiFilters)
        setIncidencias(result.data)
        setPagination(result.pagination)
        saveIncidencias(toStoredList(result.data)) // opcional: respaldo local
      } catch (error) {
        const localData = loadIncidencias()
        setIncidencias(fromStoredList(localData))
      } finally {
        setLoading(false)
      }
    }

    fetchIncidencias()
  }, [currentPage, itemsPerPage, refreshTrigger, filters.lackId, filters.subjectId, filters.jurisdictionId, filters.turno, filters.process, filters.subgerencia])

  // Mantener sincronizado localStorage si cambian las incidencias
  useEffect(() => {
    saveIncidencias(toStoredList(incidencias))
  }, [incidencias])

  // Crear o editar incidencia
  async function handleCreate(data: IncidenciaForm, allLeads: Lead[] = []): Promise<void> {
    if (editItem) {
      setIncidencias(prev =>
        prev.map(i =>
          i.id === editItem.id ? ({ ...i, ...data, updatedAt: new Date().toISOString() } as Incidencia) : i
        )
      )
      setEditItem(null)
      setShowModal(false)
    } else {
      try {
        const apiData = mapFormDataToAPI(data, allLeads)
        const response = await createReport(apiData)

        setShowModal(false)
        setAlertModal({
          isOpen: true,
          title: '¡Éxito!',
          message: 'Incidencia creada exitosamente',
          type: 'success'
        })

        // Recargar la primera página para ver la nueva incidencia
        setCurrentPage(1)

        // Forzar recarga de datos
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        const err = error as ApiErrorLike

        // Mostrar error más detallado
        let errorMessage = 'Error al crear la incidencia';

        if (err.response?.data?.message) {
          // Si el mensaje es un array, convertirlo a string
          if (Array.isArray(err.response.data.message)) {
            errorMessage = 'Errores de validación:\n' + err.response.data.message.join('\n');
          } else {
            errorMessage = err.response.data.message;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }

        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: errorMessage,
          type: 'error'
        })
      }
    }
  }

  async function handleDelete(id: ID, status: IncidenciaStatus): Promise<void> {
    // Función para ejecutar la eliminación
    const executeDelete = async () => {
      try {
        const response: ActionResponse = await deleteReport(id)

        setAlertModal({
          isOpen: true,
          title: '¡Éxito!',
          message: response.data?.message || response.message || 'Incidencia deshabilitada exitosamente',
          type: 'success'
        })

        // Recargar datos desde la API
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        const err = error as ApiErrorLike

        let errorMessage = 'Error al deshabilitar la incidencia'

        if (err.response?.data?.message) {
          errorMessage = Array.isArray(err.response.data.message)
            ? err.response.data.message.join('\n')
            : err.response.data.message
        } else if (err.message) {
          errorMessage = err.message
        }

        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: errorMessage,
          type: 'error'
        })
      }
    }

    // Advertencia especial para registros aprobados
    if (status === 'approved') {
      setConfirmModal({
        isOpen: true,
        title: 'Advertencia: informe aprobado',
        message: 'Este informe está aprobado y tiene un código oficial asignado.\n\nAl eliminarlo:\n• El código quedará "consumido" y no se reutilizará\n• El informe puede ser restaurado más tarde si es necesario\n• Se recomienda consultar con un supervisor antes de proceder\n\n¿Está completamente seguro de que desea deshabilitar este informe aprobado?',
        type: 'danger',
        onConfirm: () => {
          setConfirmModal({ ...confirmModal, isOpen: false })
          // Segunda confirmación para informes aprobados
          setConfirmModal({
            isOpen: true,
            title: 'Confirmación final',
            message: 'Esta es su última oportunidad para cancelar.\n\n¿Realmente desea deshabilitar este informe aprobado?',
            type: 'danger',
            confirmText: 'Sí, deshabilitar',
            onConfirm: () => {
              setConfirmModal({ ...confirmModal, isOpen: false })
              executeDelete()
            }
          })
        }
      })
    } else {
      // Confirmación normal para otros estados
      setConfirmModal({
        isOpen: true,
        title: 'Confirmar acción',
        message: '¿Estás seguro de deshabilitar esta incidencia?\n\nPodrá ser restaurada más tarde.',
        type: 'warning',
        confirmText: 'Sí, deshabilitar',
        onConfirm: () => {
          setConfirmModal({ ...confirmModal, isOpen: false })
          executeDelete()
        }
      })
    }
  }

  async function handleSendToValidator(reportId: ID): Promise<void> {
    setConfirmModal({
      isOpen: true,
      title: 'Enviar a validador',
      message: '¿Enviar esta incidencia al validador?\n\nDebe tener al menos una imagen adjunta.',
      type: 'info',
      confirmText: 'Sí, enviar',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false })
        try {
          const response: ActionResponse = await sendToValidator(reportId)
          setAlertModal({
            isOpen: true,
            title: '¡Éxito!',
            message: response.data?.message || response.message || 'Incidencia enviada al validador exitosamente',
            type: 'success'
          })
          setRefreshTrigger(prev => prev + 1)
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: errorMessageOf(error, 'Error al enviar incidencia'),
            type: 'error'
          })
        }
      }
    })
  }

  async function handleApprove(reportId: ID): Promise<void> {
    setConfirmModal({
      isOpen: true,
      title: 'Aprobar incidencia',
      message: '¿Aprobar esta incidencia?\n\nSe generará automáticamente un código oficial para el informe.',
      type: 'info',
      confirmText: 'Sí, aprobar',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false })
        try {
          const response: ActionResponse = await validateReport(reportId, true)
          setAlertModal({
            isOpen: true,
            title: '¡Éxito!',
            message: response.data?.message || response.message || 'Incidencia aprobada exitosamente',
            type: 'success'
          })
          setRefreshTrigger(prev => prev + 1)
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: errorMessageOf(error, 'Error al aprobar incidencia'),
            type: 'error'
          })
        }
      }
    })
  }

  async function handleReject(reportId: ID): Promise<void> {
    setConfirmModal({
      isOpen: true,
      title: 'Rechazar incidencia',
      message: '¿Rechazar esta incidencia?\n\nEl informe no se aprobará y no se generará código oficial.',
      type: 'warning',
      confirmText: 'Sí, rechazar',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false })
        try {
          const response: ActionResponse = await validateReport(reportId, false)
          setAlertModal({
            isOpen: true,
            title: 'Incidencia rechazada',
            message: response.data?.message || response.message || 'Incidencia rechazada exitosamente',
            type: 'info'
          })
          setRefreshTrigger(prev => prev + 1)
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: errorMessageOf(error, 'Error al rechazar incidencia'),
            type: 'error'
          })
        }
      }
    })
  }

  function handleEdit(item: Incidencia) {
    setEditItem(item)
    setShowPDFModal(true)
  }

  function getInasistenciasPorDNI(dni: string): Incidencia[] {
    return incidencias.filter(inc => inc.dni === dni && inc.falta && inc.falta.startsWith('Inasistencia'))
  }

  // Funciones de paginación
  function handlePageChange(newPage: number) {
    // Usar searchPagination si está en modo búsqueda, sino usar pagination normal
    const paginationToUse = isSearchMode && searchPagination ? searchPagination : pagination

    if (newPage >= 1 && newPage <= paginationToUse.totalPages) {
      setCurrentPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' }) // Scroll to top al cambiar página
    }
  }

  // Verificar si el término de búsqueda es un UUID
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  // Buscar incidencia por ID o por otros campos cuando el usuario escribe
  useEffect(() => {
    const searchTerm = filters.search.trim()

    // Si no hay término de búsqueda, limpiar resultados y salir del modo búsqueda
    if (!searchTerm) {
      setSearchResult(null)
      setSearchPagination(null)
      // Solo resetear página si estábamos en modo búsqueda
      if (isSearchMode) {
        setCurrentPage(1)
      }
      setIsSearchMode(false)
      return
    }

    // Activar modo búsqueda (y resetear a página 1 solo si acabamos de entrar al modo búsqueda)
    if (!isSearchMode) {
      setCurrentPage(1)
    }
    setIsSearchMode(true)

    // Si es un UUID, buscar por ID
    if (isUUID(searchTerm)) {
      const searchById = async () => {
        setIsSearching(true)
        try {
          const result = await getReportById(searchTerm)

          if (result.found && result.data.length > 0) {
            setSearchResult(result.data)
            setSearchPagination(null) // Búsqueda por ID no tiene paginación
          } else {
            setSearchResult([])
            setSearchPagination(null)
          }
        } catch (error) {
          setSearchResult(null)
          setSearchPagination(null)
        } finally {
          setIsSearching(false)
        }
      }

      searchById()
    } else {
      // Si NO es UUID, buscar por DNI, nombre, etc. en toda la base de datos
      const searchByFields = async () => {
        setIsSearching(true)
        try {
          // Construir la URL con paginación
          const response = await searchReport(searchTerm, currentPage, itemsPerPage)

          // La API devuelve los datos en response.data?.data?.data
          const results = (response?.data?.data || []) as SearchReportRecord[]
          const paginationData: Partial<PaginationMeta> = response?.data || {}

          if (results.length > 0) {
            // Transformar los resultados al formato esperado
            const transformed = results.map(r => {
              // Mismo criterio de inasistencias que el listado normal (api/report.ts)
              const isAbsenceReport = r.absences && r.absences.length > 0
              const absenceData = isAbsenceReport ? r.absences[0] : null

              return {
                id: r.id,
                dni: r.offender?.dni || '',
                asunto: r.subject?.name || '',
                falta: r.lack?.name || '',
                tipoInasistencia: r.subject?.name === 'Inasistencia' ? r.lack?.name : null,
                medio: r.bodycam ? 'Bodycam' : 'Otro',
                fechaIncidente: new Date(r.date).toLocaleDateString('es-PE'),
                horaIncidente: new Date(r.date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
                turno: r.offender?.shift || '',
                cargo: r.offender?.job || '',
                regLab: r.offender?.regime || '',
                subgerencia: r.offender?.subgerencia || '',
                jurisdiccion: r.jurisdiction?.name || r.offender?.subgerencia || '',
                bodycamNumber: r.bodycam?.name || '',
                bodycamAsignadaA: r.bodycam_user || '',
                encargadoBodycam: r.bodycam_supervisor || (r.user ? `${r.user.name} ${r.user.lastname}` : ''),
                registradoPor: r.user ? `${r.user.name} ${r.user.lastname}`.trim() : '',
                dirigidoA: r.header?.to?.job || '',
                destinatario: r.header?.to?.name || '',
                nombreCompleto: r.offender ? `${r.offender.name} ${r.offender.lastname}` : '',
                status: r.process ? r.process.toLowerCase() : 'draft', // process: PENDING/APPROVED/REJECTED
                evidences: r.evidences || [],
                // Datos específicos de reportes de inasistencias
                isAbsenceReport: isAbsenceReport,
                absences: r.absences || [],
                absenceStart: absenceData?.start || null,
                absenceEnd: absenceData?.end || null,
                absenceMode: absenceData?.mode || null, // JUSTIFIED o UNJUSTIFIED
                createdAt: r.lack?.created_at || r.date,
                updatedAt: r.lack?.updated_at || r.date
              }
            }) as Incidencia[]

            setSearchResult(transformed)

            // Guardar paginación de búsqueda
            const currentPageNum = paginationData.currentPage || currentPage
            const totalNum = paginationData.totalCount || transformed.length
            const perPageNum = itemsPerPage
            const totalPagesNum = paginationData.totalPages || Math.ceil(totalNum / perPageNum)
            const from = totalNum === 0 ? 0 : ((currentPageNum - 1) * perPageNum) + 1
            const to = Math.min(currentPageNum * perPageNum, totalNum)

            setSearchPagination({
              currentPage: currentPageNum,
              totalPages: totalPagesNum,
              perPage: perPageNum,
              total: totalNum,
              from: from,
              to: to
            })
          } else {
            setSearchResult([])
            setSearchPagination(null)
          }
        } catch (error) {
          setSearchResult(null)
          setSearchPagination(null)
        } finally {
          setIsSearching(false)
        }
      }

      searchByFields()
    }
  }, [filters.search, currentPage, itemsPerPage])

  async function handleExportExcel() {
    setExporting(true)
    try {
      // Los filtros de tabla (turno/process) son strings de los <select>; la API los espera como ReportFilters
      await exportReportsExcel(filters as unknown as ReportFilters)
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo exportar el Excel. Intente nuevamente.',
        type: 'error'
      })
    } finally {
      setExporting(false)
    }
  }

  // Todos los filtros se manejan en el backend, incluyendo turno y process
  // Filtrar por estado (activos/eliminados) en el frontend
  const applyFrontendFilters = (data: Incidencia[]): Incidencia[] => {
    let result = data

    // Filtrar por activos/eliminados
    if (filters.showDeleted === 'active') {
      result = result.filter(item => !item.deletedAt)
    } else if (filters.showDeleted === 'deleted') {
      result = result.filter(item => item.deletedAt)
    }

    return result
  }

  const filteredData = searchResult !== null
    ? applyFrontendFilters(searchResult) // Si hay resultado de búsqueda, aplicar filtros
    : applyFrontendFilters(incidencias) // Aplicar filtros a incidencias

  // Filtros avanzados activos (para el contador de "Más filtros")
  const advancedCount = [filters.subjectId, filters.lackId, filters.jurisdictionId, filters.subgerencia, filters.turno].filter(Boolean).length

  // Hay algún filtro distinto de su valor inicial (búsqueda, estado o avanzados)
  const hasActiveFilters = (Object.keys(defaultFilters) as (keyof IncidenciasFilters)[]).some(key => filters[key] !== defaultFilters[key])

  // Paginación que se muestra: la de búsqueda si está en modo búsqueda, sino la normal
  const paginationData = isSearchMode && searchPagination ? searchPagination : pagination

  function handleClearFilters() {
    setFilters(defaultFilters)
    setCurrentPage(1)
  }

  return (
    // La página ocupa justo el alto disponible (h-full): solo la tabla desplaza, la paginación queda a la vista.
    // En pantallas muy bajas el mínimo evita aplastar la tabla y es el <main> el que desplaza.
    <div className={fitPage}>
      <PageHeader
        title="Incidencias"
        description={`Registra, envía y valida los informes de incidencias del personal. · ${pagination.total} registros`}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<FiDownload />}
              onClick={handleExportExcel}
              loading={exporting}
              title="Exportar lista a Excel con los filtros actuales"
            >
              Exportar a Excel
            </Button>

            {permissions.canCreate && (
              <Button icon={<FiPlus />} onClick={() => { setEditItem(null); setShowModal(true) }}>
                Nueva incidencia
              </Button>
            )}
          </>
        }
      >
        <SearchInput
          value={filters.search}
          onChange={v => setFilters(f => ({ ...f, search: v }))}
          placeholder="Buscar por DNI, nombre o código"
          loading={isSearching}
        />

        {/* Estado del informe: mismos valores que el antiguo select de estado */}
        <div role="tablist" aria-label="Filtrar por estado" className="inline-flex max-w-full items-center overflow-x-auto rounded-lg border border-line-strong bg-surface p-0.5">
          {STATUS_OPTIONS.map(option => {
            const active = filters.process === option.value
            return (
              <button
                key={option.value || 'todos'}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setFilters(f => ({ ...f, process: option.value }))
                  setCurrentPage(1)
                }}
                className={cn(
                  'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border-none px-3 text-[13px] font-medium transition-colors duration-150',
                  active ? 'bg-[var(--page-color)] text-[var(--page-fg)]' : 'bg-transparent text-content-2 hover:bg-subtle'
                )}
              >
                {option.dot && <span aria-hidden className="size-1.5 rounded-full" style={{ background: active ? 'currentColor' : option.dot }} />}
                {option.label}
              </button>
            )
          })}
        </div>

        <Button
          variant="secondary"
          icon={<FiFilter />}
          onClick={() => setShowAdvanced(v => !v)}
          aria-expanded={showAdvanced}
          aria-controls={showAdvanced ? 'incidencias-filtros-avanzados' : undefined}
        >
          Más filtros
          {advancedCount > 0 && <Badge tone="info" dot={false}>{advancedCount}</Badge>}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleClearFilters}>
            Limpiar filtros
          </Button>
        )}

        {showAdvanced && (
          <div id="incidencias-filtros-avanzados" className="flex w-full flex-wrap items-center gap-2">
            {/* Filtro por Asunto (Subject) - Usando datos de la API */}
            {subjectsLoading ? (
              <Select disabled aria-label="Asunto" className={advancedSelect}>
                <option>Cargando asuntos...</option>
              </Select>
            ) : (
              <Select
                aria-label="Asunto"
                className={advancedSelect}
                value={filters.subjectId}
                onChange={e => {
                  const selectedSubjectId = e.target.value
                  setFilters(f => ({
                    ...f,
                    subjectId: selectedSubjectId,
                    lackId: '' // Limpiar falta al cambiar asunto
                  }))
                  setCurrentPage(1) // Resetear a página 1 al cambiar filtro
                }}
              >
                <option value="">Todos los asuntos</option>
                {subjects && subjects
                  .filter(subject => !subject.deleted_at) // Solo mostrar asuntos activos
                  .map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
              </Select>
            )}

            {/* Filtro por Falta (Lack) - Usando lacks anidadas del subject seleccionado */}
            {subjectsLoading ? (
              <Select disabled aria-label="Falta" className={advancedSelect}>
                <option>Cargando faltas...</option>
              </Select>
            ) : (
              <Select
                aria-label="Falta"
                className={advancedSelect}
                value={filters.lackId || ''}
                onChange={e => {
                  const selectedLackId = e.target.value
                  setFilters(f => ({
                    ...f,
                    lackId: selectedLackId
                  }))
                  setCurrentPage(1) // Resetear a página 1 al cambiar filtro
                }}
              >
                <option value="">Todas las faltas</option>
                {(() => {
                  // Si hay un subject seleccionado, obtener sus lacks anidadas
                  if (filters.subjectId) {
                    const selectedSubject = subjects.find(s => s.id === filters.subjectId)
                    return (selectedSubject?.lacks || [])
                      .filter(lack => !lack.deleted_at) // Solo mostrar faltas activas
                      .map(lack => (
                        <option key={lack.id} value={lack.id}>
                          {lack.name}
                        </option>
                      ))
                  }
                  // Si no hay subject seleccionado, mostrar todas las lacks de todos los subjects
                  return subjects
                    .filter(subject => !subject.deleted_at) // Solo subjects activos
                    .flatMap(subject => subject.lacks || [])
                    .filter(lack => !lack.deleted_at) // Solo faltas activas
                    .map(lack => (
                      <option key={lack.id} value={lack.id}>
                        {lack.name}
                      </option>
                    ))
                })()}
              </Select>
            )}

            {/* Filtro por Jurisdicción - Envía ID al backend */}
            {jurisdictionsLoading ? (
              <Select disabled aria-label="Jurisdicción" className={advancedSelect}>
                <option>Cargando jurisdicciones...</option>
              </Select>
            ) : (
              <Select
                aria-label="Jurisdicción"
                className={advancedSelect}
                value={filters.jurisdictionId}
                onChange={e => {
                  setFilters(f => ({ ...f, jurisdictionId: e.target.value }))
                  setCurrentPage(1) // Resetear a página 1 al cambiar filtro
                }}
              >
                <option value="">Todas las jurisdicciones</option>
                {jurisdictions
                  .filter(jurisdiction => !jurisdiction.deleted_at) // Solo mostrar jurisdicciones activas
                  .map(jurisdiction => (
                    <option key={jurisdiction.id} value={jurisdiction.id}>
                      {jurisdiction.name}
                    </option>
                  ))}
              </Select>
            )}

            {/* Filtro por Subgerencia */}
            <Select
              aria-label="Subgerencia"
              className={advancedSelect}
              value={filters.subgerencia}
              onChange={e => {
                setFilters(f => ({ ...f, subgerencia: e.target.value }))
                setCurrentPage(1)
              }}
            >
              <option value="">Todas las subgerencias</option>
              {subgerencias.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>

            <Select
              aria-label="Turno"
              className={advancedSelect}
              value={filters.turno}
              onChange={e => setFilters(f => ({ ...f, turno: e.target.value }))}
            >
              <option value="">Todos los turnos</option>
              <option value="M">Mañana</option>
              <option value="T">Tarde</option>
              <option value="N">Noche</option>
            </Select>
          </div>
        )}
      </PageHeader>

      {/* Aviso para CENTINELA: solo puede crear */}
      {!permissions.canDelete && permissions.canCreate && (
        <p className="m-0 mb-3 rounded-lg border border-line bg-subtle px-4 py-2.5 text-[13px] text-content-2">
          Solo puedes crear incidencias. No puedes eliminar incidencias existentes.
        </p>
      )}

      {loading ? (
        <div className={cardClass}>
          <LoadingState label="Cargando incidencias..." />
        </div>
      ) : filteredData.length === 0 && hasActiveFilters ? (
        <div className={cardClass}>
          <EmptyState
            title="Sin resultados"
            description={filters.search.trim()
              ? `No hay incidencias que coincidan con “${filters.search.trim()}”.`
              : 'No hay incidencias que coincidan con los filtros seleccionados.'}
            action={<Button variant="secondary" onClick={handleClearFilters}>Limpiar filtros</Button>}
          />
        </div>
      ) : (
        <IncidenciasTable
          data={filteredData}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onSend={handleSendToValidator}
          onApprove={handleApprove}
          onReject={handleReject}
          startIndex={searchResult !== null ? ((isSearchMode && searchPagination) ? searchPagination.from - 1 : 0) : pagination.from - 1}
          canDelete={permissions.canDelete}
          canSend={permissions.canSend}
          canValidate={permissions.canValidate}
        />
      )}

      {/* Paginación (misma condición que antes: búsqueda con paginación o listado normal).
          Queda siempre al pie de la pantalla: la tabla de arriba es la que desplaza. */}
      {!loading && (!isSearchMode || searchPagination) && (
        <div className="mt-3 shrink-0 overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_var(--shadow)] [&>div]:border-t-0">
          <Pagination
            page={currentPage}
            totalPages={paginationData.totalPages}
            total={paginationData.total}
            from={paginationData.from}
            to={paginationData.to}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {showModal && (
        <ModalIncidencia
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          onSave={handleCreate}
        />
      )}

      {showPDFModal && editItem && (
        // Mostrar modal diferente según el tipo de incidencia
        editItem.asunto === 'Inasistencia' ? (
          <ModalPDFInasistencias
            incidencia={editItem}
            inasistenciasHistoricas={getInasistenciasPorDNI(editItem.dni)}
            onClose={() => { setShowPDFModal(false); setEditItem(null) }}
            onSave={() => setRefreshTrigger(prev => prev + 1)}
          />
        ) : (
          <ModalPDFInforme
            incidencia={editItem}
            inasistenciasHistoricas={getInasistenciasPorDNI(editItem.dni)}
            onClose={() => { setShowPDFModal(false); setEditItem(null) }}
            onSave={() => setRefreshTrigger(prev => prev + 1)}
          />
        )
      )}

      {/* Modales personalizados */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm ?? (() => {})}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  )
}
