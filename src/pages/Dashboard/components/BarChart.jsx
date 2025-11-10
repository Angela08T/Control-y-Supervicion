import React, { useState } from 'react'
import { FaCalendarAlt } from 'react-icons/fa'
import CalendarModal from './CalendarModal'

export default function BarChart({ title, subtitle, data, incidencias, faltasPorAsunto }) {
  // Nuevos 6 asuntos
  const nuevosAsuntos = [
    'Conductas relacionadas con el cumplimiento del horario y asistencia',
    'Conductas relacionadas con el cumplimiento de funciones o desempeño',
    'Conductas relacionadas con el uso de recursos o bienes municipales',
    'Conductas relacionadas con la imagen o representación institucional',
    'Conductas relacionadas con la convivencia y comportamiento institucional',
    'Conductas que podrían afectar la seguridad o la integridad de las personas'
  ]

  const [rangoTiempo, setRangoTiempo] = useState('30D')
  const [showCalendar, setShowCalendar] = useState(false)
  const [customDateRange, setCustomDateRange] = useState(null)
  const [hoveredBar, setHoveredBar] = useState(null)

  // Función para obtener datos filtrados por tiempo
  const getDatosFiltrados = () => {
    if (!incidencias || incidencias.length === 0) {
      return data // Fallback a datos originales
    }

    let fechaInicio, fechaFin

    // Si hay rango personalizado, usarlo
    if (rangoTiempo === 'custom' && customDateRange) {
      fechaInicio = customDateRange.start
      fechaFin = customDateRange.end
    } else {
      // Usar rangos predefinidos
      const ahora = new Date()
      let diasAtras = 30

      if (rangoTiempo === '7D') diasAtras = 7
      else if (rangoTiempo === '15D') diasAtras = 15
      else if (rangoTiempo === '30D') diasAtras = 30

      fechaInicio = new Date(ahora)
      fechaInicio.setDate(ahora.getDate() - diasAtras)
      fechaFin = ahora
    }

    // Filtrar incidencias por fecha
    const incidenciasFiltradas = incidencias.filter(inc => {
      if (!inc.fechaIncidente) return false
      const fechaInc = new Date(inc.fechaIncidente)
      return fechaInc >= fechaInicio && fechaInc <= fechaFin
    })

    // Calcular días entre inicio y fin
    const diasDiferencia = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24))

    // Crear estructura de datos por día
    const datosPorDia = {}
    for (let i = 0; i <= diasDiferencia; i++) {
      const fecha = new Date(fechaInicio)
      fecha.setDate(fechaInicio.getDate() + i)
      const dia = `${fecha.getDate()}/${fecha.getMonth() + 1}`
      datosPorDia[dia] = {}
      nuevosAsuntos.forEach(asunto => {
        datosPorDia[dia][asunto] = 0
      })
    }

    // Contar incidencias por día
    incidenciasFiltradas.forEach(inc => {
      const fecha = new Date(inc.fechaIncidente)
      const dia = `${fecha.getDate()}/${fecha.getMonth() + 1}`
      if (datosPorDia[dia]) {
        if (datosPorDia[dia][inc.asunto] !== undefined) {
          datosPorDia[dia][inc.asunto]++
        } else {
          datosPorDia[dia][inc.asunto] = 1
        }
      }
    })

    return datosPorDia
  }

  const datosActuales = getDatosFiltrados()
  const dias = Object.keys(datosActuales)

  // Colores para los 6 nuevos asuntos
  const colores = {
    'Conductas relacionadas con el cumplimiento del horario y asistencia': '#0ea5e9', // Azul cielo
    'Conductas relacionadas con el cumplimiento de funciones o desempeño': '#8b5cf6', // Morado
    'Conductas relacionadas con el uso de recursos o bienes municipales': '#10b981', // Verde
    'Conductas relacionadas con la imagen o representación institucional': '#f59e0b', // Naranja
    'Conductas relacionadas con la convivencia y comportamiento institucional': '#ec4899', // Rosa
    'Conductas que podrían afectar la seguridad o la integridad de las personas': '#ef4444' // Rojo
  }

  // Obtener las 3 principales faltas por asunto
  const getTopFaltas = (asunto) => {
    if (!faltasPorAsunto || !faltasPorAsunto[asunto]) return []

    const faltasArray = Object.entries(faltasPorAsunto[asunto])
      .map(([falta, cantidad]) => ({ falta, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3)

    return faltasArray
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

  // Calcular máximo valor para escalar las barras
  const maxValor = Math.max(
    ...dias.map(dia =>
      Math.max(...nuevosAsuntos.map(asunto => datosActuales[dia][asunto] || 0))
    ),
    1
  )

  // Configuración del SVG
  const width = 800
  const height = 400
  const paddingLeft = 40
  const paddingRight = 20
  const paddingTop = 40
  const paddingBottom = 40
  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  // Ancho de cada grupo de barras
  const barGroupWidth = chartWidth / dias.length
  const barWidth = Math.min(barGroupWidth / nuevosAsuntos.length - 2, 15)

  // Función para obtener posición Y
  const getY = (value) => paddingTop + chartHeight - (value / maxValor) * chartHeight

  // Calcular valores del eje Y (5 niveles)
  const yAxisValues = [0, 1, 2, 3, 4].map(i => Math.round((maxValor / 4) * i))

  return (
    <div className="bar-chart-card">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">{title}</h3>
          <p className="chart-subtitle">{subtitle}</p>
        </div>

        <div className="time-range-controls">
          <div className="time-range-buttons">
            <button
              className={`time-btn ${rangoTiempo === '7D' ? 'active' : ''}`}
              onClick={() => setRangoTiempo('7D')}
            >
              7D
            </button>
            <button
              className={`time-btn ${rangoTiempo === '15D' ? 'active' : ''}`}
              onClick={() => setRangoTiempo('15D')}
            >
              15D
            </button>
            <button
              className={`time-btn ${rangoTiempo === '30D' ? 'active' : ''}`}
              onClick={() => setRangoTiempo('30D')}
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

      <svg className="bar-chart-svg" viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines horizontales */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = paddingTop + (i / 4) * chartHeight
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="var(--grid-line-color)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              {/* Etiquetas del eje Y */}
              <text
                x={paddingLeft - 10}
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

        {/* Barras */}
        {dias.map((dia, diaIndex) => {
          const groupX = paddingLeft + diaIndex * barGroupWidth

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
                      className="bar-rect"
                      style={{
                        transition: 'all 0.3s ease',
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

              {/* Etiqueta del eje X */}
              {(() => {
                const shouldShowLabel = rangoTiempo === '7D' ||
                                       (rangoTiempo === '15D' && diaIndex % 2 === 0) ||
                                       (rangoTiempo === '30D' && diaIndex % 3 === 0)

                if (shouldShowLabel) {
                  return (
                    <text
                      x={groupX + barGroupWidth / 2}
                      y={height - paddingBottom + 20}
                      textAnchor="middle"
                      fill="var(--text-muted)"
                      fontSize="10"
                      fontWeight="600"
                    >
                      {dia}
                    </text>
                  )
                }
                return null
              })()}
            </g>
          )
        })}
      </svg>

      {/* Tooltip flotante */}
      {hoveredBar && (
        <div
          className="chart-tooltip"
          style={{
            position: 'absolute',
            left: `${(hoveredBar.x / width) * 100}%`,
            top: `${(hoveredBar.y / height) * 100}%`,
            transform: 'translate(-50%, -120%)',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 12px var(--shadow)',
            zIndex: 1000,
            pointerEvents: 'none',
            minWidth: '200px'
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
            {hoveredBar.dia} - {hoveredBar.valor} incidencia{hoveredBar.valor !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {hoveredBar.asunto}
          </div>
          {hoveredBar.topFaltas && hoveredBar.topFaltas.length > 0 && (
            <div style={{ fontSize: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '6px', marginTop: '6px' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Top 3 faltas:</div>
              {hoveredBar.topFaltas.map((falta, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{falta.falta}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{falta.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leyenda con nombres abreviados */}
      <div className="bar-legend">
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
            <div key={asunto} className="legend-item" title={asunto}>
              <span className="legend-dot" style={{ backgroundColor: colores[asunto] }}></span>
              <span className="legend-label">{nombresCortos[index]}</span>
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