import React, { useState, useEffect } from 'react'
import { FaCalendarAlt } from 'react-icons/fa'
import CalendarModal from './CalendarModal'

export default function LineChart({ title, subtitle, data, incidencias, faltasPorAsunto, onOpenDateModal, defaultPeriod = '30D', onPeriodChange }) {
  // Nuevos 6 asuntos (deben coincidir exactamente con los nombres de la API)
  const nuevosAsuntos = [
    'Conductas relacionadas con el Cumplimiento del Horario y Asistencia',
    'Conductas relacionadas con el Cumplimiento de Funciones o Desempeño',
    'Conductas relacionadas con el Uso de Recursos o Bienes Municipales',
    'Conductas relacionadas con la Imagen o Representación Institucional',
    'Conductas relacionadas con la Convivencia y Comportamiento Institucional',
    'Conductas que podrían afectar la Seguridad o la Integridad de Personas'
  ]

  const [filtrosActivos, setFiltrosActivos] = useState(
    nuevosAsuntos.reduce((acc, asunto) => ({ ...acc, [asunto]: true }), {})
  )
  const [rangoTiempo, setRangoTiempo] = useState(defaultPeriod) // 7D, 15D, 30D, custom
  const [showCalendar, setShowCalendar] = useState(false)
  const [customDateRange, setCustomDateRange] = useState(null)
  const [animationKey, setAnimationKey] = useState(0)
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // Sincronizar con el período padre
  useEffect(() => {
    setRangoTiempo(defaultPeriod)
  }, [defaultPeriod])

  // Re-ejecutar animación cuando cambian los datos
  useEffect(() => {
    setAnimationKey(prev => prev + 1)
    console.log('🔄 LineChart - Rango de tiempo cambió a:', rangoTiempo)
  }, [rangoTiempo, customDateRange, data])

  // Notificar al padre cuando cambia el período (solo para botones, no para custom)
  const handlePeriodChange = (newPeriod) => {
    setRangoTiempo(newPeriod)
    if (onPeriodChange && newPeriod !== 'custom') {
      onPeriodChange(newPeriod)
    }
  }

  // Usar los datos que vienen del API (data) directamente, ya que DashboardPage los filtra según el período
  const datosActuales = data

  const meses = Object.keys(datosActuales)

  // Debug: verificar si hay datos con valores
  const totalValues = meses.reduce((sum, mes) => {
    const mesTotal = nuevosAsuntos.reduce((s, asunto) => s + (datosActuales[mes][asunto] || 0), 0)
    return sum + mesTotal
  }, 0)
  console.log('🔍 LineChart - Total de incidencias en datos:', totalValues)
  console.log('🔍 LineChart - Cantidad de días:', meses.length)

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
  const colores = {
    'Conductas relacionadas con el Cumplimiento del Horario y Asistencia': '#0ea5e9', // Azul cielo
    'Conductas relacionadas con el Cumplimiento de Funciones o Desempeño': '#8b5cf6', // Morado
    'Conductas relacionadas con el Uso de Recursos o Bienes Municipales': '#10b981', // Verde
    'Conductas relacionadas con la Imagen o Representación Institucional': '#f59e0b', // Naranja
    'Conductas relacionadas con la Convivencia y Comportamiento Institucional': '#ec4899', // Rosa
    'Conductas que podrían afectar la Seguridad o la Integridad de Personas': '#ef4444' // Rojo
  }

  // Obtener las 3 principales faltas por asunto
  const getTopFaltas = (asunto, dia) => {
    if (!faltasPorAsunto || !faltasPorAsunto[asunto]) return []

    // Convertir el objeto de faltas a array y ordenar por cantidad
    const faltasArray = Object.entries(faltasPorAsunto[asunto])
      .map(([falta, cantidad]) => ({ falta, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3) // Top 3

    return faltasArray
  }

  const toggleFiltro = (asunto) => {
    setFiltrosActivos(prev => ({
      ...prev,
      [asunto]: !prev[asunto]
    }))
  }

  const handleCalendarApply = (start, end) => {
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

  const getX = (index) => {
    // Los puntos empiezan después de paddingLeft + yAxisLabelWidth + margen interno
    const effectiveWidth = chartWidth - (marginInside * 2)
    return paddingLeft + yAxisLabelWidth + marginInside + (index / (meses.length - 1)) * effectiveWidth
  }
  const getY = (value) => {
    // Calcular posición Y desde la base hacia arriba con margen interno
    const effectiveHeight = chartHeight - (marginInside * 2)
    return paddingTop + marginInside + effectiveHeight - (value / maxValue) * effectiveHeight
  }

  // Calcular valores del eje Y (5 niveles)
  const yAxisValues = [0, 1, 2, 3, 4].map(i => Math.round((maxValue / 4) * i))

  // Crear path con curvas suaves tipo Bezier cúbica para mejor apariencia
  const createPath = (values) => {
    if (values.length === 0) return ''

    // Comenzar desde el borde izquierdo del área del gráfico (antes del primer punto)
    const startX = paddingLeft + yAxisLabelWidth
    const firstY = getY(values[0])

    if (values.length === 1) return `M ${startX} ${firstY} L ${getX(0)} ${getY(values[0])}`

    // Iniciar el path desde el borde izquierdo
    let path = `M ${startX} ${firstY}`

    // Línea hasta el primer punto
    path += ` L ${getX(0)} ${getY(values[0])}`

    // Asegurar que todas las líneas estén completas conectando todos los puntos
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
  const getPathLength = (values) => {
    if (values.length < 2) return 0
    let length = 0
    for (let i = 0; i < values.length - 1; i++) {
      const x1 = getX(i)
      const y1 = getY(values[i])
      const x2 = getX(i + 1)
      const y2 = getY(values[i + 1])
      length += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    }
    return length
  }
  
  return (
    <div className="line-chart-card">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">{title}</h3>
          <p className="chart-subtitle">{subtitle}</p>
        </div>

        <div className="time-range-controls">
          <div className="time-range-buttons">
            <button
              className={`time-btn ${rangoTiempo === '7D' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('7D')}
            >
              7D
            </button>
            <button
              className={`time-btn ${rangoTiempo === '15D' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('15D')}
            >
              15D
            </button>
            <button
              className={`time-btn ${rangoTiempo === '30D' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('30D')}
            >
              30D
            </button>
          </div>

          <button className="date-range-btn" onClick={() => setShowCalendar(true)}>
            <FaCalendarAlt />
            <span>{formatDateRange()}</span>
          </button>
        </div>
      </div>
      
      <svg className="line-chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
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

        {/* Líneas para cada asunto */}
        <g clipPath="url(#chart-clip)">
        {nuevosAsuntos.map((asunto, asuntoIndex) => {
          if (!filtrosActivos[asunto]) return null

          const values = meses.map(mes => datosActuales[mes][asunto])
          const color = colores[asunto]
          const pathId = `path-${asunto.replace(/\s+/g, '-')}`
          const pathLength = getPathLength(values)
          const animationDuration = 2.5 // segundos para que la línea se dibuje completamente
          const lineDelay = asuntoIndex * 0.2 // delay entre cada línea

          return (
            <g key={`${asunto}-${animationKey}`}>
              {/* Puntos solo donde hay datos (value > 0) - aparecen primero, sin animación */}
              {values.map((value, i) => {
                // Solo mostrar puntos donde hay datos
                if (value === 0) return null

                const topFaltas = getTopFaltas(asunto, meses[i])

                return (
                  <g
                    key={`${asunto}-${i}`}
                    className="chart-point-group"
                  >
                    <circle
                      cx={getX(i)}
                      cy={getY(value)}
                      r="5"
                      fill="white"
                      stroke={color}
                      strokeWidth="2.5"
                      className="chart-point-outer"
                      style={{ cursor: 'pointer', pointerEvents: 'all' }}
                      onMouseEnter={() => setHoveredPoint({ asunto, dia: meses[i], value, topFaltas, x: getX(i), y: getY(value) })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    <circle
                      cx={getX(i)}
                      cy={getY(value)}
                      r="2.5"
                      fill={color}
                      className="chart-point-inner"
                      style={{ pointerEvents: 'none' }}
                    />
                  </g>
                )
              })}

              {/* Línea dibujándose de izquierda a derecha - después de los puntos */}
              <path
                id={pathId}
                d={createPath(values)}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="chart-line chart-line-animated"
                style={{
                  strokeDasharray: pathLength,
                  strokeDashoffset: pathLength,
                  animation: `drawLine ${animationDuration}s ease-in-out forwards`,
                  animationDelay: `${lineDelay}s`
                }}
              />
            </g>
          )
        })}
        </g>

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
              className="chart-label"
            >
              {mes}
            </text>
          )
        })}
      </svg>

      {/* Tooltip flotante con prevención de overflow */}
      {hoveredPoint && (
        <div
          className="chart-tooltip"
          style={{
            position: 'absolute',
            left: `${Math.min(Math.max((hoveredPoint.x / width) * 100, 15), 85)}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
            transform: hoveredPoint.y < height / 2 ? 'translate(-50%, 10px)' : 'translate(-50%, calc(-100% - 10px))',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 12px var(--shadow)',
            zIndex: 1000,
            pointerEvents: 'none',
            minWidth: '200px',
            maxWidth: '280px'
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
            {hoveredPoint.dia} - {hoveredPoint.value} incidencia{hoveredPoint.value !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {hoveredPoint.asunto}
          </div>
          {hoveredPoint.topFaltas && hoveredPoint.topFaltas.length > 0 && (
            <div style={{ fontSize: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '6px', marginTop: '6px' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Top 3 faltas:</div>
              {hoveredPoint.topFaltas.map((falta, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', flex: 1, fontSize: '0.7rem' }}>{falta.falta}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{falta.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Botones de filtro con nombres abreviados */}
      <div className="chart-filters">
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
              className={`filter-button ${filtrosActivos[asunto] ? 'active' : ''}`}
              style={{
                '--filter-color': colores[asunto]
              }}
              onClick={() => toggleFiltro(asunto)}
              title={asunto} // Tooltip con el nombre completo
            >
              <span className="filter-dot" style={{ backgroundColor: colores[asunto] }}></span>
              <span className="filter-label">{nombresCortos[index]}</span>
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