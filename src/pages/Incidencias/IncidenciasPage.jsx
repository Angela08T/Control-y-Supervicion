import React, { useEffect, useState } from 'react'
import IncidenciasTable from '../../components/IncidenciasTable'
import ModalIncidencia from '../../components/ModalIncidencia'
import ModalPDFInforme from '../../components/ModalPDFInforme'
import { loadIncidencias, saveIncidencias } from '../../utils/storage'
import { createReport, mapFormDataToAPI, getReports } from '../../api/report' 
import useSubjects from '../../hooks/Subject/useSubjects'
import { FaPlus, FaSearch } from 'react-icons/fa'

export default function IncidenciasPage() {
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

  function handleDelete(id) {
    if (!confirm('¿Estás seguro de eliminar esta incidencia?')) return
    setIncidencias(prev => prev.filter(p => p.id !== id))
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

  // 🔹 Filtros
  const filteredData = incidencias.filter(item => {
    const matchAsunto = filters.asunto === 'Todos' || item.asunto === filters.asunto
    const matchTurno = filters.turno === 'Todos' || item.turno === filters.turno
    const matchTipoInasistencia =
      filters.tipoInasistencia === 'Todos' || item.tipoInasistencia === filters.tipoInasistencia
    const matchSearch =
      !filters.search ||
      item.dni?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.asunto?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.falta?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.destinatario?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.cargo?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.regLab?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.jurisdiccion?.toLowerCase().includes(filters.search.toLowerCase())

    if (filters.asunto === 'Inasistencia') {
      return matchAsunto && matchTurno && matchTipoInasistencia && matchSearch
    }

    return matchAsunto && matchTurno && matchSearch
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
                placeholder="Buscar incidencia..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                style={{ paddingLeft: '35px' }}
              />
            </div>

            <button className="btn-primary" onClick={() => { setEditItem(null); setShowModal(true) }}>
              <FaPlus style={{ marginRight: '8px' }} />
              Agregar
            </button>
          </div>
        </div>
      </header>

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
          <IncidenciasTable
            data={filteredData}
            onDelete={handleDelete}
            onEdit={handleEdit}
            filtroAsunto={filters.asunto}
          />

          {/* Controles de paginación */}
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
