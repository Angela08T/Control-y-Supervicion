import React, { useState, useEffect } from 'react'
import { FaCalendarAlt } from 'react-icons/fa'
import CalendarModal from './CalendarModal'
import { cn } from '../../../utils/classes'

// Estilos de controles compartidos por los gráficos (iguales en BarChart y LineChart).
// `!` en transition: styles.css (sin capas) tiene `* { transition }` y ganaría a las utilidades.
const chartHeader = 'mb-4 flex flex-wrap items-start justify-between gap-3'
const chartTitle = 'mb-1 text-[16px] font-semibold leading-[1.3] text-content'
const chartSubtitle = 'text-[11px] leading-[1.4] text-content-2'
const timeRangeControls = 'flex flex-wrap items-center gap-3'
const timeRangeButtons = 'flex gap-2 rounded-lg border border-line bg-surface p-1'
const timeBtn = 'cursor-pointer rounded-md border-none px-3 py-1.5 text-[12px] font-semibold [transition:all_0.3s_ease]!'
const timeBtnIdle = 'bg-transparent text-content-2 hover:bg-[rgba(59,130,246,0.1)] hover:text-primary'
const timeBtnActive = 'bg-[linear-gradient(135deg,#0c4a6e_0%,#075985_100%)] text-white shadow-[0_2px_8px_rgba(7,89,133,0.3)] dark:bg-[linear-gradient(135deg,#1e40af_0%,#2563eb_100%)] dark:shadow-[0_2px_8px_rgba(37,99,235,0.4)]'
const dateRangeBtn = 'flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-[12px] font-semibold text-content [transition:all_0.3s_ease]! hover:-translate-y-px hover:border-primary hover:bg-[rgba(59,130,246,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:bg-[rgba(15,23,42,0.8)] dark:hover:bg-[rgba(15,23,42,0.95)] [&_svg]:text-[14px] [&_svg]:text-primary'
const tooltip = 'pointer-events-none absolute z-[1000] min-w-[200px] max-w-[280px] rounded-lg border border-line bg-card p-3 shadow-[0_4px_12px_var(--shadow)]'

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
    'Conductas relacionadas con el Cumplimiento del Horario y Asistencia': '#0ea5e9',
    'Conductas relacionadas con el Cumplimiento de Funciones o Desempeño': '#8b5cf6',
    'Conductas relacionadas con el Uso de Recursos o Bienes Municipales': '#10b981',
    'Conductas relacionadas con la Imagen o Representación Institucional': '#f59e0b',
    'Conductas relacionadas con la Convivencia y Comportamiento Institucional': '#ec4899',
    'Conductas que podrían afectar la Seguridad o la Integridad de Personas': '#ef4444'
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
    <div className="relative box-border flex w-full min-w-0 max-w-full flex-col overflow-visible rounded-2xl border border-line bg-transparent! p-5 pb-[15px] shadow-[0_4px_20px_var(--shadow)] [backdrop-filter:blur(10px)]">
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
            <FaCalendarAlt />
            <span>{formatDateRange()}</span>
          </button>
        </div>
      </div>

      {/* Gráfico de Radar */}
      <svg className="mb-0 block h-auto w-full max-w-full shrink-0 overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Gradiente para el polígono */}
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4a9eff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
          </linearGradient>
        </defs>

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
                  fontSize="10"
                  fontWeight="600"
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
          fill="url(#radarGradient)"
          stroke="#4a9eff"
          strokeWidth="2"
          opacity="0.7"
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
                r="5"
                fill={colores[asunto]}
                stroke="#fff"
                strokeWidth="2"
                className="cursor-pointer [transition:all_0.3s_ease]! hover:[r:7] hover:[filter:brightness(1.2)]"
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
              fill="var(--text-primary)"
              fontSize="10"
              fontWeight="600"
              className="fill-[var(--text-primary)] text-[10px] font-semibold"
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
          <div className="mb-2 text-[0.85rem] font-semibold text-content">
            {hoveredSegment.valor} incidencia{hoveredSegment.valor !== 1 ? 's' : ''}
          </div>
          <div className="mb-1.5 text-[0.75rem] text-muted">
            {hoveredSegment.asunto}
          </div>
          {hoveredSegment.topFaltas && hoveredSegment.topFaltas.length > 0 && (
            <div className="mt-1.5 border-t border-line pt-1.5 text-[0.75rem]">
              <div className="mb-1 font-semibold text-content-2">Top 3 faltas:</div>
              {hoveredSegment.topFaltas.map((falta, idx) => (
                <div key={idx} className="mb-0.5 flex justify-between gap-2">
                  <span className="flex-1 text-[0.7rem] text-muted">{falta.falta}</span>
                  <span className="font-semibold text-primary">{falta.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabla inferior con la lista de asuntos - Top 4 */}
      <div className="mt-auto flex flex-wrap justify-center gap-6 border-t border-line px-[15px] py-5">
        {Object.entries(totalesPorAsunto)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([asunto, valor]) => (
            <div
              key={asunto}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-[15px] text-content-2 [transition:all_0.2s_ease]! hover:-translate-y-0.5 hover:opacity-80 hover:shadow-[0_4px_12px_var(--shadow)]"
              onMouseEnter={() => {
                const index = nuevosAsuntos.indexOf(asunto)
                const point = radarPoints[index]
                setHoveredSegment({ asunto, valor, topFaltas: getTopFaltas(asunto), x: point.x, y: point.y })
              }}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="flex items-center gap-2">
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: colores[asunto] }}></span>
                <span className="text-[14px] font-semibold text-content">{nombresCortos[asunto]}</span>
              </div>
              <div className="flex items-center justify-end">
                <span className="ml-2 text-[16px] font-bold text-primary">{valor}</span>
              </div>
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
