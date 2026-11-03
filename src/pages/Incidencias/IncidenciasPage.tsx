import React, { useEffect, useState, useCallback } from 'react'
import IncidenciasTable from '../../components/IncidenciasTable'
import ModalIncidencia from '../../components/ModalIncidencia'
import ModalPDFInforme from '../../components/ModalPDFInforme'
import ModalPDFInasistencias from '../../components/ModalPDFInasistencias'
import AlertModal, { type AlertModalType } from '../../components/AlertModal'
import ConfirmModal, { type ConfirmModalType } from '../../components/ConfirmModal'
import { loadIncidencias, saveIncidencias } from '../../utils/storage'
import { createReport, mapFormDataToAPI, getReports, getReportById, deleteReport, searchReport, sendToValidator, validateReport, exportReportsExcel } from '../../api/report'
import { getSubgerencias } from '../../api/offender'
import useSubjects from '../../hooks/Subject/useSubjects'
import useLacks from '../../hooks/Lack/useLacks'
import useJurisdictions from '../../hooks/Jurisdiction/useJurisdictions'
import { getModulePermissions } from '../../utils/permissions'
import { useAppSelector } from '../../store/hooks'
import { FaPlus, FaSearch, FaFileExcel } from 'react-icons/fa'
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
import { btnPrimary, btnSecondary, cn, incidenciasPage, pageHeaderIncidencias, pageTitle, tableWrapper } from '../../utils/classes'

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

/** Fila superior de la cabecera (antes .header-top); en tablet/movil apila y estira los botones */
const headerTop =
  'flex w-full items-center justify-between max-[768px]:flex-col max-[768px]:items-start max-[768px]:gap-[15px] max-[768px]:[&_button]:w-full max-[768px]:[&_button]:justify-center'

/** Barra de filtros (antes .header-filters) */
const headerFilters =
  'flex w-full flex-wrap items-center gap-3 rounded-[12px] border border-line bg-[rgba(255,255,255,0.4)] p-4 [backdrop-filter:blur(5px)] shadow-[0_4px_15px_rgba(0,0,0,0.03)] dark:bg-[rgba(30,41,59,0.4)] max-[768px]:flex-col max-[768px]:items-stretch'

/** Select de filtro de la cabecera (antes .filter-select). La flecha es un SVG embebido; las clases van completas porque Tailwind no detecta clases armadas por interpolacion */
const filterSelect = cn(
  'flex-[1_1_180px] min-w-[160px] appearance-none cursor-pointer rounded-[8px] border border-line bg-surface py-2.5 pl-3.5 pr-10 text-[0.9rem] text-content outline-none transition-all duration-200 ease-[ease]',
  '[background-image:url(data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27currentColor%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3e%3cpolyline%20points=%276%209%2012%2015%2018%209%27%3e%3c/polyline%3e%3c/svg%3e)] bg-no-repeat [background-position:right_10px_center] [background-size:16px]',
  'hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] focus:-translate-y-0.5 focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]',
  'dark:text-[#f8fafc] dark:[background-image:url(data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23f8fafc%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3e%3cpolyline%20points=%276%209%2012%2015%2018%209%27%3e%3c/polyline%3e%3c/svg%3e)]',
  'max-[768px]:w-full max-[768px]:flex-none'
)

/** Contenedor del buscador (antes .search-container) */
const searchContainer =
  'relative flex-[2_1_300px] min-w-[250px] max-[768px]:order-[-1] max-[768px]:mb-2.5 max-[768px]:w-full max-[768px]:flex-none'

/** Icono de lupa dentro del buscador (antes .search-icon) */
const searchIcon = 'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[1.1rem] text-muted'

/** Input del buscador (antes .search-input) */
const searchInput =
  'w-full rounded-[8px] border border-line bg-surface py-3 pl-[45px] pr-3.5 text-[0.95rem] text-content outline-none transition-all duration-300 ease-[ease] focus:border-primary focus:shadow-[0_0_0_4px_rgba(59,130,246,0.15)] dark:text-[#f8fafc]'

/** Indicador de "buscando" dentro del buscador (antes .search-spinner; su animacion `spin` no existe, se omite) */
const searchSpinner = 'absolute right-3.5 top-1/2 -translate-y-1/2 text-[1rem]'

/** Botones anterior / siguiente: .btn-secondary con padding y flex en linea */
const navButton = cn(btnSecondary, 'flex items-center gap-[5px] px-4! py-2! disabled:cursor-not-allowed disabled:opacity-50')

/** Boton de pagina numerica (activo / inactivo) */
const pageButton = (active: boolean) =>
  cn(
    'min-w-10 cursor-pointer rounded-[4px] border px-3 py-2',
    active ? 'border-primary bg-primary font-bold text-white' : 'border-line bg-transparent font-normal [color:inherit]'
  )

export default function IncidenciasPage() {
  const { role: userRole } = useAppSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'incidencias')

  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [editItem, setEditItem] = useState<Incidencia | null>(null)
  const [filters, setFilters] = useState<IncidenciasFilters>({
    turno: '', // Ahora usa letras: M=Mañana, T=Tarde, N=Noche, ''=Todos
    search: '',
    lackId: '', // Filtro por ID de falta
    subjectId: '', // Filtro por ID de asunto
    jurisdictionId: '', // Filtro por ID de jurisdicción
    subgerencia: '', // Filtro por subgerencia
    showDeleted: permissions.canDelete ? 'all' : 'active', // 'all' = todos, 'active' = solo activos, 'deleted' = solo eliminados
    process: '' // '' = todos, 'PENDING', 'APPROVED', 'REJECTED', null=draft
  })
  const [subgerencias, setSubgerencias] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10) // Nuevo estado para items por página
  const [pagination, setPagination] = useState<TablePagination>({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
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

  // 🔹 Función para actualizar estado de un reporte específico
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

  // 🔹 WebSocket: Escuchar cambios de estado de reportes en tiempo real
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

  // 🔹 NUEVO: cargar incidencias desde la API con paginación y filtros
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

  // 🔹 Crear o editar incidencia
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
        title: '⚠️ ADVERTENCIA: Informe Aprobado',
        message: 'Este informe está APROBADO y tiene un código oficial asignado.\n\nAl eliminarlo:\n• El código quedará "consumido" y no se reutilizará\n• El informe puede ser restaurado más tarde si es necesario\n• Se recomienda consultar con un supervisor antes de proceder\n\n¿Está completamente seguro de que desea deshabilitar este informe aprobado?',
        type: 'danger',
        onConfirm: () => {
          setConfirmModal({ ...confirmModal, isOpen: false })
          // Segunda confirmación para informes aprobados
          setConfirmModal({
            isOpen: true,
            title: '⚠️ CONFIRMACIÓN FINAL',
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

  // 🔹 Funciones de paginación
  function handlePageChange(newPage: number) {
    // Usar searchPagination si está en modo búsqueda, sino usar pagination normal
    const paginationToUse = isSearchMode && searchPagination ? searchPagination : pagination

    if (newPage >= 1 && newPage <= paginationToUse.totalPages) {
      setCurrentPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' }) // Scroll to top al cambiar página
    }
  }

  function handlePreviousPage() {
    handlePageChange(currentPage - 1)
  }

  function handleNextPage() {
    handlePageChange(currentPage + 1)
  }

  function handleItemsPerPageChange(newItemsPerPage: number) {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Volver a la primera página al cambiar items por página
  }

  // 🔹 Verificar si el término de búsqueda es un UUID
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  // 🔹 Buscar incidencia por ID o por otros campos cuando el usuario escribe
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
            const transformed = results.map(r => ({
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
              jurisdiccion: r.jurisdiction?.name || r.offender?.subgerencia || '',
              bodycamNumber: r.bodycam?.name || '',
              bodycamAsignadaA: r.bodycam_user || '',
              encargadoBodycam: r.bodycam_supervisor || (r.user ? `${r.user.name} ${r.user.lastname}` : ''),
              dirigidoA: r.header?.to?.job || '',
              destinatario: r.header?.to?.name || '',
              nombreCompleto: r.offender ? `${r.offender.name} ${r.offender.lastname}` : '',
              status: r.process ? r.process.toLowerCase() : 'draft', // process: PENDING/APPROVED/REJECTED
              evidences: r.evidences || [],
              createdAt: r.lack?.created_at || r.date,
              updatedAt: r.lack?.updated_at || r.date
            })) as Incidencia[]

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

  return (
    <div className={incidenciasPage}>
      <header className={pageHeaderIncidencias}>
        <div className={headerTop}>
          <div className="flex items-center gap-[15px]">
            <h2 className={pageTitle}>CONTROL Y SUPERVISIÓN</h2>
            <div className="rounded-[12px] bg-primary px-2.5 py-0.5 text-[0.8rem] font-semibold text-white">
              {pagination.total} Reg.
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              className={btnSecondary}
              onClick={handleExportExcel}
              disabled={exporting}
              title="Exportar lista a Excel con los filtros actuales"
            >
              <FaFileExcel className="mr-2" />
              {exporting ? 'Exportando...' : 'Exportar Excel'}
            </button>

            {permissions.canCreate && (
              <button className={btnPrimary} onClick={() => { setEditItem(null); setShowModal(true) }}>
                <FaPlus className="mr-2" />
                Agregar Nueva Incidencia
              </button>
            )}
          </div>
        </div>

        <div className={headerFilters}>
            {/* Filtro por Asunto (Subject) - Usando datos de la API */}
            {subjectsLoading ? (
              <select disabled className={filterSelect}>
                <option>Cargando asuntos...</option>
              </select>
            ) : (
              <select
                className={filterSelect}
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
                <option value="">Todos los Asuntos</option>
                {subjects && subjects
                  .filter(subject => !subject.deleted_at) // Solo mostrar asuntos activos
                  .map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
              </select>
            )}

            {/* Filtro por Falta (Lack) - Usando lacks anidadas del subject seleccionado */}
            {subjectsLoading ? (
              <select disabled className={filterSelect}>
                <option>Cargando faltas...</option>
              </select>
            ) : (
              <select
                className={filterSelect}
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
                <option value="">Todas las Faltas</option>
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
              </select>
            )}

            {/* Filtro por Jurisdicción - Envía ID al backend */}
            {jurisdictionsLoading ? (
              <select disabled className={filterSelect}>
                <option>Cargando jurisdicciones...</option>
              </select>
            ) : (
              <select
                className={filterSelect}
                value={filters.jurisdictionId}
                onChange={e => {
                  setFilters(f => ({ ...f, jurisdictionId: e.target.value }))
                  setCurrentPage(1) // Resetear a página 1 al cambiar filtro
                }}
              >
                <option value="">Todas las Jurisdicciones</option>
                {jurisdictions
                  .filter(jurisdiction => !jurisdiction.deleted_at) // Solo mostrar jurisdicciones activas
                  .map(jurisdiction => (
                    <option key={jurisdiction.id} value={jurisdiction.id}>
                      {jurisdiction.name}
                    </option>
                  ))}
              </select>
            )}

            {/* Filtro por Subgerencia */}
            <select
              className={filterSelect}
              value={filters.subgerencia}
              onChange={e => {
                setFilters(f => ({ ...f, subgerencia: e.target.value }))
                setCurrentPage(1)
              }}
            >
              <option value="">Todas las Subgerencias</option>
              {subgerencias.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              className={filterSelect}
              value={filters.turno}
              onChange={e => setFilters(f => ({ ...f, turno: e.target.value }))}
            >
              <option value="">Todos los Turnos</option>
              <option value="M">Mañana</option>
              <option value="T">Tarde</option>
              <option value="N">Noche</option>
            </select>

            {/* Filtro de estado de proceso */}
            <select
              className={filterSelect}
              value={filters.process}
              onChange={e => {
                setFilters(f => ({ ...f, process: e.target.value }))
                setCurrentPage(1)
              }}
            >
              <option value="">Todos los Estados</option>
              <option value="null">Borrador</option>
              <option value="PENDING">Pendiente</option>
              <option value="APPROVED">Aprobado</option>
              <option value="REJECTED">Rechazado</option>
            </select>

            <div className={searchContainer}>
              <FaSearch className={searchIcon} />
              <input
                className={searchInput}
                placeholder="Buscar (DNI, Nombre, ID...)"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              />
              {isSearching && (
                <div className={searchSpinner}>
                  ⏳
                </div>
              )}
            </div>
        </div>
      </header>

      {/* Mensaje informativo para CENTINELA */}
      {!permissions.canDelete && permissions.canCreate && (
        <div className="m-5 rounded-[8px] border border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.1)] p-3 text-center">
          <p className="m-0 text-[0.9rem] text-[#3b82f6]">
            ℹ️ Solo puedes crear incidencias. No puedes eliminar incidencias existentes.
          </p>
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center text-[1.1rem] text-muted">
          Cargando incidencias...
        </div>
      ) : (
        <div className={tableWrapper}>
          {/* Mensaje cuando se busca pero no se encuentra */}
          {searchResult !== null && searchResult.length === 0 && !isSearching && (
            <div className="mb-5 rounded-[8px] border-2 border-dashed border-line bg-card p-[30px] text-center">
              <p className="m-0 text-[1.1rem] text-content-2">
                🔍 No se encontró ninguna incidencia con: <strong>{filters.search}</strong>
              </p>
              <p className="mt-2 text-[0.9rem] text-muted">
                Verifica que el DNI, nombre o ID sea correcto.
              </p>
            </div>
          )}

          {/* Mensaje cuando se encuentra incidencia(s) */}
          {searchResult !== null && searchResult.length > 0 && (
            <div className="mb-[15px] rounded-[8px] border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] p-3 text-center">
              <p className="m-0 text-[0.95rem] font-medium text-success">
                ✅ {searchResult.length} incidencia(s) encontrada(s)
              </p>
            </div>
          )}

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

          {/* Controles de paginación (mostrar para búsqueda con paginación o listado normal) */}
          {(!isSearchMode || (isSearchMode && searchPagination)) && (() => {
            // Usar searchPagination si está en modo búsqueda, sino usar pagination normal
            const paginationData = isSearchMode && searchPagination ? searchPagination : pagination

            // Controles de paginacion: el contenedor usa flex-wrap en movil
            return (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-[15px] rounded-[8px] border border-line p-5">
                {/* Lado izquierdo: Contador y selector */}
                <div className="flex flex-wrap items-center gap-5">
                  <div className="text-[0.95rem] font-medium">
                    {paginationData.from}-{paginationData.to} de {paginationData.total}
                  </div>

                  {/* Selector de items por página */}
                  <div className="flex items-center gap-2">
                    <label className="text-[0.9rem] text-muted">
                      Mostrar:
                    </label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="cursor-pointer rounded-[4px] border border-line px-3 py-1.5 text-[0.9rem] [background:var(--bg)] [color:inherit]"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {/* Lado derecho: Botones de navegación */}
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={navButton}
                  >
                    ← Anterior
                  </button>

                  {/* Números de página - solo si hay más de 1 página */}
                  {paginationData.totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-[5px]">
                      {Array.from({ length: Math.min(5, paginationData.totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (paginationData.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= paginationData.totalPages - 2) {
                          pageNum = paginationData.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={pageButton(currentPage === pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Indicador de página actual si solo hay 1 página */}
                  {paginationData.totalPages === 1 && (
                    <div className="min-w-10 rounded-[4px] border border-primary bg-primary px-3 py-2 text-center font-bold text-white">
                      1
                    </div>
                  )}

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === paginationData.totalPages}
                    className={navButton}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            );
          })()}
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
