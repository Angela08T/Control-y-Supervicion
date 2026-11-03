import React, { useState, useEffect } from 'react'
import { FaCalendarAlt } from 'react-icons/fa'
import CalendarModal from './CalendarModal'
import { cn } from '../../../utils/classes'

// Estilos de controles compartidos por los gráficos (iguales en LineChart y RadarChart).
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

/** Incidencias por día: { [fecha]: { [asunto]: cantidad } } */
export type IncidenciasPorDia = Record<string, Record<string, number>>

/** Faltas por asunto: { [asunto]: { [falta]: cantidad } } */
export type FaltasPorAsunto = Record<string, Record<string, number>>

export interface TopFalta {
  falta: string
  cantidad: number
}

interface HoveredBar {
  asunto: string
  dia: string
  valor: number
  topFaltas: TopFalta[]
  x: number
  y: number
}

export interface BarChartProps {
  title: string
  subtitle: string
  data: IncidenciasPorDia
  incidencias?: unknown
  faltasPorAsunto?: FaltasPorAsunto
  defaultPeriod?: string
  onPeriodChange?: (period: string) => void
}

export default function BarChart({ title, subtitle, data, incidencias, faltasPorAsunto, defaultPeriod = '30D', onPeriodChange }: BarChartProps) {
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
  const [hoveredBar, setHoveredBar] = useState<HoveredBar | null>(null)

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

  // Usar los datos que vienen del API (data) directamente, ya que DashboardPage los filtra según el período
  const datosActuales = data
  const dias = Object.keys(datosActuales)

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
  const getTopFaltas = (asunto: string): TopFalta[] => {
    if (!faltasPorAsunto || !faltasPorAsunto[asunto]) return []

    const faltasArray = Object.entries(faltasPorAsunto[asunto])
      .map(([falta, cantidad]) => ({ falta, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3)

    return faltasArray
  }

  const handleCalendarApply = (start: Date, end: Date) => {
    setCustomDateRange({ start, end })
    setRangoTiempo('custom')
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

  // Calcular máximo valor para escalar las barras con margen superior
  const maxValor = Math.max(
    ...dias.map(dia =>
      Math.max(...nuevosAsuntos.map(asunto => datosActuales[dia][asunto] || 0))
    ),
    1
  ) * 1.1 // Agregar 10% de margen superior para que las barras no toquen el tope

  // Configuración del SVG
  const width = 600  // Ancho base para viewBox (se escalará automáticamente)
  const height = 360  // Misma altura que LineChart para alineación
  const paddingLeft = 20  // Espacio base izquierdo
  const paddingRight = 20  // Reducido para más espacio a la derecha del contenido
  const paddingTop = 50  // Mismo paddingTop que LineChart para alineación
  const paddingBottom = 50  // Reducido para acercar las fechas al borde inferior
  const yAxisLabelWidth = 35  // Reducido de 55 a 35 para menos espacio vacío izquierdo
  const chartWidth = width - paddingLeft - paddingRight - yAxisLabelWidth
  const chartHeight = height - paddingTop - paddingBottom

  // Ancho de cada grupo de barras
  const barGroupWidth = chartWidth / dias.length
  // Asegurar que las barras tengan al menos 3px de ancho y sean más gruesas
  const calculatedBarWidth = (barGroupWidth / nuevosAsuntos.length) - 1
  const barWidth = Math.max(Math.min(calculatedBarWidth, 20), 3) // Mínimo 3px, máximo 20px (más gruesas)

  // Función para obtener posición Y
  const getY = (value: number) => {
    // Las barras deben comenzar desde la misma línea base (paddingTop + chartHeight)
    // y crecer hacia arriba proporcionalmente
    return paddingTop + chartHeight - (value / maxValor) * chartHeight
  }

  // Calcular valores del eje Y (5 niveles)
  const yAxisValues = [0, 1, 2, 3, 4].map(i => Math.round((maxValor / 4) * i))

  return (
    <div className="relative box-border flex w-full min-w-0 max-w-full flex-col overflow-visible rounded-2xl border border-line bg-transparent! p-5 shadow-[0_4px_20px_var(--shadow)] [backdrop-filter:blur(10px)]">
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
          <clipPath id="bar-chart-clip">
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
            <g key={i}>
              <line
                x1={paddingLeft + yAxisLabelWidth}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="var(--grid-line-color)"
                strokeWidth="1"
                strokeDasharray="4 4"
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

        {/* Líneas verticales del eje X - solo donde hay etiquetas */}
        {dias.map((dia, diaIndex) => {
          const groupX = paddingLeft + yAxisLabelWidth + diaIndex * barGroupWidth

          // Calcular si debe mostrar línea vertical (misma lógica que las etiquetas)
          const totalDias = dias.length
          let skipFactor = 1

          if (totalDias > 30) skipFactor = Math.ceil(totalDias / 10)
          else if (totalDias > 20) skipFactor = Math.ceil(totalDias / 8)
          else if (totalDias > 10) skipFactor = 2
          else skipFactor = 1

          const shouldShow = diaIndex % skipFactor === 0 || diaIndex === dias.length - 1

          if (!shouldShow) return null

          return (
            <line
              key={`gridline-${dia}`}
              x1={groupX + barGroupWidth / 2}
              y1={paddingTop}
              x2={groupX + barGroupWidth / 2}
              y2={paddingTop + chartHeight}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.5"
            />
          )
        })}

        {/* Barras */}
        <g clipPath="url(#bar-chart-clip)">
        {dias.map((dia, diaIndex) => {
          const groupX = paddingLeft + yAxisLabelWidth + diaIndex * barGroupWidth

          return (
            <g key={dia}>
              {nuevosAsuntos.map((asunto, asuntoIndex) => {
                const valor = datosActuales[dia][asunto] || 0
                const barHeight = (valor / maxValor) * chartHeight
                const barX = groupX + asuntoIndex * (barWidth + 2)
                const barY = getY(valor)
                const topFaltas = getTopFaltas(asunto)

                return (
                  <g
                    key={asunto}
                    onMouseEnter={() => valor > 0 && setHoveredBar({ asunto, dia, valor, topFaltas, x: barX + barWidth / 2, y: barY })}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{ cursor: valor > 0 ? 'pointer' : 'default' }}
                  >
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      fill={colores[asunto]}
                      rx="3"
                      className="cursor-pointer [transition:all_0.3s_ease]! hover:[filter:brightness(1.1)]"
                      style={{
                        opacity: hoveredBar && hoveredBar.asunto === asunto && hoveredBar.dia === dia ? 0.8 : 1
                      }}
                    />
                    {/* Mostrar valor encima de la barra si es suficientemente alta */}
                    {valor > 0 && barHeight > 20 && (
                      <text
                        x={barX + barWidth / 2}
                        y={barY - 5}
                        textAnchor="middle"
                        fill="var(--text-primary)"
                        fontSize="10"
                        fontWeight="600"
                      >
                        {valor}
                      </text>
                    )}
                  </g>
                )
              })}

            </g>
          )
        })}
        </g>

        {/* Etiquetas del eje X - Mostrar fechas debajo del borde inferior */}
        {dias.map((dia, diaIndex) => {
          const groupX = paddingLeft + yAxisLabelWidth + diaIndex * barGroupWidth

          // Calcular cuántas etiquetas mostrar según la cantidad total de días
          const totalDias = dias.length
          let skipFactor = 1

          if (totalDias > 30) skipFactor = Math.ceil(totalDias / 10) // Mostrar ~10 etiquetas
          else if (totalDias > 20) skipFactor = Math.ceil(totalDias / 8) // Mostrar ~8 etiquetas
          else if (totalDias > 10) skipFactor = 2 // Cada 2 días
          else skipFactor = 1 // Mostrar todos

          const shouldShow = diaIndex % skipFactor === 0 || diaIndex === dias.length - 1

          if (!shouldShow) return null

          return (
            <text
              key={`label-${dia}`}
              x={groupX + barGroupWidth / 2}
              y={paddingTop + chartHeight + 20}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="10"
              fontWeight="600"
            >
              {dia}
            </text>
          )
        })}
      </svg>

      {/* Tooltip flotante con prevención de overflow */}
      {hoveredBar && (
        <div
          className={tooltip}
          style={{
            left: `${Math.min(Math.max((hoveredBar.x / width) * 100, 15), 85)}%`,
            top: `${(hoveredBar.y / height) * 100}%`,
            transform: hoveredBar.y < height / 2 ? 'translate(-50%, 10px)' : 'translate(-50%, calc(-100% - 10px))'
          }}
        >
          <div className="mb-2 text-[0.85rem] font-semibold text-content">
            {hoveredBar.dia} - {hoveredBar.valor} incidencia{hoveredBar.valor !== 1 ? 's' : ''}
          </div>
          <div className="mb-1.5 text-[0.75rem] text-muted">
            {hoveredBar.asunto}
          </div>
          {hoveredBar.topFaltas && hoveredBar.topFaltas.length > 0 && (
            <div className="mt-1.5 border-t border-line pt-1.5 text-[0.75rem]">
              <div className="mb-1 font-semibold text-content-2">Top 3 faltas:</div>
              {hoveredBar.topFaltas.map((falta, idx) => (
                <div key={idx} className="mb-0.5 flex justify-between gap-2">
                  <span className="flex-1 text-[0.7rem] text-muted">{falta.falta}</span>
                  <span className="font-semibold text-primary">{falta.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leyenda con nombres abreviados */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 border-t border-line pt-4">
        {nuevosAsuntos.map((asunto, index) => {
          const nombresCortos = [
            'Horario y Asistencia',
            'Funciones y Desempeño',
            'Uso de Recursos',
            'Imagen Institucional',
            'Convivencia',
            'Seguridad'
          ]

          return (
            <div key={asunto} className="flex items-center gap-1.5 text-[11px] text-content-2" title={asunto}>
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colores[asunto] }}></span>
              <span className="text-[11px] leading-[1.3]">{nombresCortos[index]}</span>
            </div>
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