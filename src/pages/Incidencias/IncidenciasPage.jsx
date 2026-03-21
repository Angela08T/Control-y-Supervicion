import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import IncidenciasTable from '../../components/IncidenciasTable'
import ModalIncidencia from '../../components/ModalIncidencia'
import ModalPDFInforme from '../../components/ModalPDFInforme'
import ModalPDFInasistencias from '../../components/ModalPDFInasistencias'
import AlertModal from '../../components/AlertModal'
import ConfirmModal from '../../components/ConfirmModal'
import { loadIncidencias, saveIncidencias } from '../../utils/storage'
import { createReport, mapFormDataToAPI, getReports, getReportById, deleteReport, searchReport, sendToValidator, validateReport, exportReportsExcel } from '../../api/report'
import { getSubgerencias } from '../../api/offender'
import useSubjects from '../../hooks/Subject/useSubjects'
import useLacks from '../../hooks/Lack/useLacks'
import useJurisdictions from '../../hooks/Jurisdiction/useJurisdictions'
import { getModulePermissions } from '../../utils/permissions'
import { FaPlus, FaSearch, FaFileExcel } from 'react-icons/fa'
import { initSocket, onReportStatusChanged, onReportStatusValidate, disconnectSocket } from '../../services/websocket'

export default function IncidenciasPage() {
  const { role: userRole } = useSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'incidencias')

  const [incidencias, setIncidencias] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [filters, setFilters] = useState({
    turno: '', // Ahora usa letras: M=Mañana, T=Tarde, N=Noche, ''=Todos
    search: '',
    lackId: '', // Filtro por ID de falta
    subjectId: '', // Filtro por ID de asunto
    jurisdictionId: '', // Filtro por ID de jurisdicción
    subgerencia: '', // Filtro por subgerencia
    showDeleted: 'active', // 'active' = solo activos, 'deleted' = solo eliminados
    process: '' // '' = todos, 'PENDING', 'APPROVED', 'REJECTED', null=draft
  })
  const [subgerencias, setSubgerencias] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10) // Nuevo estado para items por página
  const [pagination, setPagination] = useState({
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
  const [searchResult, setSearchResult] = useState(null) // Resultado de búsqueda por ID
  const [isSearching, setIsSearching] = useState(false) // Indica si está buscando
  const [searchPagination, setSearchPagination] = useState(null) // Paginación de búsqueda
  const [isSearchMode, setIsSearchMode] = useState(false) // Indica si está en modo búsqueda

  // Estados para modales personalizados
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'success' })
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null })

  const { subjects, loading: subjectsLoading } = useSubjects()
  const { lacks, loading: lacksLoading } = useLacks()
  const { jurisdictions, loading: jurisdictionsLoading } = useJurisdictions()

  useEffect(() => {
    getSubgerencias().then(data => {
      const lista = Array.isArray(data) ? data : []
      const seen = new Map()
      lista.forEach(s => {
        const key = s.trim().toUpperCase()
        if (key && !seen.has(key)) seen.set(key, s.trim())
      })
      setSubgerencias([...seen.values()].sort())
    }).catch(() => {})
  }, [])

  // 🔹 Función para actualizar estado de un reporte específico
  const updateReportStatus = useCallback(async (reportId, updates, fullData = null) => {
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
        }

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
    const unsubscribeStatusChanged = onReportStatusChanged((data) => {
      if (!data) return

      const reportId = data.id || data.report_id || data.reportId
      const newStatus = data.status || data.process || data.state

      if (reportId && newStatus) {
        updateReportStatus(
          reportId,
          {
            status: newStatus.toLowerCase(),
            ...(data.code && { code: data.code })
          },
          data
        )
      }
    })

    // Suscribirse al evento de validación (APPROVED/REJECTED)
    const unsubscribeStatusValidate = onReportStatusValidate((data) => {
      if (!data) return

      const reportId = data.id || data.report_id || data.reportId
      const newStatus = data.status || data.process || data.state

      if (reportId) {
        const updates = {}

        if (newStatus) {
          updates.status = newStatus.toLowerCase()
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
        const apiFilters = {}
        if (filters.lackId) apiFilters.lackId = filters.lackId
        if (filters.subjectId) apiFilters.subjectId = filters.subjectId
        if (filters.jurisdictionId) apiFilters.jurisdictionId = filters.jurisdictionId
        if (filters.turno) apiFilters.shift = filters.turno
        if (filters.process) apiFilters.process = filters.process
        if (filters.subgerencia) apiFilters.subgerencia = filters.subgerencia

        console.log('🔍 Filtros enviados al backend:', apiFilters)

        const result = await getReports(currentPage, itemsPerPage, apiFilters)
        setIncidencias(result.data)
        setPagination(result.pagination)
        saveIncidencias(result.data) // opcional: respaldo local
      } catch (error) {
        const localData = loadIncidencias()
        setIncidencias(localData)
      } finally {
        setLoading(false)
      }
    }

    fetchIncidencias()
  }, [currentPage, itemsPerPage, refreshTrigger, filters.lackId, filters.subjectId, filters.jurisdictionId, filters.turno, filters.process, filters.subgerencia])

  // Mantener sincronizado localStorage si cambian las incidencias
  useEffect(() => {
    saveIncidencias(incidencias)
  }, [incidencias])

  // 🔹 Crear o editar incidencia
  async function handleCreate(data, allLeads = []) {
    if (editItem) {
      setIncidencias(prev =>
        prev.map(i =>
          i.id === editItem.id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i
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

        // Mostrar error más detallado
        let errorMessage = 'Error al crear la incidencia';

        if (error.response?.data?.message) {
          // Si el mensaje es un array, convertirlo a string
          if (Array.isArray(error.response.data.message)) {
            errorMessage = 'Errores de validación:\n' + error.response.data.message.join('\n');
          } else {
            errorMessage = error.response.data.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
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

  async function handleDelete(id, status) {
    // Función para ejecutar la eliminación
    const executeDelete = async () => {
      try {
        const response = await deleteReport(id)

        setAlertModal({
          isOpen: true,
          title: '¡Éxito!',
          message: response.data?.message || response.message || 'Incidencia deshabilitada exitosamente',
          type: 'success'
        })

        // Recargar datos desde la API
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {

        let errorMessage = 'Error al deshabilitar la incidencia'

        if (error.response?.data?.message) {
          errorMessage = Array.isArray(error.response.data.message)
            ? error.response.data.message.join('\n')
            : error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
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

  async function handleSendToValidator(reportId) {
    setConfirmModal({
      isOpen: true,
      title: 'Enviar a validador',
      message: '¿Enviar esta incidencia al validador?\n\nDebe tener al menos una imagen adjunta.',
      type: 'info',
      confirmText: 'Sí, enviar',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false })
        try {
          const response = await sendToValidator(reportId)
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
            message: error.response?.data?.message || error.message || 'Error al enviar incidencia',
            type: 'error'
          })
        }
      }
    })
  }

  async function handleApprove(reportId) {
    setConfirmModal({
      isOpen: true,
      title: 'Aprobar incidencia',
      message: '¿Aprobar esta incidencia?\n\nSe generará automáticamente un código oficial para el informe.',
      type: 'info',
      confirmText: 'Sí, aprobar',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false })
        try {
          const response = await validateReport(reportId, true)
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
            message: error.response?.data?.message || error.message || 'Error al aprobar incidencia',
            type: 'error'
          })
        }
      }
    })
  }

  async function handleReject(reportId) {
    setConfirmModal({
      isOpen: true,
      title: 'Rechazar incidencia',
      message: '¿Rechazar esta incidencia?\n\nEl informe no se aprobará y no se generará código oficial.',
      type: 'warning',
      confirmText: 'Sí, rechazar',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false })
        try {
          const response = await validateReport(reportId, false)
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
            message: error.response?.data?.message || error.message || 'Error al rechazar incidencia',
            type: 'error'
          })
        }
      }
    })
  }

  function handleEdit(item) {
    setEditItem(item)
    setShowPDFModal(true)
  }

  function getInasistenciasPorDNI(dni) {
    return incidencias.filter(inc => inc.dni === dni && inc.falta && inc.falta.startsWith('Inasistencia'))
  }

  // 🔹 Funciones de paginación
  function handlePageChange(newPage) {
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

  function handleItemsPerPageChange(newItemsPerPage) {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Volver a la primera página al cambiar items por página
  }

  // 🔹 Verificar si el término de búsqueda es un UUID
  const isUUID = (str) => {
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
          const results = response?.data?.data || []
          const paginationData = response?.data || {}

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
            }))

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
      await exportReportsExcel(filters)
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
  const applyFrontendFilters = (data) => {
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
    <div className="incidencias-page">
      <header className="page-header">
        <div className="header-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2>CONTROL Y SUPERVISIÓN</h2>
            <div style={{ 
              backgroundColor: 'var(--primary)', 
              color: 'white', 
              padding: '2px 10px', 
              borderRadius: '12px', 
              fontSize: '0.8rem', 
              fontWeight: '600' 
            }}>
              {pagination.total} Reg.
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-secondary"
              onClick={handleExportExcel}
              disabled={exporting}
              title="Exportar lista a Excel con los filtros actuales"
            >
              <FaFileExcel style={{ marginRight: '8px' }} />
              {exporting ? 'Exportando...' : 'Exportar Excel'}
            </button>

            {permissions.canCreate && (
              <button className="btn-primary" onClick={() => { setEditItem(null); setShowModal(true) }}>
                <FaPlus style={{ marginRight: '8px' }} />
                Agregar Nueva Incidencia
              </button>
            )}
          </div>
        </div>

        <div className="header-filters">
            {/* Filtro por Asunto (Subject) - Usando datos de la API */}
            {subjectsLoading ? (
              <select disabled className="filter-select">
                <option>Cargando asuntos...</option>
              </select>
            ) : (
              <select
                className="filter-select"
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
              <select disabled className="filter-select">
                <option>Cargando faltas...</option>
              </select>
            ) : (
              <select
                className="filter-select"
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
              <select disabled className="filter-select">
                <option>Cargando jurisdicciones...</option>
              </select>
            ) : (
              <select
                className="filter-select"
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
              className="filter-select"
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
              className="filter-select"
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
              className="filter-select"
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

            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                className="search-input"
                placeholder="Buscar (DNI, Nombre, ID...)"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              />
              {isSearching && (
                <div className="search-spinner">
                  ⏳
                </div>
              )}
            </div>
        </div>
      </header>

      {/* Mensaje informativo para CENTINELA */}
      {!permissions.canDelete && permissions.canCreate && (
        <div style={{
          textAlign: 'center',
          padding: '12px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '8px',
          margin: '20px',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <p style={{ fontSize: '0.9rem', color: '#3b82f6', margin: '0' }}>
            ℹ️ Solo puedes crear incidencias. No puedes eliminar incidencias existentes.
          </p>
        </div>
      )}

      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-muted)',
          fontSize: '1.1rem'
        }}>
          Cargando incidencias...
        </div>
      ) : (
        <div className="table-container-wrapper">
          {/* Mensaje cuando se busca pero no se encuentra */}
          {searchResult !== null && searchResult.length === 0 && !isSearching && (
            <div style={{
              textAlign: 'center',
              padding: '30px',
              backgroundColor: 'var(--card)',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '2px dashed var(--border)'
            }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: '0' }}>
                🔍 No se encontró ninguna incidencia con: <strong>{filters.search}</strong>
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Verifica que el DNI, nombre o ID sea correcto.
              </p>
            </div>
          )}

          {/* Mensaje cuando se encuentra incidencia(s) */}
          {searchResult !== null && searchResult.length > 0 && (
            <div style={{
              textAlign: 'center',
              padding: '12px',
              backgroundColor: 'rgba(74, 222, 128, 0.1)',
              borderRadius: '8px',
              marginBottom: '15px',
              border: '1px solid rgba(74, 222, 128, 0.3)'
            }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--success)', margin: '0', fontWeight: '500' }}>
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

            return (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px',
                marginTop: '20px',
                background: 'var(--card-bg)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                flexWrap: 'wrap',  /* Permite que los elementos se envuelvan en móvil */
                gap: '15px'
              }}>
                {/* Lado izquierdo: Contador y selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{
                    color: 'var(--text)',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}>
                    {paginationData.from}-{paginationData.to} de {paginationData.total}
                  </div>

                  {/* Selector de items por página */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Mostrar:
                    </label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {/* Lado derecho: Botones de navegación */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="btn-secondary"
                    style={{
                      padding: '8px 16px',
                      opacity: currentPage === 1 ? 0.5 : 1,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    ← Anterior
                  </button>

                  {/* Números de página - solo si hay más de 1 página */}
                  {paginationData.totalPages > 1 && (
                    <div style={{
                      display: 'flex',
                      gap: '5px',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      justifyContent: 'center'
                    }}>
                      {Array.from({ length: Math.min(5, paginationData.totalPages) }, (_, i) => {
                        let pageNum;
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
                            style={{
                              padding: '8px 12px',
                              background: currentPage === pageNum ? 'var(--primary)' : 'transparent',
                              color: currentPage === pageNum ? 'white' : 'var(--text)',
                              border: `1px solid ${currentPage === pageNum ? 'var(--primary)' : 'var(--border)'}`,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                              minWidth: '40px'
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Indicador de página actual si solo hay 1 página */}
                  {paginationData.totalPages === 1 && (
                    <div style={{
                      padding: '8px 12px',
                      background: 'var(--primary)',
                      color: 'white',
                      border: '1px solid var(--primary)',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      minWidth: '40px',
                      textAlign: 'center'
                    }}>
                      1
                    </div>
                  )}

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === paginationData.totalPages}
                    className="btn-secondary"
                    style={{
                      padding: '8px 16px',
                      opacity: currentPage === paginationData.totalPages ? 0.5 : 1,
                      cursor: currentPage === paginationData.totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
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
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  )
}
