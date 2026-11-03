import React, { useState, useEffect } from 'react'
import { FaCalendarAlt } from 'react-icons/fa'
import CalendarModal from './CalendarModal'
import { cn } from '../../../utils/classes'

// Estilos de controles compartidos por los gráficos (iguales en BarChart y RadarChart).
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
// Botones de filtro: `.filter-button.active` y `[data-theme=dark] .filter-button` (que va después en styles.css) se resuelven con dark: después de la base
const filterBtnBase = 'flex cursor-pointer items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-[11px] font-semibold [transition:all_0.3s_ease]! hover:-translate-y-0.5 dark:bg-[rgba(15,23,42,0.8)] dark:hover:bg-[rgba(15,23,42,0.95)]'
const filterBtnIdle = 'bg-surface border-transparent text-content-2 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:[border-color:var(--filter-color)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
const filterBtnActive = 'text-white [background:var(--filter-color)] [border-color:var(--filter-color)] shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
const filterDot = 'size-2.5 rounded-full [transition:all_0.3s_ease]!'
const filterDotActive = 'bg-white! shadow-[0_2px_4px_rgba(0,0,0,0.2)]'

/** Incidencias por día/mes: { [fecha]: { [asunto]: cantidad } } */
export type IncidenciasPorDia = Record<string, Record<string, number>>

/** Faltas por asunto: { [asunto]: { [falta]: cantidad } } */
export type FaltasPorAsunto = Record<string, Record<string, number>>

export interface TopFalta {
  falta: string
  cantidad: number
}

interface HoveredPoint {
  asunto: string
  dia: string
  value: number
  topFaltas: TopFalta[]
  x: number
  y: number
}

export interface LineChartProps {
  title: string
  subtitle: string
  data: IncidenciasPorDia
  incidencias?: unknown
  faltasPorAsunto?: FaltasPorAsunto
  onOpenDateModal?: () => void
  defaultPeriod?: string
  onPeriodChange?: (period: string) => void
  onDateRangeChange?: (start: Date, end: Date) => void
}

export default function LineChart({ title, subtitle, data, incidencias, faltasPorAsunto, onOpenDateModal, defaultPeriod = '30D', onPeriodChange, onDateRangeChange }: LineChartProps) {
  // Nuevos 6 asuntos (deben coincidir exactamente con los nombres de la API)
  const nuevosAsuntos = [
    'Conductas relacionadas con el Cumplimiento del Horario y Asistencia',
    'Conductas relacionadas con el Cumplimiento de Funciones o Desempeño',
    'Conductas relacionadas con el Uso de Recursos o Bienes Municipales',
    'Conductas relacionadas con la Imagen o Representación Institucional',
    'Conductas relacionadas con la Convivencia y Comportamiento Institucional',
    'Conductas que podrían afectar la Seguridad o la Integridad de Personas'
  ]

  const [filtrosActivos, setFiltrosActivos] = useState<Record<string, boolean>>(
    nuevosAsuntos.reduce<Record<string, boolean>>((acc, asunto) => ({ ...acc, [asunto]: true }), {})
  )
  const [rangoTiempo, setRangoTiempo] = useState(defaultPeriod) // 7D, 15D, 30D, custom
  const [showCalendar, setShowCalendar] = useState(false)
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | null>(null)
  const [animationKey, setAnimationKey] = useState<number>(0)
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null)

  // Sincronizar con el período padre
  useEffect(() => {
    setRangoTiempo(defaultPeriod)
  }, [defaultPeriod])

  // Re-ejecutar animación cuando cambian los datos
  useEffect(() => {
    setAnimationKey(prev => prev + 1)
  }, [rangoTiempo, customDateRange, data])

  // Notificar al padre cuando cambia el período (solo para botones, no para custom)
  const handlePeriodChange = (newPeriod: string) => {
    setRangoTiempo(newPeriod)
    if (onPeriodChange && newPeriod !== 'custom') {
      onPeriodChange(newPeriod)
    }
  }

  // Usar los datos que vienen del API (data) directamente, ya que DashboardPage los filtra según el período
  const datosActuales = data

  const meses = Object.keys(datosActuales)

  // Calcular máximo valor basado en los filtros activos
  const getMaxValue = () => {
    const valores = meses.map(mes => {
      let suma = 0
      Object.keys(filtrosActivos).forEach(asunto => {
        if (filtrosActivos[asunto]) {
          suma += datosActuales[mes][asunto] || 0
        }
      })
      return suma
    })
    return Math.max(...valores, 1)
  }

  const maxValue = getMaxValue()

  // Colores para los 6 nuevos asuntos
  const colores: Record<string, string> = {
    'Conductas relacionadas con el Cumplimiento del Horario y Asistencia': '#0ea5e9', // Azul cielo
    'Conductas relacionadas con el Cumplimiento de Funciones o Desempeño': '#8b5cf6', // Morado
    'Conductas relacionadas con el Uso de Recursos o Bienes Municipales': '#10b981', // Verde
    'Conductas relacionadas con la Imagen o Representación Institucional': '#f59e0b', // Naranja
    'Conductas relacionadas con la Convivencia y Comportamiento Institucional': '#ec4899', // Rosa
    'Conductas que podrían afectar la Seguridad o la Integridad de Personas': '#ef4444' // Rojo
  }

  // Obtener las 3 principales faltas por asunto
  const getTopFaltas = (asunto: string, dia: string): TopFalta[] => {
    if (!faltasPorAsunto || !faltasPorAsunto[asunto]) return []

    // Convertir el objeto de faltas a array y ordenar por cantidad
    const faltasArray = Object.entries(faltasPorAsunto[asunto])
      .map(([falta, cantidad]) => ({ falta, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3) // Top 3

    return faltasArray
  }

  const toggleFiltro = (asunto: string) => {
    setFiltrosActivos(prev => ({
      ...prev,
      [asunto]: !prev[asunto]
    }))
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

  const width = 600  // Ancho base para viewBox (se escalará automáticamente)
  const height = 360  // Aumentado para dar más espacio vertical
  const paddingTop = 50  // Padding superior aumentado para evitar que los picos choquen arriba
  const paddingBottom = 50  // Reducido para acercar las fechas al borde inferior
  const paddingLeft = 20  // Espacio base izquierdo
  const paddingRight = 30  // Aumentado para dar espacio derecho
  const yAxisLabelWidth = 35
  const chartWidth = width - paddingLeft - paddingRight - yAxisLabelWidth
  const chartHeight = height - paddingTop - paddingBottom
  const marginInside = 10  // Margen interno para evitar que las líneas toquen los bordes

  const getX = (index: number) => {
    // Los puntos empiezan después de paddingLeft + yAxisLabelWidth + margen interno
    const effectiveWidth = chartWidth - (marginInside * 2)
    return paddingLeft + yAxisLabelWidth + marginInside + (index / (meses.length - 1)) * effectiveWidth
  }
  const getY = (value: number) => {
    // Calcular posición Y desde la base hacia arriba con margen interno
    const effectiveHeight = chartHeight - (marginInside * 2)
    return paddingTop + marginInside + effectiveHeight - (value / maxValue) * effectiveHeight
  }

  // Calcular valores del eje Y (5 niveles)
  const yAxisValues = [0, 1, 2, 3, 4].map(i => Math.round((maxValue / 4) * i))

  // Crear path con curvas suaves tipo Bezier cúbica para mejor apariencia
  // Siempre empieza desde el borde izquierdo del gráfico en la parte inferior (valor 0)
  const createPath = (values: number[]) => {
    if (values.length === 0) return ''

    // Comenzar desde el borde izquierdo en la parte inferior (valor 0)
    const startX = paddingLeft + yAxisLabelWidth
    const zeroY = getY(0)

    // Iniciar el path desde el borde izquierdo en la base
    let path = `M ${startX} ${zeroY}`

    // Línea hasta el primer punto
    path += ` L ${getX(0)} ${getY(values[0])}`

    // Conectar todos los puntos con curvas Bezier
    for (let i = 0; i < values.length - 1; i++) {
      const x1 = getX(i)
      const y1 = getY(values[i])
      const x2 = getX(i + 1)
      const y2 = getY(values[i + 1])

      // Usar curvas Bezier cúbicas para transiciones más suaves
      const controlPointDistance = (x2 - x1) * 0.5
      const cp1x = x1 + controlPointDistance
      const cp1y = y1
      const cp2x = x2 - controlPointDistance
      const cp2y = y2

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`
    }

    return path
  }

  // Calcular la longitud aproximada del path para animar correctamente
  // Incluye la línea inicial desde el borde izquierdo (base) hasta el primer punto
  const getPathLength = (values: number[]) => {
    if (values.length === 0) return 0

    let length = 0

    // Incluir la línea diagonal desde el borde izquierdo (base) hasta el primer punto
    const startX = paddingLeft + yAxisLabelWidth
    const zeroY = getY(0)
    const firstX = getX(0)
    const firstY = getY(values[0])
    length += Math.sqrt((firstX - startX) ** 2 + (firstY - zeroY) ** 2)

    // Calcular longitud de todas las curvas
    for (let i = 0; i < values.length - 1; i++) {
      const x1 = getX(i)
      const y1 = getY(values[i])
      const x2 = getX(i + 1)
      const y2 = getY(values[i + 1])

      // Para curvas Bezier, la longitud real es mayor que la línea recta
      // Usar factor de 1.5 para asegurar que la animación complete todo el recorrido
      const straightLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
      length += straightLength * 1.5
    }

    return length
  }
  
  return (
    <div className="relative box-border w-full min-w-0 max-w-full overflow-visible rounded-2xl border border-line bg-transparent! p-5 shadow-[0_4px_20px_var(--shadow)] [backdrop-filter:blur(10px)]">
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
      
      <svg className="mb-4 block h-auto w-full max-w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Definir área de clipping para que nada se dibuje fuera del gráfico */}
        <defs>
          <clipPath id="chart-clip">
            <rect
              x={paddingLeft + yAxisLabelWidth}
              y={paddingTop}
              width={chartWidth}
              height={chartHeight}
            />
          </clipPath>
        </defs>

        {/* Rectángulo de borde del gráfico */}
        <rect
          x={paddingLeft + yAxisLabelWidth}
          y={paddingTop}
          width={chartWidth}
          height={chartHeight}
          fill="none"
          stroke="var(--border)"
          strokeWidth="2"
        />

        {/* Grid lines horizontales */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = paddingTop + (i / 4) * chartHeight
          return (
            <g key={`h-${i}`}>
              <line
                x1={paddingLeft + yAxisLabelWidth}
                y1={y}
                x2={paddingLeft + yAxisLabelWidth + chartWidth}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              {/* Etiquetas del eje Y */}
              <text
                x={paddingLeft + yAxisLabelWidth - 10}
                y={y + 4}
                textAnchor="end"
                fill="var(--text-muted)"
                fontSize="10"
                fontWeight="600"
              >
                {yAxisValues[4 - i]}
              </text> 
            </g>
          )
        })}

        {/* Líneas para cada asunto - sin clipPath para que empiecen desde el borde */}
        {nuevosAsuntos.map((asunto, asuntoIndex) => {
          if (!filtrosActivos[asunto]) return null

          const values = meses.map(mes => datosActuales[mes][asunto])
          const color = colores[asunto]
          const pathId = `path-${asunto.replace(/\s+/g, '-')}`
          const pathLength = getPathLength(values)
          const lineDelay = asuntoIndex * 0.2 // delay entre cada línea

          return (
            <g key={`${asunto}-${animationKey}`}>
              {/* Línea dibujándose de izquierda a derecha */}
              <path
                id={pathId}
                d={createPath(values)}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="[transition:stroke-width_0.3s_ease,opacity_0.3s_ease]! [will-change:stroke-dashoffset] animate-[drawLine_2.5s_ease-in-out_forwards]"
                style={{
                  strokeDasharray: pathLength,
                  strokeDashoffset: pathLength,
                  animationDelay: `${lineDelay}s`
                }}
              />

              {/* Puntos solo donde hay datos (value > 0) */}
              {values.map((value, i) => {
                // Solo mostrar puntos donde hay datos
                if (value === 0) return null

                const topFaltas = getTopFaltas(asunto, meses[i])

                return (
                  <g
                    key={`${asunto}-${i}`}
                    className="group/point cursor-pointer [transform-origin:center]"
                  >
                    <circle
                      cx={getX(i)}
                      cy={getY(value)}
                      r="5"
                      fill="white"
                      stroke={color}
                      strokeWidth="2.5"
                      className="cursor-pointer [pointer-events:all] [transition:all_0.2s_ease]! group-hover/point:[r:5] group-hover/point:[stroke-width:3]"
                      onMouseEnter={() => setHoveredPoint({ asunto, dia: meses[i], value, topFaltas, x: getX(i), y: getY(value) })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    <circle
                      cx={getX(i)}
                      cy={getY(value)}
                      r="2.5"
                      fill={color}
                      className="pointer-events-none [transition:all_0.2s_ease]! group-hover/point:[r:2.5]"
                    />
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* Etiquetas del eje X - Mostrar fechas espaciadas */}
        {meses.map((mes, i) => {
          // Calcular cuántas etiquetas mostrar según la cantidad total de días
          const totalDias = meses.length
          let skipFactor = 1

          if (totalDias > 30) skipFactor = Math.ceil(totalDias / 10) // Mostrar ~10 etiquetas
          else if (totalDias > 20) skipFactor = Math.ceil(totalDias / 8) // Mostrar ~8 etiquetas
          else if (totalDias > 10) skipFactor = 2 // Cada 2 días
          else skipFactor = 1 // Mostrar todos

          const shouldShow = i % skipFactor === 0 || i === meses.length - 1 // Siempre mostrar el último

          if (!shouldShow) return null

          return (
            <text
              key={mes}
              x={getX(i)}
              y={height - 15}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="10"
              fontWeight="600"
              className="opacity-80"
            >
              {mes}
            </text>
          )
        })}
      </svg>

      {/* Tooltip flotante con prevención de overflow */}
      {hoveredPoint && (
        <div
          className={tooltip}
          style={{
            left: `${Math.min(Math.max((hoveredPoint.x / width) * 100, 15), 85)}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
            transform: hoveredPoint.y < height / 2 ? 'translate(-50%, 10px)' : 'translate(-50%, calc(-100% - 10px))'
          }}
        >
          <div className="mb-2 text-[0.85rem] font-semibold text-content">
            {hoveredPoint.dia} - {hoveredPoint.value} incidencia{hoveredPoint.value !== 1 ? 's' : ''}
          </div>
          <div className="mb-1.5 text-[0.75rem] text-muted">
            {hoveredPoint.asunto}
          </div>
          {hoveredPoint.topFaltas && hoveredPoint.topFaltas.length > 0 && (
            <div className="mt-1.5 border-t border-line pt-1.5 text-[0.75rem]">
              <div className="mb-1 font-semibold text-content-2">Top 3 faltas:</div>
              {hoveredPoint.topFaltas.map((falta, idx) => (
                <div key={idx} className="mb-0.5 flex justify-between gap-2">
                  <span className="flex-1 text-[0.7rem] text-muted">{falta.falta}</span>
                  <span className="font-semibold text-primary">{falta.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Botones de filtro con nombres abreviados */}
      <div className="mt-4 flex flex-wrap justify-center gap-2.5 border-t border-line pt-4">
        {nuevosAsuntos.map((asunto, index) => {
          // Nombres cortos para los botones
          const nombresCortos = [
            'Horario y Asistencia',
            'Funciones y Desempeño',
            'Uso de Recursos',
            'Imagen Institucional',
            'Convivencia',
            'Seguridad'
          ]

          return (
            <button
              key={asunto}
              className={cn(filterBtnBase, filtrosActivos[asunto] ? filterBtnActive : filterBtnIdle)}
              style={{
                '--filter-color': colores[asunto]
              } as React.CSSProperties}
              onClick={() => toggleFiltro(asunto)}
              title={asunto} // Tooltip con el nombre completo
            >
              <span className={cn(filterDot, filtrosActivos[asunto] && filterDotActive)} style={{ backgroundColor: colores[asunto] }}></span>
              <span className="text-[13px] whitespace-nowrap">{nombresCortos[index]}</span>
            </button>
          )
        })}
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