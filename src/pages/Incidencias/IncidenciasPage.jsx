import React, { useEffect, useState } from 'react'
import IncidenciasTable from '../../components/IncidenciasTable'
import ModalIncidencia from '../../components/ModalIncidencia'
import ModalPDFInforme from '../../components/ModalPDFInforme'
import { loadIncidencias, saveIncidencias } from '../../utils/storage'
import { FaPlus, FaSearch, FaFilter } from 'react-icons/fa'

export default function IncidenciasPage(){
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

  useEffect(()=>{
    setIncidencias(loadIncidencias())
  }, [])

  useEffect(()=>{
    saveIncidencias(incidencias)
  }, [incidencias])

  function handleCreate(data){
    if(editItem){
      setIncidencias(prev => prev.map(i => i.id === editItem.id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i))
      setEditItem(null)
    }else{
      const newItem = { 
        id: Date.now().toString(), 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString(), 
        ...data 
      }
      setIncidencias(prev => [newItem, ...prev])
    }
    setShowModal(false)
  }

  function handleDelete(id){
    if(!confirm('¿Estás seguro de que deseas eliminar esta incidencia?')) return
    setIncidencias(prev => prev.filter(p => p.id !== id))
  }

  function handleEdit(item){
    setEditItem(item)
    setShowPDFModal(true)
  }

  // Obtener inasistencias por DNI para el PDF
  function getInasistenciasPorDNI(dni) {
    return incidencias.filter(inc => 
      inc.dni === dni && inc.asunto === 'Inasistencia'
    )
  }

  // Aplicar filtros
  const filteredData = incidencias.filter(item => {
    const matchAsunto = filters.asunto === 'Todos' || item.asunto === filters.asunto
    const matchTurno = filters.turno === 'Todos' || item.turno === filters.turno
    const matchTipoInasistencia = filters.tipoInasistencia === 'Todos' || 
                                 item.tipoInasistencia === filters.tipoInasistencia
    const matchSearch = !filters.search || 
      item.dni?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.asunto?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.falta?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.destinatario?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.cargo?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.regLab?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.jurisdiccion?.toLowerCase().includes(filters.search.toLowerCase())
    
    // Si el asunto es Inasistencia, aplicar filtro de tipo
    if (filters.asunto === 'Inasistencia') {
      return matchAsunto && matchTurno && matchTipoInasistencia && matchSearch
    }
    
    return matchAsunto && matchTurno && matchSearch
  })

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <h2>CONTROL Y SUPERVISIÓN</h2>
        <div className="controls">
          <select 
            value={filters.asunto}
            onChange={(e)=> setFilters(f => ({...f, asunto: e.target.value, tipoInasistencia: 'Todos'}))}
          >
            <option value="Todos">Filtrar por asunto</option>
            <option value="Falta disciplinaria">Falta disciplinaria</option>
            <option value="Abandono de servicio">Abandono de servicio</option>
            <option value="Inasistencia">Inasistencia</option>
          </select>

          {/* Filtro de tipo de inasistencia (solo visible cuando asunto es Inasistencia) */}
          {filters.asunto === 'Inasistencia' && (
            <select 
              value={filters.tipoInasistencia}
              onChange={(e)=> setFilters(f => ({...f, tipoInasistencia: e.target.value}))}
            >
              <option value="Todos">Todos los tipos</option>
              <option value="Justificada">Justificada</option>
              <option value="Injustificada">Injustificada</option>
            </select>
          )}

          <select 
            value={filters.turno}
            onChange={(e)=> setFilters(f => ({...f, turno: e.target.value}))}
          >
            <option value="Todos">Todos los turnos</option>
            <option value="Mañana">Mañana</option>
            <option value="Tarde">Tarde</option>
            <option value="Noche">Noche</option>
          </select>

          <div style={{position: 'relative'}}>
            <FaSearch style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)'
            }} />
            <input 
              placeholder="Buscar incidencia..." 
              value={filters.search}
              onChange={(e)=> setFilters(f => ({...f, search: e.target.value}))}
              style={{paddingLeft: '35px'}}
            />
          </div>

          <button 
            className="btn-primary" 
            onClick={()=> { setEditItem(null); setShowModal(true) }}
          >
            <FaPlus style={{marginRight: '8px'}} />
            Agregar
          </button>
        </div>
      </header>

      <IncidenciasTable
        data={filteredData}
        onDelete={handleDelete}
        onEdit={handleEdit}
        filtroAsunto={filters.asunto}
      />

      {showModal && (
        <ModalIncidencia
          initial={editItem}
          onClose={()=> { setShowModal(false); setEditItem(null) }}
          onSave={handleCreate}
        />
      )}

      {showPDFModal && editItem && (
        <ModalPDFInforme
          incidencia={editItem}
          inasistenciasHistoricas={getInasistenciasPorDNI(editItem.dni)}
          onClose={()=> { setShowPDFModal(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}