import React, { useState, useEffect } from 'react'
import { FaCalendarAlt } from 'react-icons/fa'
import CalendarModal from './CalendarModal'

export default function RadarChart({ title, subtitle, data, incidencias, faltasPorAsunto, defaultPeriod = '30D', onPeriodChange }) {
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
  const [customDateRange, setCustomDateRange] = useState(null)
  const [hoveredSegment, setHoveredSegment] = useState(null)

  // Sincronizar con el período padre
  useEffect(() => {
    setRangoTiempo(defaultPeriod)
  }, [defaultPeriod])

  // Notificar al padre cuando cambia el período
  const handlePeriodChange = (newPeriod) => {
    setRangoTiempo(newPeriod)
    if (onPeriodChange && newPeriod !== 'custom') {
      onPeriodChange(newPeriod)
    }
  }

  // Calcular totales por asunto desde los datos
  const totalesPorAsunto = {}
  const dias = Object.keys(data)

  nuevosAsuntos.forEach(asunto => {
    totalesPorAsunto[asunto] = 0
  })

  dias.forEach(dia => {
    nuevosAsuntos.forEach(asunto => {
      totalesPorAsunto[asunto] += data[dia][asunto] || 0
    })
  })

  console.log('📊 RadarChart - Totales por asunto:', totalesPorAsunto)

  // Colores para los 6 nuevos asuntos
  const colores = {
    'Conductas relacionadas con el Cumplimiento del Horario y Asistencia': '#0ea5e9',
    'Conductas relacionadas con el Cumplimiento de Funciones o Desempeño': '#8b5cf6',
    'Conductas relacionadas con el Uso de Recursos o Bienes Municipales': '#10b981',
    'Conductas relacionadas con la Imagen o Representación Institucional': '#f59e0b',
    'Conductas relacionadas con la Convivencia y Comportamiento Institucional': '#ec4899',
    'Conductas que podrían afectar la Seguridad o la Integridad de Personas': '#ef4444'
  }

  // Nombres cortos para mostrar
  const nombresCortos = {
    'Conductas relacionadas con el Cumplimiento del Horario y Asistencia': 'Horario y Asistencia',
    'Conductas relacionadas con el Cumplimiento de Funciones o Desempeño': 'Funciones y Desempeño',
    'Conductas relacionadas con el Uso de Recursos o Bienes Municipales': 'Uso de Recursos',
    'Conductas relacionadas con la Imagen o Representación Institucional': 'Imagen Institucional',
    'Conductas relacionadas con la Convivencia y Comportamiento Institucional': 'Convivencia',
    'Conductas que podrían afectar la Seguridad o la Integridad de Personas': 'Seguridad'
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
  const getRadarPoint = (asunto, index) => {
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
  const getTopFaltas = (asunto) => {
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
    <div className="radar-chart-card">
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

      {/* Gráfico de Radar */}
      <svg className="radar-chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Gradiente para el polígono */}
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4a9eff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Círculos concéntricos de fondo */}
        {[...Array(numLevels)].map((_, i) => {
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
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill={colores[asunto]}
                stroke="#fff"
                strokeWidth="2"
                className="radar-point"
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
          let textAnchor = 'middle'
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
              className="radar-label"
            >
              {nombresCortos[asunto]}
            </text>
          )
        })}
      </svg>

      {/* Tooltip flotante */}
      {hoveredSegment && (
        <div
          className="chart-tooltip"
          style={{
            position: 'absolute',
            left: `${(hoveredSegment.x / width) * 100}%`,
            top: `${(hoveredSegment.y / height) * 100}%`,
            transform: 'translate(-50%, -120%)',
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
            {hoveredSegment.valor} incidencia{hoveredSegment.valor !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {hoveredSegment.asunto}
          </div>
          {hoveredSegment.topFaltas && hoveredSegment.topFaltas.length > 0 && (
            <div style={{ fontSize: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '6px', marginTop: '6px' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Top 3 faltas:</div>
              {hoveredSegment.topFaltas.map((falta, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', flex: 1, fontSize: '0.7rem' }}>{falta.falta}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{falta.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabla inferior con la lista de asuntos - Top 4 */}
      <div className="radar-table">
        {Object.entries(totalesPorAsunto)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([asunto, valor]) => (
            <div
              key={asunto}
              className="radar-table-row"
              onMouseEnter={() => {
                const index = nuevosAsuntos.indexOf(asunto)
                const point = radarPoints[index]
                setHoveredSegment({ asunto, valor, topFaltas: getTopFaltas(asunto), x: point.x, y: point.y })
              }}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="radar-table-col">
                <span className="radar-table-dot" style={{ backgroundColor: colores[asunto] }}></span>
                <span className="radar-table-label">{nombresCortos[asunto]}</span>
              </div>
              <div className="radar-table-col-count">
                <span className="radar-table-value">{valor}</span>
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
