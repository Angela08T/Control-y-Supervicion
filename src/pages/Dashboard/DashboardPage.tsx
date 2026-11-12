import React, { useState, useMemo, useEffect } from 'react'
import { useAppSelector } from '../../store/hooks'
import { ROLES } from '../../utils/permissions'
import { TbAlertTriangle, TbFileText, TbMapPin, TbMoon, TbSunHigh, TbSunset2 } from 'react-icons/tb'
import { canSee, type NavKey } from '../../utils/navigation'
import { loadIncidencias, getPDFDownloadStats } from '../../utils/storage'
import { getReports } from '../../api/report'
import { getFieldSupervisionStats, getAllOffenders, getDashboardTrends, getDashboardGeneral } from '../../api/statistics'
import useSubjects from '../../hooks/Subject/useSubjects'
import type { DashboardGeneral, DashboardTrends, Incidencia, Offender, StoredIncidencia } from '@/types'
import StatCard from './components/StatCard'
import WelcomeCard from './components/WelcomeCard'
import EvolucionChart from './components/EvolucionChart'
import TotalHero from './components/TotalHero'
import ZonaRanking from './components/ZonaRanking'
import AsuntoRanking from './components/AsuntoRanking'
import { nombreCorto } from './asuntos'
import PersonalTable from './components/PersonalTable'
import TurnoList from './components/TurnoList'
import DateRangeModal from './components/DateRangeModal'
import PeriodFilter, { etiquetaPeriodo, periodoDesde, periodoPersonalizado, toISODate, type Periodo } from './components/PeriodFilter'

/** Incidencia en cualquiera de sus formas: legado de localStorage o fila de la API. */
type IncidenciaItem = StoredIncidencia | Incidencia

/** Offender con el campo `status` que usa el dashboard (no declarado en `Offender`). */
interface OffenderListItem extends Offender {
  status?: string
}

/** Respuesta de GET /statistics/field-supervision (sin tipo en el backend). */
interface FieldSupervisionResponse {
  data?: {
    serenosEnCampo?: number
    serenosSinConexion?: number
    nivelCumplimiento?: number
  }
}

/**
 * Fecha de una incidencia en formato AAAA-MM-DD. La API la entrega como DD/MM/AAAA y las guardadas
 * localmente como AAAA-MM-DD (ISO); sin normalizar, el filtro de periodo descartaba todas las de la API.
 */
function fechaISO(valor?: string | null): string {
  const v = String(valor || '').trim()
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(v)
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
  return /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : ''
}

export default function DashboardPage() {
  // Obtener el rol del usuario desde Redux
  const userRole = useAppSelector(state => state.auth.role)
  const isAdmin = userRole === ROLES.ADMIN
  const permissions = useAppSelector(state => state.auth.permissions)
  // Destino de la flecha de cada metrica, solo si el rol puede ver esa pagina
  const linkTo = (key: NavKey) => (canSee(permissions, key) ? `/dashboard/${userRole}/${key}` : undefined)

  const [incidencias, setIncidencias] = useState<IncidenciaItem[]>(loadIncidencias())
  const [showDateModal, setShowDateModal] = useState(false)
  // Un solo periodo para toda la pagina (metricas, turnos y graficos); por defecto los ultimos 30 dias
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoDesde('30D'))
  const [serenosActivos, setSerenosActivos] = useState(0)
  const [pdfStats, setPdfStats] = useState(getPDFDownloadStats())
  const [supervisionData, setSupervisionData] = useState({
    serenosEnCampo: 0,
    serenosSinConexion: 0,
    nivelCumplimiento: 0
  })
  const [loading, setLoading] = useState(true)
  const [trendsData, setTrendsData] = useState<DashboardTrends | null>(null) // Datos de tendencias de la API
  const [generalStats, setGeneralStats] = useState<DashboardGeneral | null>(null) // Datos generales (incidencias críticas y zonas)

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
      const offendersPayload: unknown = offendersResponse?.data
      const offendersList: OffenderListItem[] = Array.isArray(offendersResponse?.data?.data)
        ? offendersResponse.data.data
        : (Array.isArray(offendersPayload) ? offendersPayload as OffenderListItem[] : [])

      const activeCount = offendersList.filter(o => o.status === 'active').length || 0
      setSerenosActivos(activeCount)
    } catch (error) {
      setSerenosActivos(23) // Valor por defecto
    }

    try {
      // Obtener datos de supervisión de campo
      const supervisionResponse = (await getFieldSupervisionStats()) as FieldSupervisionResponse | null | undefined
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
      const startDate = toISODate(periodo.start)
      const endDate = toISODate(periodo.end)

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
  }, [periodo])

  // Calcular estadísticas
  const stats = useMemo(() => {
    // Solo las incidencias del periodo elegido (se compara la fecha YYYY-MM-DD para no depender de la zona horaria)
    const desde = toISODate(periodo.start)
    const hasta = toISODate(periodo.end)
    const filtered = incidencias.filter(inc => {
      const fecha = fechaISO(inc.fechaIncidente)
      return fecha !== '' && fecha >= desde && fecha <= hasta
    })

    // Total de incidencias
    const totalIncidencias = filtered.length
    
    // Calcular porcentaje de cambio (comparando con mes anterior - simulado)
    const cambioIncidencias = totalIncidencias > 0 ? '+10%' : '0%'

    // Cambios/porcentajes (calculados o simulados)
    const cambioSerenos = serenosActivos > 20 ? '+5%' : '0%'

    // Calcular conteo de asuntos (necesario para varios cálculos)
    const conteoAsuntos: Record<string, number> = {}
    filtered.forEach(inc => {
      conteoAsuntos[inc.asunto] = (conteoAsuntos[inc.asunto] || 0) + 1
    })

    // Incidencia crítica - Usar datos de la API si están disponibles
    let asuntoMasFrecuente: string, totalCriticas: number
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
    let zonaConMas: string, totalZona: number
    if (generalStats?.top_jurisdiction) {
      zonaConMas = generalStats.top_jurisdiction.name
      totalZona = generalStats.top_jurisdiction.sent
    } else {
      // Fallback a cálculo local
      const conteoJurisdicciones: Record<string, number> = {}
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
    const incidenciasPorMes: Record<string, Record<string, number>> = {}

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
    const subjectIdToName: Record<string, string> = {}
    if (subjects && subjects.length > 0) {
      subjects.forEach(subject => {
        subjectIdToName[subject.id] = subject.name
      })
    }

    // Si tenemos datos de la API de tendencias, usarlos
    if (trendsData && trendsData.days && trendsData.days.length > 0) {
      // Inicializar estructura para fechas del rango
      const fechasMap: Record<string, Record<string, number>> = {}
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
      // Fallback: contar por dia dentro del periodo, con las incidencias locales
      const etiquetaDia = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`
      for (const d = new Date(periodo.start); d <= periodo.end; d.setDate(d.getDate() + 1)) {
        const label = etiquetaDia(d)
        incidenciasPorMes[label] = {}
        nuevosAsuntos.forEach(asunto => {
          incidenciasPorMes[label][asunto] = 0
        })
      }

      filtered.forEach(inc => {
        const [y, m, dd] = fechaISO(inc.fechaIncidente).split('-').map(Number)
        if (!y || !m || !dd) return
        const label = etiquetaDia(new Date(y, m - 1, dd))
        if (incidenciasPorMes[label]) {
          incidenciasPorMes[label][inc.asunto] = (incidenciasPorMes[label][inc.asunto] || 0) + 1
        }
      })
    }

    // Incidencias por turno - Usar datos de la API si están disponibles
    const incidenciasPorTurno: Record<string, number> = {
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
    const incidenciasPorAsunto: Record<string, number> = {}

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
    const faltasPorAsunto: Record<string, Record<string, number>> = {}
    filtered.forEach(inc => {
      if (inc.asunto && inc.falta) {
        if (!faltasPorAsunto[inc.asunto]) {
          faltasPorAsunto[inc.asunto] = {}
        }
        faltasPorAsunto[inc.asunto][inc.falta] = (faltasPorAsunto[inc.asunto][inc.falta] || 0) + 1
      }
    })

    // Ranking de jurisdicciones del periodo (top 3), con las incidencias cargadas
    const porZona: Record<string, number> = {}
    filtered.forEach(inc => {
      if (inc.jurisdiccion) porZona[inc.jurisdiccion] = (porZona[inc.jurisdiccion] || 0) + 1
    })
    const zonasRanking = Object.entries(porZona)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)

    // Total por dia (suma de todos los asuntos), para la tendencia y el grafico de evolucion
    const totalesPorDia = Object.entries(incidenciasPorMes).map(([label, porAsunto]) => ({
      label,
      total: Object.values(porAsunto).reduce((a, b) => a + b, 0)
    }))

    // Turno con mas incidencias
    const [turnoTop, turnoTopTotal] = Object.entries(incidenciasPorTurno).reduce(
      (best, cur) => (cur[1] > best[1] ? cur : best),
      ['', 0] as [string, number]
    )
    const totalTurnos = Object.values(incidenciasPorTurno).reduce((a, b) => a + b, 0)

    // La tarjeta "Zona con mas incidencias" usa el mismo ranking que la lista, para que nunca se contradigan
    if (zonasRanking.length > 0) {
      zonaConMas = zonasRanking[0].nombre
      totalZona = zonasRanking[0].total
    }

    return {
      zonasRanking,
      totalesPorDia,
      turnoTop,
      turnoTopTotal,
      totalTurnos,
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
  }, [incidencias, periodo, serenosActivos, subjects, trendsData, generalStats])

  // "Limpiar filtro" en el selector personalizado vuelve a los ultimos 30 dias
  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setPeriodo(start && end ? periodoPersonalizado(start, end) : periodoDesde('30D'))
    setShowDateModal(false)
  }

  const rangoTexto = etiquetaPeriodo(periodo)

  return (
    <div className="flex flex-col gap-5">
      {/* Titulo y saludo; el filtro de periodo afecta a toda la pagina */}
      <WelcomeCard>
        <PeriodFilter variant="inline" periodo={periodo} onChange={setPeriodo} onCustom={() => setShowDateModal(true)} />
      </WelcomeCard>

      {/* Mosaico: total grande con su tendencia + cuatro metricas */}
      <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-5 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
        <div className="row-span-2 max-[1100px]:col-span-2 max-[1100px]:row-span-1 max-[600px]:col-span-1">
          <TotalHero
            total={stats.totalIncidencias}
            change={stats.cambioIncidencias}
            periodo={rangoTexto}
            serie={stats.totalesPorDia.map(d => d.total)}
          />
        </div>

        <StatCard
          title="Asunto más frecuente"
          value={stats.totalCriticas}
          subtitle={nombreCorto(stats.asuntoMasFrecuente)}
          icon={<TbAlertTriangle />}
          color="#e1303c"
          to={linkTo('incidencias')}
        />

        <StatCard
          title="Zona con más incidencias"
          value={stats.totalZona}
          subtitle={stats.zonaConMas}
          icon={<TbMapPin />}
          color="#2f6fe0"
          to={linkTo('incidencias')}
        />

        <StatCard
          title="Reportes con PDF generado"
          value={pdfStats.percentage}
          suffix="%"
          icon={<TbFileText />}
          color="#6aa531"
          to={linkTo('incidencias')}
        />

        <StatCard
          title="Turno con más incidencias"
          value={stats.turnoTopTotal > 0 ? stats.turnoTop : 'Sin datos'}
          subtitle={
            stats.turnoTopTotal > 0
              ? `${stats.turnoTopTotal} de ${stats.totalTurnos} (${Math.round((stats.turnoTopTotal / stats.totalTurnos) * 100)}%)`
              : undefined
          }
          icon={stats.turnoTop === 'Noche' ? <TbMoon /> : stats.turnoTop === 'Tarde' ? <TbSunset2 /> : <TbSunHigh />}
          color="#3b82f6"
          to={linkTo('estadisticas')}
        />
      </div>

      {/* Evolucion + asuntos: misma fila, mismo alto */}
      <div className="grid grid-cols-[1.9fr_1fr] items-stretch gap-5 max-[1100px]:grid-cols-1">
        <div className="min-w-0">
          <EvolucionChart puntos={stats.totalesPorDia} />
        </div>
        <AsuntoRanking data={stats.incidenciasPorAsunto} subtitle={rangoTexto} />
      </div>

      {/* Turnos + zonas */}
      <div className="grid grid-cols-2 items-stretch gap-5 max-[900px]:grid-cols-1">
        <TurnoList data={stats.incidenciasPorTurno} subtitle={rangoTexto} />
        <ZonaRanking zonas={stats.zonasRanking} subtitle={`Top 3 · ${rangoTexto}`} />
      </div>

      {/* Tabla de centinelas (solo para ADMIN) */}
      {isAdmin && <PersonalTable />}

      {/* Modal de rango de fechas */}
      {showDateModal && (
        <DateRangeModal
          onClose={() => setShowDateModal(false)}
          onApply={handleDateRangeChange}
          initialStart={periodo.preset === 'custom' ? periodo.start : null}
          initialEnd={periodo.preset === 'custom' ? periodo.end : null}
        />
      )}
    </div>
  )
}