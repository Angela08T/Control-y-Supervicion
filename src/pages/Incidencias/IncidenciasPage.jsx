import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import IncidenciasTable from '../../components/IncidenciasTable'
import ModalIncidencia from '../../components/ModalIncidencia'
import ModalPDFInforme from '../../components/ModalPDFInforme'
import { loadIncidencias, saveIncidencias } from '../../utils/storage'
import { createReport, mapFormDataToAPI, getReports, getReportById, deleteReport, searchReport } from '../../api/report'
import useSubjects from '../../hooks/Subject/useSubjects'
import { getModulePermissions } from '../../utils/permissions'
import { FaPlus, FaSearch } from 'react-icons/fa'

export default function IncidenciasPage() {
  const { role: userRole } = useSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'incidencias')

  const [incidencias, setIncidencias] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [filters, setFilters] = useState({
    asunto: 'Todos',
    turno: 'Todos',
    tipoInasistencia: 'Todos',
    search: ''
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

  const { subjects, loading: subjectsLoading } = useSubjects()

  // 🔹 NUEVO: cargar incidencias desde la API con paginación
  useEffect(() => {
    async function fetchIncidencias() {
      setLoading(true)
      try {
        console.log(`📡 Obteniendo incidencias desde API (página ${currentPage}, ${itemsPerPage} por página)...`)
        const result = await getReports(currentPage, itemsPerPage)
        console.log('✅ Incidencias obtenidas:', result)
        console.log('📊 Paginación:', {
          currentPage: result.pagination.currentPage,
          totalPages: result.pagination.totalPages,
          total: result.pagination.total,
          from: result.pagination.from,
          to: result.pagination.to
        })
        setIncidencias(result.data)
        setPagination(result.pagination)
        saveIncidencias(result.data) // opcional: respaldo local
      } catch (error) {
        console.error('⚠️ No se pudo cargar desde API, usando localStorage:', error)
        const localData = loadIncidencias()
        setIncidencias(localData)
      } finally {
        setLoading(false)
      }
    }

    fetchIncidencias()
  }, [currentPage, itemsPerPage, refreshTrigger])

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
        console.log('📤 Enviando datos a API:', apiData)
        const response = await createReport(apiData)
        console.log('✅ Incidencia creada en API:', response)

        alert('Incidencia creada exitosamente')

        // Recargar la primera página para ver la nueva incidencia
        setCurrentPage(1)
        setShowModal(false)

        // Forzar recarga de datos
        setRefreshTrigger(prev => prev + 1)
      } catch (error) {
        console.error('❌ Error al guardar en API:', error)

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

        alert(errorMessage)
      }
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Estás seguro de eliminar esta incidencia?')) return

    try {
      console.log('🗑️ Eliminando incidencia con ID:', id)
      const response = await deleteReport(id)
      console.log('✅ Respuesta de eliminación:', response)

      alert(response.data?.message || response.message || 'Incidencia eliminada exitosamente')

      // Recargar datos desde la API
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('❌ Error al eliminar incidencia:', error)

      let errorMessage = 'Error al eliminar la incidencia'

      if (error.response?.data?.message) {
        errorMessage = Array.isArray(error.response.data.message)
          ? error.response.data.message.join('\n')
          : error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      alert(errorMessage)
    }
  }

  function handleEdit(item) {
    setEditItem(item)
    setShowPDFModal(true)
  }

  function getInasistenciasPorDNI(dni) {
    return incidencias.filter(inc => inc.dni === dni && inc.asunto === 'Inasistencia')
  }

  // 🔹 Funciones de paginación
  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
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

    // Si no hay término de búsqueda, limpiar resultados
    if (!searchTerm) {
      setSearchResult(null)
      return
    }

    // Si es un UUID, buscar por ID
    if (isUUID(searchTerm)) {
      const searchById = async () => {
        setIsSearching(true)
        try {
          console.log('🔍 Buscando incidencia por ID:', searchTerm)
          const result = await getReportById(searchTerm)

          if (result.found && result.data.length > 0) {
            console.log('✅ Incidencia encontrada:', result.data[0])
            setSearchResult(result.data)
          } else {
            console.log('⚠️ No se encontró incidencia con ese ID')
            setSearchResult([])
          }
        } catch (error) {
          console.error('❌ Error al buscar por ID:', error)
          setSearchResult(null)
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
          console.log('🔍 Buscando incidencia por campos:', searchTerm)
          const response = await searchReport(searchTerm)

          // DEBUG: Ver la respuesta completa de la API
          console.log('📡 Respuesta COMPLETA de searchReport:', response)
          console.log('📡 response.data:', response?.data)
          console.log('📡 response.data.data:', response?.data?.data)

          // La API devuelve los datos en response.data?.data?.data
          const results = response?.data?.data || []

          console.log('📊 Resultados extraídos:', results)
          console.log('📊 Cantidad de resultados:', results.length)

          if (results.length > 0) {
            console.log('✅ Incidencias encontradas:', results)
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
              jurisdiccion: r.offender?.subgerencia || '',
              bodycamNumber: r.bodycam?.name || '',
              bodycamAsignadaA: r.bodycam_user || '',
              encargadoBodycam: r.user ? `${r.user.name} ${r.user.lastname}` : '',
              dirigidoA: r.header?.to?.job || '',
              destinatario: r.header?.to?.name || '',
              nombreCompleto: r.offender ? `${r.offender.name} ${r.offender.lastname}` : '',
              createdAt: r.lack?.created_at || r.date,
              updatedAt: r.lack?.updated_at || r.date
            }))
            setSearchResult(transformed)
          } else {
            console.log('⚠️ No se encontraron incidencias con ese término')
            setSearchResult([])
          }
        } catch (error) {
          console.error('❌ Error al buscar por campos:', error)
          console.error('❌ Error completo:', error.response || error)
          setSearchResult(null)
        } finally {
          setIsSearching(false)
        }
      }

      searchByFields()
    }
  }, [filters.search])

  // 🔹 Filtros
  const filteredData = searchResult !== null
    ? searchResult // Si hay resultado de búsqueda, mostrar los resultados de la API
    : incidencias.filter(item => {
        // Solo aplicar filtros cuando NO hay búsqueda activa
        const matchAsunto = filters.asunto === 'Todos' || item.asunto === filters.asunto
        const matchTurno = filters.turno === 'Todos' || item.turno === filters.turno
        const matchTipoInasistencia =
          filters.tipoInasistencia === 'Todos' || item.tipoInasistencia === filters.tipoInasistencia

        if (filters.asunto === 'Inasistencia') {
          return matchAsunto && matchTurno && matchTipoInasistencia
        }

        return matchAsunto && matchTurno
      })

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
          <h2>CONTROL Y SUPERVISIÓN</h2>
          <div className="controls">
            {subjectsLoading ? (
              <select disabled>
                <option>Cargando asuntos...</option>
              </select>
            ) : (
              <select
                value={filters.asunto}
                onChange={e =>
                  setFilters(f => ({ ...f, asunto: e.target.value, tipoInasistencia: 'Todos' }))
                }
              >
                <option value="Todos">Filtrar por asunto</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>
            )}

            {filters.asunto === 'Inasistencia' && (
              <select
                value={filters.tipoInasistencia}
                onChange={e => setFilters(f => ({ ...f, tipoInasistencia: e.target.value }))}
              >
                <option value="Todos">Todos los tipos</option>
                <option value="Justificada">Justificada</option>
                <option value="Injustificada">Injustificada</option>
              </select>
            )}

            <select
              value={filters.turno}
              onChange={e => setFilters(f => ({ ...f, turno: e.target.value }))}
            >
              <option value="Todos">Todos los turnos</option>
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Noche">Noche</option>
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
            filtroAsunto={filters.asunto}
            startIndex={searchResult !== null ? 0 : pagination.from - 1}
            canDelete={permissions.canDelete}
          />

          {/* Controles de paginación (ocultar cuando se busca por ID) */}
          {searchResult === null && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              marginTop: '20px',
              background: 'var(--card-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
            {/* Lado izquierdo: Contador y selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{
                color: 'var(--text)',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}>
                {pagination.from}-{pagination.to} de {pagination.total}
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
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
              {pagination.totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center'
                }}>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
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
              {pagination.totalPages === 1 && (
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
                disabled={currentPage === pagination.totalPages}
                className="btn-secondary"
                style={{
                  padding: '8px 16px',
                  opacity: currentPage === pagination.totalPages ? 0.5 : 1,
                  cursor: currentPage === pagination.totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                Siguiente →
              </button>
            </div>
          </div>
          )}
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
