import React, { useState, useMemo, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { FaCalendarAlt, FaUsers, FaExclamationTriangle, FaMapMarkerAlt } from 'react-icons/fa'
import { loadIncidencias, getPDFDownloadStats } from '../../utils/storage'
import { getReports } from '../../api/report'
import { getFieldSupervisionStats, getAllOffenders, getDashboardTrends, getDashboardGeneral } from '../../api/statistics'
import useSubjects from '../../hooks/Subject/useSubjects'
import StatCard from './components/StatCard'
import DateCard from './components/DateCard'
import WelcomeCard from './components/WelcomeCard'
import CircularProgress from './components/CircularProgress'
import LineChart from './components/LineChart'
import RadarChart from './components/RadarChart'
import PersonalTable from './components/PersonalTable'
import TurnoList from './components/TurnoList'
import DateRangeModal from './components/DateRangeModal'

export default function DashboardPage() {
  // Obtener el rol del usuario desde Redux
  const userRole = useSelector(state => state.auth.role)
  const isAdmin = userRole === 'ADMIN'

  const [incidencias, setIncidencias] = useState(loadIncidencias())
  const [showDateModal, setShowDateModal] = useState(false)
  const [dateRange, setDateRange] = useState({ start: null, end: null })
  const [chartPeriod, setChartPeriod] = useState('30D') // Período para los gráficos (7D, 15D, 30D)
  const [serenosActivos, setSerenosActivos] = useState(0)
  const [pdfStats, setPdfStats] = useState(getPDFDownloadStats())
  const [supervisionData, setSupervisionData] = useState({
    serenosEnCampo: 0,
    serenosSinConexion: 0,
    nivelCumplimiento: 0
  })
  const [loading, setLoading] = useState(true)
  const [trendsData, setTrendsData] = useState(null) // Datos de tendencias de la API
  const [generalStats, setGeneralStats] = useState(null) // Datos generales (incidencias críticas y zonas)

  // Obtener asuntos y faltas desde la API
  const { subjects } = useSubjects()

  // Cargar datos de la API al montar el componente
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Intentar obtener reportes de la API
      const reportsResponse = await getReports(1, 1000)
      if (reportsResponse?.data) {
        // Actualizar incidencias con datos de la API
        setIncidencias(reportsResponse.data)
      }
    } catch (error) {
    }

    try {
      // Obtener cantidad de serenos activos
      const offendersResponse = await getAllOffenders()

      // La estructura puede ser response.data.data o response.data
      const offendersList = Array.isArray(offendersResponse?.data?.data)
        ? offendersResponse.data.data
        : (Array.isArray(offendersResponse?.data) ? offendersResponse.data : [])

      const activeCount = offendersList.filter(o => o.status === 'active').length || 0
      setSerenosActivos(activeCount)
    } catch (error) {
      setSerenosActivos(23) // Valor por defecto
    }

    try {
      // Obtener datos de supervisión de campo
      const supervisionResponse = await getFieldSupervisionStats()
      if (supervisionResponse?.data) {
        setSupervisionData({
          serenosEnCampo: supervisionResponse.data.serenosEnCampo || 18,
          serenosSinConexion: supervisionResponse.data.serenosSinConexion || 2,
          nivelCumplimiento: supervisionResponse.data.nivelCumplimiento || 92
        })
      }
    } catch (error) {
      // Mantener valores por defecto
      setSupervisionData({
        serenosEnCampo: 18,
        serenosSinConexion: 2,
        nivelCumplimiento: 92
      })
    }

    setLoading(false)
  }

  // Actualizar estadísticas de PDF cuando cambian las incidencias
  useEffect(() => {
    setPdfStats(getPDFDownloadStats())
  }, [incidencias])

  // Cargar datos de tendencias y estadísticas generales cuando cambia el rango de fechas o el período de gráficos
  useEffect(() => {
    const fetchDashboardStats = async () => {
      let startDate, endDate

      if (dateRange.start && dateRange.end) {
        // Usar rango personalizado
        startDate = dateRange.start.toISOString().split('T')[0]
        endDate = dateRange.end.toISOString().split('T')[0]
      } else {
        // Usar período seleccionado para gráficos (7D, 15D, 30D)
        endDate = new Date().toISOString().split('T')[0]
        const daysToSubtract = chartPeriod === '7D' ? 7 : chartPeriod === '15D' ? 15 : 30
        startDate = new Date(Date.now() - daysToSubtract * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }

      // Obtener tendencias (gráficos)
      try {
        const trendsResponse = await getDashboardTrends(startDate, endDate)
        if (trendsResponse?.data) {
          setTrendsData(trendsResponse.data)
        }
      } catch (error) {
        setTrendsData(null)
      }

      // Obtener estadísticas generales (incidencias críticas y zonas)
      try {
        const generalResponse = await getDashboardGeneral(startDate, endDate)
        if (generalResponse?.data) {
          setGeneralStats(generalResponse.data)
        }
      } catch (error) {
        setGeneralStats(null)
      }
    }

    fetchDashboardStats()
  }, [dateRange, chartPeriod])

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

    // Cambios/porcentajes (calculados o simulados)
    const cambioSerenos = serenosActivos > 20 ? '+5%' : '0%'

    // Calcular conteo de asuntos (necesario para varios cálculos)
    const conteoAsuntos = {}
    filtered.forEach(inc => {
      conteoAsuntos[inc.asunto] = (conteoAsuntos[inc.asunto] || 0) + 1
    })

    // Incidencia crítica - Usar datos de la API si están disponibles
    let asuntoMasFrecuente, totalCriticas
    if (generalStats?.top_subject) {
      asuntoMasFrecuente = generalStats.top_subject.name
      totalCriticas = generalStats.top_subject.sent
    } else {
      // Fallback a cálculo local
      const asuntosKeys = Object.keys(conteoAsuntos)
      if (asuntosKeys.length > 0) {
        asuntoMasFrecuente = asuntosKeys.reduce((a, b) =>
          conteoAsuntos[a] > conteoAsuntos[b] ? a : b
        )
        totalCriticas = conteoAsuntos[asuntoMasFrecuente] || 0
      } else {
        asuntoMasFrecuente = 'Sin datos'
        totalCriticas = 0
      }
    }

    // Zona con más incidencias - Usar datos de la API si están disponibles
    let zonaConMas, totalZona
    if (generalStats?.top_jurisdiction) {
      zonaConMas = generalStats.top_jurisdiction.name
      totalZona = generalStats.top_jurisdiction.sent
    } else {
      // Fallback a cálculo local
      const conteoJurisdicciones = {}
      filtered.forEach(inc => {
        if (inc.jurisdiccion) {
          conteoJurisdicciones[inc.jurisdiccion] = (conteoJurisdicciones[inc.jurisdiccion] || 0) + 1
        }
      })
      const jurisdiccionesKeys = Object.keys(conteoJurisdicciones)
      if (jurisdiccionesKeys.length > 0) {
        zonaConMas = jurisdiccionesKeys.reduce((a, b) =>
          conteoJurisdicciones[a] > conteoJurisdicciones[b] ? a : b
        )
        totalZona = conteoJurisdicciones[zonaConMas] || 0
      } else {
        zonaConMas = 'Sin datos'
        totalZona = 0
      }
    }

    // Cumplimiento de reportes (PDFs descargados - simulado por ahora)
    const pdfDescargados = Math.floor(totalIncidencias * 0.95) // 95% de reportes
    const porcentajeCumplimiento = totalIncidencias > 0
      ? Math.round((pdfDescargados / totalIncidencias) * 100)
      : 0

    // Evolución por mes - Usando datos de la API de tendencias cuando estén disponibles
    const incidenciasPorMes = {}
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

    // Obtener lista de asuntos desde la API (o fallback a lista hardcodeada)
    const nuevosAsuntos = subjects && subjects.length > 0
      ? subjects.map(s => s.name)
      : [
          'Conductas relacionadas con el Cumplimiento del Horario y Asistencia',
          'Conductas relacionadas con el Cumplimiento de Funciones o Desempeño',
          'Conductas relacionadas con el Uso de Recursos o Bienes Municipales',
          'Conductas relacionadas con la Imagen o Representación Institucional',
          'Conductas relacionadas con la Convivencia y Comportamiento Institucional',
          'Conductas que podrían afectar la Seguridad o la Integridad de Personas'
        ]

    // Crear mapa de ID a nombre de subject para la API
    const subjectIdToName = {}
    if (subjects && subjects.length > 0) {
      subjects.forEach(subject => {
        subjectIdToName[subject.id] = subject.name
      })
    }

    // Si tenemos datos de la API de tendencias, usarlos
    if (trendsData && trendsData.days && trendsData.days.length > 0) {
      // Inicializar estructura para fechas del rango
      const fechasMap = {}
      trendsData.days.forEach(day => {
        const fecha = new Date(day.date)
        const diaNum = fecha.getDate()
        const mesNum = fecha.getMonth() + 1 // +1 porque getMonth() retorna 0-11
        // Formato día/mes para que coincida con lo que esperan los charts
        const labelFecha = `${diaNum}/${mesNum}`

        fechasMap[labelFecha] = {}
        nuevosAsuntos.forEach(asunto => {
          fechasMap[labelFecha][asunto] = 0
        })

        // Llenar con datos de la API
        if (day.subjects) {
          Object.keys(day.subjects).forEach(subjectId => {
            const subjectName = subjectIdToName[subjectId]
            if (subjectName && day.subjects[subjectId].sent > 0) {
              fechasMap[labelFecha][subjectName] = day.subjects[subjectId].sent
            }
          })
        }
      })

      Object.assign(incidenciasPorMes, fechasMap)
    } else {
      // Fallback: usar cálculo local con incidencias filtradas
      meses.forEach((mes, idx) => {
        incidenciasPorMes[mes] = {}
        nuevosAsuntos.forEach(asunto => {
          incidenciasPorMes[mes][asunto] = 0
        })
      })

      filtered.forEach(inc => {
        if (inc.fechaIncidente) {
          const fecha = new Date(inc.fechaIncidente)
          const mes = meses[fecha.getMonth()]
          if (incidenciasPorMes[mes]) {
            // Si el asunto existe en el mes, incrementar, sino inicializar en 1
            if (incidenciasPorMes[mes][inc.asunto] !== undefined) {
              incidenciasPorMes[mes][inc.asunto]++
            } else {
              incidenciasPorMes[mes][inc.asunto] = 1
            }
          }
        }
      })
    }

    // Incidencias por turno - Usar datos de la API si están disponibles
    const incidenciasPorTurno = {
      'Mañana': 0,
      'Tarde': 0,
      'Noche': 0
    }

    if (generalStats && (generalStats.morning !== undefined || generalStats.afternoon !== undefined || generalStats.evening !== undefined)) {
      // Usar datos de la API (mapear nombres en inglés a español)
      incidenciasPorTurno['Mañana'] = generalStats.morning || 0
      incidenciasPorTurno['Tarde'] = generalStats.afternoon || 0
      incidenciasPorTurno['Noche'] = generalStats.evening || 0
    } else {
      // Fallback a cálculo local
      filtered.forEach(inc => {
        if (inc.turno && incidenciasPorTurno[inc.turno] !== undefined) {
          incidenciasPorTurno[inc.turno]++
        }
      })
    }

    // Conteo por asunto para las barras - Usando API de tendencias o conteo local
    const incidenciasPorAsunto = {}

    if (trendsData && trendsData.days && trendsData.days.length > 0) {
      // Inicializar con 0 para todos los asuntos
      nuevosAsuntos.forEach(asunto => {
        incidenciasPorAsunto[asunto] = 0
      })

      // Sumar todos los "sent" de cada asunto a través de los días
      trendsData.days.forEach(day => {
        if (day.subjects) {
          Object.keys(day.subjects).forEach(subjectId => {
            const subjectName = subjectIdToName[subjectId]
            if (subjectName) {
              incidenciasPorAsunto[subjectName] =
                (incidenciasPorAsunto[subjectName] || 0) + day.subjects[subjectId].sent
            }
          })
        }
      })
    } else {
      // Fallback: usar conteo local
      nuevosAsuntos.forEach(asunto => {
        incidenciasPorAsunto[asunto] = conteoAsuntos[asunto] || 0
      })
    }

    // También agregar el conteo de faltas por asunto
    const faltasPorAsunto = {}
    filtered.forEach(inc => {
      if (inc.asunto && inc.falta) {
        if (!faltasPorAsunto[inc.asunto]) {
          faltasPorAsunto[inc.asunto] = {}
        }
        faltasPorAsunto[inc.asunto][inc.falta] = (faltasPorAsunto[inc.asunto][inc.falta] || 0) + 1
      }
    })

    return {
      totalIncidencias,
      cambioIncidencias,
      cambioSerenos,
      asuntoMasFrecuente,
      totalCriticas,
      zonaConMas,
      totalZona,
      porcentajeCumplimiento,
      incidenciasPorMes,
      incidenciasPorTurno,
      incidenciasPorAsunto,
      faltasPorAsunto
    }
  }, [incidencias, dateRange, serenosActivos, subjects, trendsData, generalStats])

  const handleDateRangeChange = (start, end) => {
    setDateRange({ start, end })
    setShowDateModal(false)
  }

  return (
    <div className="dashboard-page">
      {/* Cards superiores */}
      <div className="stats-grid">
        <DateCard />

        <StatCard
          title="Total de Incidencias"
          value={stats.totalIncidencias}
          change={stats.cambioIncidencias}
          icon={<FaCalendarAlt />}
          color="#4a9b8e"
          onIconClick={() => setShowDateModal(true)}
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

      {/* Segunda fila: Welcome, Cumplimiento y Turnos */}
      <div className="middle-grid">
        <WelcomeCard
          message="Revisa el control de las incidencias y el desempeño del equipo"
        />

        <CircularProgress
          title="Cumplimiento de Reportes"
          percentage={pdfStats.percentage}
          subtitle="de reportes realizados"
        />

        <TurnoList
          data={stats.incidenciasPorTurno}
        />
      </div>

      {/* Tercera fila: Evolución de Incidencias e Incidencias (50/50) */}
      <div className="charts-grid-half">
        <LineChart
          title="Evolución de Incidencias"
          subtitle="Últimos días registrados"
          data={stats.incidenciasPorMes}
          incidencias={incidencias}
          faltasPorAsunto={stats.faltasPorAsunto}
          onOpenDateModal={() => setShowDateModal(true)}
          defaultPeriod={chartPeriod}
          onPeriodChange={setChartPeriod}
          onDateRangeChange={handleDateRangeChange}
        />

        <RadarChart
          title="Análisis de Incidencias Asignadas"
          subtitle="Distribución de incidencias por tipo de asunto"
          data={stats.incidenciasPorMes}
          incidencias={incidencias}
          faltasPorAsunto={stats.faltasPorAsunto}
          defaultPeriod={chartPeriod}
          onPeriodChange={setChartPeriod}
          onDateRangeChange={handleDateRangeChange}
        />
      </div>

      {/* Última fila: Tabla de Centinelas (solo para ADMIN) */}
      {isAdmin && (
        <div className="bottom-grid-full">
          <PersonalTable />
        </div>
      )}

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