import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import IncidenciasTable from '@/Components/Table/IncidenciasTable'
import ModalIncidencia from '@/Components/Modal/ModalIncidencia'
import ModalPDFInforme from '@/Components/Modal/ModalPDFInforme'
import { loadIncidencias, saveIncidencias } from '@/helpers/localStorageUtils'
// Nuevos hooks para gestión de datos
import useReports from '@/Components/hooks/useReports'
import useFetchData from '@/Components/hooks/useFetchData'
import { getModulePermissions } from '@/helpers/permissions'
import { FaPlus, FaSearch } from 'react-icons/fa'

export default function IncidenciasPage() {
  const { role: userRole } = useSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'incidencias')

  // Hooks del nuevo patrón
  const {
    getReportById: fetchReportById,
    searchReports,
    crearReport,
    eliminarReport,
    sendToValidator: hookSendToValidator,
    validateReport: hookValidateReport,
    mapFormDataToAPI: hookMapFormDataToAPI,
    getEvidenceImageUrl
  } = useReports()

  const {
    fetchAsuntos,
    fetchFaltas,
    fetchJurisdicciones,
    fetchIncidencias: fetchIncidenciasData
  } = useFetchData()

  const [incidencias, setIncidencias] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [filters, setFilters] = useState({
    turno: '', // Ahora usa letras: M=Mañana, T=Tarde, N=Noche, ''=Todos
    search: '',
    lackId: '', // Filtro por ID de falta
    subjectId: '', // Filtro por ID de asunto
    jurisdictionId: '' // Filtro por ID de jurisdicción
  })
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
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Trigger para forzar recarga
  const [searchResult, setSearchResult] = useState(null) // Resultado de búsqueda por ID
  const [isSearching, setIsSearching] = useState(false) // Indica si está buscando
  const [searchPagination, setSearchPagination] = useState(null) // Paginación de búsqueda
  const [isSearchMode, setIsSearchMode] = useState(false) // Indica si está en modo búsqueda

  // Estados para datos comunes (cargados desde useFetchData)
  const [subjects, setSubjects] = useState([])
  const [lacks, setLacks] = useState([])
  const [jurisdictions, setJurisdictions] = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [lacksLoading, setLacksLoading] = useState(true)
  const [jurisdictionsLoading, setJurisdictionsLoading] = useState(true)

  // Cargar datos comunes al montar el componente
  useEffect(() => {
    const loadCommonData = async () => {
      try {
        const [subjectsRes, lacksRes, jurisdictionsRes] = await Promise.all([
          fetchAsuntos(true),
          fetchFaltas(true),
          fetchJurisdicciones(true)
        ])

        if (subjectsRes.status) setSubjects(subjectsRes.data || [])
        if (lacksRes.status) setLacks(lacksRes.data || [])
        if (jurisdictionsRes.status) setJurisdictions(jurisdictionsRes.data || [])
      } catch (error) {
        console.error('Error al cargar datos comunes:', error)
      } finally {
        setSubjectsLoading(false)
        setLacksLoading(false)
        setJurisdictionsLoading(false)
      }
    }
    loadCommonData()
  }, [fetchAsuntos, fetchFaltas, fetchJurisdicciones])

  // 🔹 NUEVO: cargar incidencias desde la API con paginación y filtros
  useEffect(() => {
    async function fetchIncidencias() {
      setLoading(true)
      try {
        // Construir parámetros URL
        const params = new URLSearchParams()
        params.append('page', currentPage)
        params.append('limit', itemsPerPage)
        if (filters.lackId) params.append('lack', filters.lackId)
        if (filters.subjectId) params.append('subject', filters.subjectId)
        if (filters.jurisdictionId) params.append('jurisdiction', filters.jurisdictionId)
        if (filters.turno) params.append('shift', filters.turno)

        console.log(`📡 Obteniendo incidencias desde API (página ${currentPage}, ${itemsPerPage} por página)...`)
        console.log('🔍 Filtros aplicados:', params.toString())

        const result = await fetchIncidenciasData(params.toString(), false)

        if (result.status && result.data) {
          // Transformar datos al formato esperado
          const transformedData = Array.isArray(result.data) ? result.data : []
          console.log('✅ Incidencias obtenidas:', transformedData.length)

          // Calcular paginación
          const totalNum = result.data.length // Si la API devuelve total diferente, ajustar
          const totalPagesNum = Math.ceil(totalNum / itemsPerPage)
          const from = totalNum === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1
          const to = Math.min(currentPage * itemsPerPage, totalNum)

          setIncidencias(transformedData)
          setPagination({
            currentPage,
            totalPages: totalPagesNum,
            perPage: itemsPerPage,
            total: totalNum,
            from,
            to
          })
          saveIncidencias(transformedData) // opcional: respaldo local
        } else {
          throw new Error('Respuesta inválida de la API')
        }
      } catch (error) {
        console.error('⚠️ No se pudo cargar desde API, usando localStorage:', error)
        const localData = loadIncidencias()
        setIncidencias(localData)
      } finally {
        setLoading(false)
      }
    }

    fetchIncidencias()
  }, [currentPage, itemsPerPage, refreshTrigger, filters.lackId, filters.subjectId, filters.jurisdictionId, filters.turno, fetchIncidenciasData])

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
        console.log('📤 Creando incidencia con useReports hook...')
        const result = await crearReport(data, allLeads)

        if (result) {
          console.log('✅ Incidencia creada:', result)
          // Recargar la primera página para ver la nueva incidencia
          setCurrentPage(1)
          setShowModal(false)
          // Forzar recarga de datos
          setRefreshTrigger(prev => prev + 1)
        }
      } catch (error) {
        console.error('❌ Error al crear incidencia:', error)
      }
    }
  }

  async function handleDelete(report) {
    try {
      console.log('🗑️ Eliminando incidencia:', report.id)
      const result = await eliminarReport(report)

      if (result) {
        console.log('✅ Incidencia eliminada exitosamente')
        // Recargar datos desde la API
        setRefreshTrigger(prev => prev + 1)
      }
    } catch (error) {
      console.error('❌ Error al eliminar incidencia:', error)
    }
  }

  async function handleSendToValidator(reportId) {
    try {
      const result = await hookSendToValidator(reportId)
      if (result) {
        setRefreshTrigger(prev => prev + 1)
      }
    } catch (error) {
      console.error('❌ Error al enviar incidencia:', error)
    }
  }

  async function handleApprove(reportId) {
    try {
      const result = await hookValidateReport(reportId, true)
      if (result) {
        setRefreshTrigger(prev => prev + 1)
      }
    } catch (error) {
      console.error('❌ Error al aprobar incidencia:', error)
    }
  }

  async function handleReject(reportId) {
    try {
      const result = await hookValidateReport(reportId, false)
      if (result) {
        setRefreshTrigger(prev => prev + 1)
      }
    } catch (error) {
      console.error('❌ Error al rechazar incidencia:', error)
    }
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
          console.log('🔍 Buscando incidencia por ID:', searchTerm)
          const result = await fetchReportById(searchTerm)

          if (result.found && result.data.length > 0) {
            console.log('✅ Incidencia encontrada:', result.data[0])
            setSearchResult(result.data)
            setSearchPagination(null) // Búsqueda por ID no tiene paginación
          } else {
            console.log('⚠️ No se encontró incidencia con ese ID')
            setSearchResult([])
            setSearchPagination(null)
          }
        } catch (error) {
          console.error('❌ Error al buscar por ID:', error)
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
          console.log('🔍 Buscando incidencia por campos:', searchTerm, 'página:', currentPage)

          // Construir la URL con paginación
          const response = await searchReports(searchTerm, currentPage, itemsPerPage)

          // DEBUG: Ver la respuesta completa de la API
          console.log('📡 Respuesta COMPLETA de searchReport:', response)

          // La API devuelve los datos en response.data?.data?.data
          const results = response?.data?.data || []
          const paginationData = response?.data || {}

          console.log('📊 Resultados extraídos:', results)
          console.log('📊 Paginación:', paginationData)

          if (results.length > 0) {
            console.log('✅ Incidencias encontradas:', results.length)
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
            console.log('⚠️ No se encontraron incidencias con ese término')
            setSearchResult([])
            setSearchPagination(null)
          }
        } catch (error) {
          console.error('❌ Error al buscar por campos:', error)
          console.error('❌ Error completo:', error.response || error)
          setSearchResult(null)
          setSearchPagination(null)
        } finally {
          setIsSearching(false)
        }
      }

      searchByFields()
    }
  }, [filters.search, currentPage, itemsPerPage])

  // Todos los filtros se manejan en el backend, incluyendo turno
  const filteredData = searchResult !== null
    ? searchResult // Si hay resultado de búsqueda, mostrar los resultados de la API
    : incidencias // Mostrar incidencias directamente (ya filtradas por el backend)

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
          <h2>CONTROL Y SUPERVISIÓN</h2>
          <div className="controls">
            {/* Filtro por Asunto (Subject) - Usando datos de la API */}
            {subjectsLoading ? (
              <select disabled>
                <option>Cargando asuntos...</option>
              </select>
            ) : (
              <select
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
                <option value="">Filtrar por asunto</option>
                {subjects && subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            )}

            {/* Filtro por Falta (Lack) - Usando datos de la API */}
            {lacksLoading ? (
              <select disabled>
                <option>Cargando faltas...</option>
              </select>
            ) : (
              <select
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
                <option value="">Filtrar por falta</option>
                {lacks && lacks
                  .filter(lack => !filters.subjectId || lack.subjectId === filters.subjectId)
                  .map(lack => (
                    <option key={lack.id} value={lack.id}>
                      {lack.name}
                    </option>
                  ))}
              </select>
            )}

            {/* Filtro por Jurisdicción - Envía ID al backend */}
            {jurisdictionsLoading ? (
              <select disabled>
                <option>Cargando jurisdicciones...</option>
              </select>
            ) : (
              <select
                value={filters.jurisdictionId}
                onChange={e => {
                  setFilters(f => ({ ...f, jurisdictionId: e.target.value }))
                  setCurrentPage(1) // Resetear a página 1 al cambiar filtro
                }}
              >
                <option value="">Filtrar por jurisdicción</option>
                {jurisdictions.map(jurisdiction => (
                  <option key={jurisdiction.id} value={jurisdiction.id}>
                    {jurisdiction.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filters.turno}
              onChange={e => setFilters(f => ({ ...f, turno: e.target.value }))}
            >
              <option value="">Todos los turnos</option>
              <option value="M">Mañana</option>
              <option value="T">Tarde</option>
              <option value="N">Noche</option>
            </select>

            <div style={{ position: 'relative' }}>
              <FaSearch
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)'
                }}
              />
              <input
                placeholder="Buscar por DNI, nombre o ID"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                style={{ paddingLeft: '35px', paddingRight: isSearching ? '35px' : '12px' }}
              />
              {isSearching && (
                <div
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--primary)',
                    animation: 'spin 1s linear infinite'
                  }}
                >
                  ⏳
                </div>
              )}
            </div>

            {permissions.canCreate && (
              <button className="btn-primary" onClick={() => { setEditItem(null); setShowModal(true) }}>
                <FaPlus style={{ marginRight: '8px' }} />
                Agregar
              </button>
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
        <ModalPDFInforme
          incidencia={editItem}
          inasistenciasHistoricas={getInasistenciasPorDNI(editItem.dni)}
          onClose={() => { setShowPDFModal(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}
