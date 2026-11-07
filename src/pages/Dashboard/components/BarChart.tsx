import React, { useState, useEffect } from 'react'
import { FiCalendar } from 'react-icons/fi'
import CalendarModal from './CalendarModal'
import { cn } from '@/utils/classes'

// Estilos de controles compartidos por los gráficos (iguales en LineChart y RadarChart).
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
    'Conductas relacionadas con el Cumplimiento del Horario y Asistencia': '#1e3a8a', // Primary
    'Conductas relacionadas con el Cumplimiento de Funciones o Desempeño': '#31a3b5', // Secondary
    'Conductas relacionadas con el Uso de Recursos o Bienes Municipales': '#8ebc22', // Success
    'Conductas relacionadas con la Imagen o Representación Institucional': '#f2a50f', // Warning
    'Conductas relacionadas con la Convivencia y Comportamiento Institucional': '#d20b80', // Gris
    'Conductas que podrían afectar la Seguridad o la Integridad de Personas': '#c71522' // Danger
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
    <div className="relative box-border flex w-full min-w-0 max-w-full flex-col overflow-visible rounded-2xl border border-line bg-surface p-5">
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

        {/* Grid lines horizontales (muy tenues) */}
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
              />
              {/* Etiquetas del eje Y */}
              <text
                x={paddingLeft + yAxisLabelWidth - 10}
                y={y + 4}
                textAnchor="end"
                fill="var(--text-muted)"
                fontSize="11"
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
              stroke="var(--grid-line-color)"
              strokeWidth="1"
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
                      rx="2"
                      className="cursor-pointer transition-opacity duration-150"
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
                        fontSize="11"
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
              fontSize="11"
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
          <div className="mb-1 text-[13px] font-semibold text-content">
            {hoveredBar.dia} - {hoveredBar.valor} incidencia{hoveredBar.valor !== 1 ? 's' : ''}
          </div>
          <div className="mb-1.5 text-xs text-muted">
            {hoveredBar.asunto}
          </div>
          {hoveredBar.topFaltas && hoveredBar.topFaltas.length > 0 && (
            <div className="mt-1.5 border-t border-line pt-1.5 text-xs">
              <div className="mb-1 font-semibold text-content-2">Top 3 faltas:</div>
              {hoveredBar.topFaltas.map((falta, idx) => (
                <div key={idx} className="mb-0.5 flex justify-between gap-2">
                  <span className="flex-1 text-xs text-muted">{falta.falta}</span>
                  <span className="font-semibold text-content">{falta.cantidad}</span>
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
            <div key={asunto} className="flex items-center gap-1.5 text-xs text-content-2" title={asunto}>
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colores[asunto] }} aria-hidden></span>
              <span>{nombresCortos[index]}</span>
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