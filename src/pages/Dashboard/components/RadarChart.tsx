import React, { useState, useEffect } from 'react'
import { FiCalendar } from 'react-icons/fi'
import CalendarModal from './CalendarModal'
import { cn } from '@/utils/classes'

// Estilos de controles compartidos por los gráficos (iguales en BarChart y LineChart).
const chartHeader = 'mb-4 flex flex-wrap items-start justify-between gap-3'
const chartTitle = 'm-0 text-[15px] font-semibold text-content'
const chartSubtitle = 'mt-0.5 text-xs text-muted'
const timeRangeControls = 'flex flex-wrap items-center gap-2'
const timeRangeButtons = 'inline-flex gap-0.5 rounded-lg border border-line bg-surface p-0.5'
const timeBtn = 'h-8 cursor-pointer rounded-md border-none px-3 text-xs font-medium transition-colors duration-150'
const timeBtnIdle = 'bg-transparent text-content-2 hover:bg-subtle hover:text-content'
const timeBtnActive = 'bg-primary text-btn'
const dateRangeBtn = 'inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 text-xs font-medium text-content-2 transition-colors duration-150 hover:bg-subtle hover:text-content [&_svg]:text-muted'
const tooltip = 'pointer-events-none absolute z-[1000] min-w-[200px] max-w-[280px] rounded-lg border border-line bg-surface p-3 shadow-[0_4px_12px_var(--shadow)]'

/** Incidencias por día/mes: { [fecha]: { [asunto]: cantidad } } */
export type IncidenciasPorDia = Record<string, Record<string, number>>

/** Faltas por asunto: { [asunto]: { [falta]: cantidad } } */
export type FaltasPorAsunto = Record<string, Record<string, number>>

export interface TopFalta {
  falta: string
  cantidad: number
}

interface RadarPoint {
  x: number
  y: number
  radius: number
  angle: number
}

interface HoveredSegment {
  asunto: string
  valor: number
  topFaltas: TopFalta[]
  x: number
  y: number
}

export interface RadarChartProps {
  title: string
  subtitle: string
  data: IncidenciasPorDia
  incidencias?: unknown
  faltasPorAsunto?: FaltasPorAsunto
  defaultPeriod?: string
  onPeriodChange?: (period: string) => void
  onDateRangeChange?: (start: Date, end: Date) => void
}

export default function RadarChart({ title, subtitle, data, incidencias, faltasPorAsunto, defaultPeriod = '30D', onPeriodChange, onDateRangeChange }: RadarChartProps) {
  // Nuevos 6 asuntos (deben coincidir exactamente con los nombres de la API)
  const nuevosAsuntos = [
    'Conductas relacionadas con el Cumplimiento del Horario y Asistencia',
    'Conductas relacionadas con el Cumplimiento de Funciones o Desempeño',
    'Conductas relacionadas con el Uso de Recursos o Bienes Municipales',
    'Conductas relacionadas con la Imagen o Representación Institucional',
    'Conductas relacionadas con la Convivencia y Comportamiento Institucional',
    'Conductas que podrían afectar la Seguridad o la Integridad de Personas'
  ]

  const [rangoTiempo, setRangoTiempo] = useState(defaultPeriod)
  const [showCalendar, setShowCalendar] = useState(false)
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | null>(null)
  const [hoveredSegment, setHoveredSegment] = useState<HoveredSegment | null>(null)

  // Sincronizar con el período padre
  useEffect(() => {
    setRangoTiempo(defaultPeriod)
  }, [defaultPeriod])

  // Notificar al padre cuando cambia el período
  const handlePeriodChange = (newPeriod: string) => {
    setRangoTiempo(newPeriod)
    if (onPeriodChange && newPeriod !== 'custom') {
      onPeriodChange(newPeriod)
    }
  }

  // Calcular totales por asunto desde los datos
  const totalesPorAsunto: Record<string, number> = {}
  const dias = Object.keys(data)

  nuevosAsuntos.forEach(asunto => {
    totalesPorAsunto[asunto] = 0
  })

  dias.forEach(dia => {
    nuevosAsuntos.forEach(asunto => {
      totalesPorAsunto[asunto] += data[dia][asunto] || 0
    })
  })

  // Colores para los 6 nuevos asuntos
  const colores: Record<string, string> = {
    'Conductas relacionadas con el Cumplimiento del Horario y Asistencia': '#1e3a8a', // Primary
    'Conductas relacionadas con el Cumplimiento de Funciones o Desempeño': '#3b82f6', // Secondary
    'Conductas relacionadas con el Uso de Recursos o Bienes Municipales': '#10b981', // Success
    'Conductas relacionadas con la Imagen o Representación Institucional': '#f59e0b', // Warning
    'Conductas relacionadas con la Convivencia y Comportamiento Institucional': '#64748b', // Gris
    'Conductas que podrían afectar la Seguridad o la Integridad de Personas': '#ef4444' // Danger
  }

  // Nombres cortos para mostrar
  const nombresCortos: Record<string, string> = {
    'Conductas relacionadas con el Cumplimiento del Horario y Asistencia': 'Horario y Asistencia',
    'Conductas relacionadas con el Cumplimiento de Funciones o Desempeño': 'Funciones y Desempeño',
    'Conductas relacionadas con el Uso de Recursos o Bienes Municipales': 'Uso de Recursos',
    'Conductas relacionadas con la Imagen o Representación Institucional': 'Imagen Institucional',
    'Conductas relacionadas con la Convivencia y Comportamiento Institucional': 'Convivencia',
    'Conductas que podrían afectar la Seguridad o la Integridad de Personas': 'Seguridad'
  }

  const handleCalendarApply = (start: Date, end: Date) => {
    setCustomDateRange({ start, end })
    setRangoTiempo('custom')
    // Notificar al padre del nuevo rango de fechas personalizado
    if (onDateRangeChange) {
      onDateRangeChange(start, end)
    }
  }

  const formatDateRange = () => {
    if (rangoTiempo === 'custom' && customDateRange) {
      const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
      const start = customDateRange.start
      const end = customDateRange.end
      return `${start.getDate()} ${meses[start.getMonth()]} - ${end.getDate()} ${meses[end.getMonth()]}`
    }
    return '6 oct - 4 nov'
  }

  // Calcular el valor máximo para escalar el radar
  const maxValor = Math.max(...Object.values(totalesPorAsunto), 1)

  // Configuración del SVG para radar (mismo tamaño que BarChart)
  const width = 600
  const height = 280  // Reducido para mantener compacto
  const centerX = width / 2
  const centerY = height / 2  // Centro vertical
  const maxRadius = 100 // Radio máximo del radar ajustado

  // Número de círculos concéntricos (niveles)
  const numLevels = 5
  const angleStep = (2 * Math.PI) / nuevosAsuntos.length

  // Calcular las posiciones de cada punto del radar
  const getRadarPoint = (asunto: string, index: number): RadarPoint => {
    const valor = totalesPorAsunto[asunto]
    const radius = (valor / maxValor) * maxRadius
    const angle = angleStep * index - Math.PI / 2 // Comenzar desde arriba

    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      radius,
      angle
    }
  }

  // Generar puntos del polígono
  const radarPoints = nuevosAsuntos.map((asunto, index) => getRadarPoint(asunto, index))
  const pathData = radarPoints.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z'

  // Obtener las 3 principales faltas por asunto
  const getTopFaltas = (asunto: string): TopFalta[] => {
    if (!faltasPorAsunto || !faltasPorAsunto[asunto]) return []

    const faltasArray = Object.entries(faltasPorAsunto[asunto])
      .map(([falta, cantidad]) => ({ falta, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3)

    return faltasArray
  }

  // Calcular el total de incidencias
  const totalIncidencias = Object.values(totalesPorAsunto).reduce((sum, val) => sum + val, 0)

  // Encontrar el asunto con más incidencias
  const asuntoMayor = Object.entries(totalesPorAsunto).reduce((max, [asunto, valor]) =>
    valor > max.valor ? { asunto, valor } : max
  , { asunto: '', valor: 0 })

  return (
    <div className="relative box-border flex w-full min-w-0 max-w-full flex-col overflow-visible rounded-xl border border-line bg-surface p-5">
      <div className={chartHeader}>
        <div>
          <h3 className={chartTitle}>{title}</h3>
          <p className={chartSubtitle}>{subtitle}</p>
        </div>

        <div className={timeRangeControls}>
          <div className={timeRangeButtons}>
            <button
              className={cn(timeBtn, rangoTiempo === '7D' ? timeBtnActive : timeBtnIdle)}
              onClick={() => handlePeriodChange('7D')}
            >
              7D
            </button>
            <button
              className={cn(timeBtn, rangoTiempo === '15D' ? timeBtnActive : timeBtnIdle)}
              onClick={() => handlePeriodChange('15D')}
            >
              15D
            </button>
            <button
              className={cn(timeBtn, rangoTiempo === '30D' ? timeBtnActive : timeBtnIdle)}
              onClick={() => handlePeriodChange('30D')}
            >
              30D
            </button>
          </div>

          <button className={dateRangeBtn} onClick={() => setShowCalendar(true)}>
            <FiCalendar aria-hidden />
            <span>{formatDateRange()}</span>
          </button>
        </div>
      </div>

      {/* Gráfico de Radar */}
      <svg className="mb-0 block h-auto w-full max-w-full shrink-0 overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Círculos concéntricos de fondo */}
        {Array.from({ length: numLevels }, (_, i) => {
          const radius = ((i + 1) / numLevels) * maxRadius
          const levelValue = Math.round(((i + 1) / numLevels) * maxValor)

          return (
            <g key={`level-${i}`}>
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.3"
              />
              {/* Etiquetas de valores */}
              {i === numLevels - 1 && (
                <text
                  x={centerX}
                  y={centerY - radius - 5}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="11"
                >
                  {levelValue}
                </text>
              )}
            </g>
          )
        })}

        {/* Líneas radiales desde el centro */}
        {nuevosAsuntos.map((asunto, index) => {
          const angle = angleStep * index - Math.PI / 2
          const endX = centerX + maxRadius * Math.cos(angle)
          const endY = centerY + maxRadius * Math.sin(angle)

          return (
            <line
              key={`radial-${index}`}
              x1={centerX}
              y1={centerY}
              x2={endX}
              y2={endY}
              stroke="var(--border)"
              strokeWidth="1"
              opacity="0.3"
            />
          )
        })}

        {/* Polígono del radar (datos) */}
        <path
          d={pathData}
          fill="#1e3a8a"
          fillOpacity="0.12"
          stroke="#1e3a8a"
          strokeWidth="2"
        />

        {/* Puntos en cada vértice del radar */}
        {radarPoints.map((point, index) => {
          const asunto = nuevosAsuntos[index]
          const valor = totalesPorAsunto[asunto]

          if (valor === 0) return null

          return (
            <g
              key={`point-${index}`}
              onMouseEnter={() => setHoveredSegment({ asunto, valor, topFaltas: getTopFaltas(asunto), x: point.x, y: point.y })}
              onMouseLeave={() => setHoveredSegment(null)}
              className="cursor-pointer"
            >
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill={colores[asunto]}
                stroke="var(--bg-secondary)"
                strokeWidth="2"
                className="cursor-pointer"
              />
            </g>
          )
        })}

        {/* Etiquetas de los asuntos */}
        {nuevosAsuntos.map((asunto, index) => {
          const angle = angleStep * index - Math.PI / 2
          const labelRadius = maxRadius + 30
          const labelX = centerX + labelRadius * Math.cos(angle)
          const labelY = centerY + labelRadius * Math.sin(angle)

          // Ajustar la posición del texto según el ángulo
          let textAnchor: 'start' | 'middle' | 'end' = 'middle'
          if (angle > -Math.PI / 2 && angle < Math.PI / 2) {
            textAnchor = 'start'
          } else if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
            textAnchor = 'end'
          }

          return (
            <text
              key={`label-${index}`}
              x={labelX}
              y={labelY}
              textAnchor={textAnchor}
              fill="var(--text-muted)"
              fontSize="11"
            >
              {nombresCortos[asunto]}
            </text>
          )
        })}
      </svg>

      {/* Tooltip flotante */}
      {hoveredSegment && (
        <div
          className={cn(tooltip, '-translate-x-1/2 -translate-y-[120%]')}
          style={{
            left: `${(hoveredSegment.x / width) * 100}%`,
            top: `${(hoveredSegment.y / height) * 100}%`
          }}
        >
          <div className="mb-1 text-[13px] font-semibold text-content">
            {hoveredSegment.valor} incidencia{hoveredSegment.valor !== 1 ? 's' : ''}
          </div>
          <div className="mb-1.5 text-xs text-muted">
            {hoveredSegment.asunto}
          </div>
          {hoveredSegment.topFaltas && hoveredSegment.topFaltas.length > 0 && (
            <div className="mt-1.5 border-t border-line pt-1.5 text-xs">
              <div className="mb-1 font-semibold text-content-2">Top 3 faltas:</div>
              {hoveredSegment.topFaltas.map((falta, idx) => (
                <div key={idx} className="mb-0.5 flex justify-between gap-2">
                  <span className="flex-1 text-xs text-muted">{falta.falta}</span>
                  <span className="font-semibold text-content">{falta.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabla inferior con la lista de asuntos - Top 4 */}
      <div className="mt-auto flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-line pt-4">
        {Object.entries(totalesPorAsunto)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([asunto, valor]) => (
            <div
              key={asunto}
              className="flex items-center gap-2 text-[13px] text-content-2"
              onMouseEnter={() => {
                const index = nuevosAsuntos.indexOf(asunto)
                const point = radarPoints[index]
                setHoveredSegment({ asunto, valor, topFaltas: getTopFaltas(asunto), x: point.x, y: point.y })
              }}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colores[asunto] }} aria-hidden></span>
              <span>{nombresCortos[asunto]}</span>
              <span className="font-semibold text-content">{valor}</span>
            </div>
          ))}
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <CalendarModal
          onClose={() => setShowCalendar(false)}
          onApply={handleCalendarApply}
        />
      )}
    </div>
  )
}
