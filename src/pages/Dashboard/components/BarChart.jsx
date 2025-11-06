import React, { useState } from 'react'
import { FaCalendarAlt } from 'react-icons/fa'
import CalendarModal from './CalendarModal'

export default function BarChart({ title, subtitle, data, incidencias }) {
  const [rangoTiempo, setRangoTiempo] = useState('30D')
  const [showCalendar, setShowCalendar] = useState(false)
  const [customDateRange, setCustomDateRange] = useState(null)

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
      datosPorDia[dia] = {
        'Falta disciplinaria': 0,
        'Abandono de servicio': 0,
        'Inasistencia': 0
      }
    }

    // Contar incidencias por día
    incidenciasFiltradas.forEach(inc => {
      const fecha = new Date(inc.fechaIncidente)
      const dia = `${fecha.getDate()}/${fecha.getMonth() + 1}`
      if (datosPorDia[dia] && datosPorDia[dia][inc.asunto] !== undefined) {
        datosPorDia[dia][inc.asunto]++
      }
    })

    return datosPorDia
  }

  const datosActuales = getDatosFiltrados()
  const dias = Object.keys(datosActuales)

  const asuntos = ['Falta disciplinaria', 'Abandono de servicio', 'Inasistencia']
  const colores = {
    'Falta disciplinaria': '#0ea5e9',
    'Abandono de servicio': '#8b5cf6',
    'Inasistencia': '#10b981'
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
      Math.max(...asuntos.map(asunto => datosActuales[dia][asunto]))
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
  const barWidth = Math.min(barGroupWidth / asuntos.length - 4, 20)

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
              {asuntos.map((asunto, asuntoIndex) => {
                const valor = datosActuales[dia][asunto]
                const barHeight = (valor / maxValor) * chartHeight
                const barX = groupX + asuntoIndex * (barWidth + 2)
                const barY = getY(valor)

                return (
                  <g key={asunto}>
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      fill={colores[asunto]}
                      rx="3"
                      className="bar-rect"
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

      {/* Leyenda */}
      <div className="bar-legend">
        {asuntos.map(asunto => (
          <div key={asunto} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: colores[asunto] }}></span>
            <span className="legend-label">{asunto}</span>
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