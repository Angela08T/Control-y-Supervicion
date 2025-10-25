import React, { useState, useMemo } from 'react'
import { FaCalendarAlt, FaUsers, FaExclamationTriangle, FaMapMarkerAlt } from 'react-icons/fa'
import { loadIncidencias } from '../../utils/storage'
import StatCard from './components/StatCard'
import WelcomeCard from './components/WelcomeCard'
import CircularProgress from './components/CircularProgress'
import SupervisionCard from './components/SupervisionCard'
import LineChart from './components/LineChart'
import BarChart from './components/BarChart'
import PersonalTable from './components/PersonalTable'
import TurnoList from './components/TurnoList'
import DateRangeModal from './components/DateRangeModal'

export default function DashboardPage() {
  const [incidencias, setIncidencias] = useState(loadIncidencias())
  const [showDateModal, setShowDateModal] = useState(false)
  const [dateRange, setDateRange] = useState({ start: null, end: null })

  // Calcular estadísticas
  const stats = useMemo(() => {
    let filtered = incidencias

    // Filtrar por rango de fechas si está activo
    if (dateRange.start && dateRange.end) {
      filtered = incidencias.filter(inc => {
        const fecha = new Date(inc.fechaIncidente)
        return fecha >= dateRange.start && fecha <= dateRange.end
      })
    }

    // Total de incidencias
    const totalIncidencias = filtered.length
    
    // Calcular porcentaje de cambio (comparando con mes anterior - simulado)
    const cambioIncidencias = totalIncidencias > 0 ? '+10%' : '0%'

    // Serenos activos (simulado - en producción vendría de API)
    const serenosActivos = 23
    const cambioSerenos = '+5%'

    // Incidencia crítica (la más frecuente)
    const conteoAsuntos = {}
    filtered.forEach(inc => {
      conteoAsuntos[inc.asunto] = (conteoAsuntos[inc.asunto] || 0) + 1
    })
    const asuntoMasFrecuente = Object.keys(conteoAsuntos).reduce((a, b) => 
      conteoAsuntos[a] > conteoAsuntos[b] ? a : b, 
      'Sin datos'
    )
    const totalCriticas = conteoAsuntos[asuntoMasFrecuente] || 0

    // Zona con más incidencias
    const conteoJurisdicciones = {}
    filtered.forEach(inc => {
      if (inc.jurisdiccion) {
        conteoJurisdicciones[inc.jurisdiccion] = (conteoJurisdicciones[inc.jurisdiccion] || 0) + 1
      }
    })
    const zonaConMas = Object.keys(conteoJurisdicciones).reduce((a, b) => 
      conteoJurisdicciones[a] > conteoJurisdicciones[b] ? a : b, 
      'Sin datos'
    )
    const totalZona = conteoJurisdicciones[zonaConMas] || 0

    // Cumplimiento de reportes (PDFs descargados - simulado por ahora)
    const pdfDescargados = Math.floor(totalIncidencias * 0.95) // 95% de reportes
    const porcentajeCumplimiento = totalIncidencias > 0 
      ? Math.round((pdfDescargados / totalIncidencias) * 100) 
      : 0

    // Evolución por mes
    const incidenciasPorMes = {}
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    
    meses.forEach((mes, idx) => {
      incidenciasPorMes[mes] = {
        'Falta disciplinaria': 0,
        'Abandono de servicio': 0,
        'Inasistencia': 0
      }
    })

    filtered.forEach(inc => {
      if (inc.fechaIncidente) {
        const fecha = new Date(inc.fechaIncidente)
        const mes = meses[fecha.getMonth()]
        if (incidenciasPorMes[mes] && incidenciasPorMes[mes][inc.asunto] !== undefined) {
          incidenciasPorMes[mes][inc.asunto]++
        }
      }
    })

    // Incidencias por turno
    const incidenciasPorTurno = {
      'Mañana': 0,
      'Tarde': 0,
      'Noche': 0
    }

    filtered.forEach(inc => {
      if (inc.turno && incidenciasPorTurno[inc.turno] !== undefined) {
        incidenciasPorTurno[inc.turno]++
      }
    })

    // Conteo por asunto para las barras
    const incidenciasPorAsunto = {
      'Falta disciplinaria': conteoAsuntos['Falta disciplinaria'] || 0,
      'Abandono de servicio': conteoAsuntos['Abandono de servicio'] || 0,
      'Inasistencia': conteoAsuntos['Inasistencia'] || 0
    }

    return {
      totalIncidencias,
      cambioIncidencias,
      serenosActivos,
      cambioSerenos,
      asuntoMasFrecuente,
      totalCriticas,
      zonaConMas,
      totalZona,
      porcentajeCumplimiento,
      incidenciasPorMes,
      incidenciasPorTurno,
      incidenciasPorAsunto
    }
  }, [incidencias, dateRange])

  const handleDateRangeChange = (start, end) => {
    setDateRange({ start, end })
    setShowDateModal(false)
  }

  return (
    <div className="dashboard-page">
      {/* Cards superiores */}
      <div className="stats-grid">
        <StatCard
          title="Total de Incidencias"
          value={stats.totalIncidencias}
          change={stats.cambioIncidencias}
          icon={<FaCalendarAlt />}
          color="#4a9b8e"
          onIconClick={() => setShowDateModal(true)}
        />
        
        <StatCard
          title="Serenos Activos"
          value={stats.serenosActivos}
          change={stats.cambioSerenos}
          icon={<FaUsers />}
          color="#5a67d8"
        />
        
        <StatCard
          title="Incidencias Críticas"
          value={stats.totalCriticas}
          subtitle={stats.asuntoMasFrecuente}
          change="+12%"
          icon={<FaExclamationTriangle />}
          color="#ed8936"
        />
        
        <StatCard
          title="Zona con Más Incidencias"
          value={stats.totalZona}
          subtitle={stats.zonaConMas}
          change="+8%"
          icon={<FaMapMarkerAlt />}
          color="#48bb78"
        />
      </div>

      {/* Segunda fila: Welcome, Cumplimiento y Supervisión */}
      <div className="middle-grid">
        <WelcomeCard 
          message="Revisa el control de las incidencias y el desempeño del equipo"
        />
        
        <CircularProgress
          title="Cumplimiento de Reportes"
          percentage={stats.porcentajeCumplimiento}
          subtitle="de reportes realizados"
        />
        
        <SupervisionCard
          serenosEnCampo={18}
          serenosSinConexion={2}
          nivelCumplimiento={92}
        />
      </div>

      {/* Tercera fila: Gráficos */}
      <div className="charts-grid">
        <LineChart
          title="Evolución de Incidencias"
          subtitle="Por mes del año actual"
          data={stats.incidenciasPorMes}
        />
        
        <BarChart
          title="Incidencias"
          subtitle="Por tipo de asunto"
          data={stats.incidenciasPorAsunto}
        />
      </div>

      {/* Última fila: Tabla y Turnos */}
      <div className="bottom-grid">
        <PersonalTable />
        
        <TurnoList
          data={stats.incidenciasPorTurno}
        />
      </div>

      {/* Modal de rango de fechas */}
      {showDateModal && (
        <DateRangeModal
          onClose={() => setShowDateModal(false)}
          onApply={handleDateRangeChange}
        />
      )}
    </div>
  )
}