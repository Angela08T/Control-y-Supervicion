import React, { useState } from 'react'
import { FaCalendarAlt } from 'react-icons/fa'
import CalendarModal from './CalendarModal'

export default function BarChart({ title, subtitle, data, incidencias, faltasPorAsunto }) {
  // Nuevos 6 asuntos (deben coincidir exactamente con los nombres de la API)
  const nuevosAsuntos = [
    'Conductas relacionadas con el Cumplimiento del Horario y Asistencia',
    'Conductas relacionadas con el Cumplimiento de Funciones o Desempeño',
    'Conductas relacionadas con el Uso de Recursos o Bienes Municipales',
    'Conductas relacionadas con la Imagen o Representación Institucional',
    'Conductas relacionadas con la Convivencia y Comportamiento Institucional',
    'Conductas que podrían afectar la Seguridad o la Integridad de Personas'
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

    // Determinar el rango de fechas según el filtro activo
    let fechaInicio, fechaFin

    if (rangoTiempo === 'custom' && customDateRange) {
      // Usar rango personalizado del calendario
      fechaInicio = new Date(customDateRange.start)
      fechaFin = new Date(customDateRange.end)
    } else {
      // Usar filtro de días (7D, 15D, 30D)
      fechaFin = new Date()
      fechaInicio = new Date()

      if (rangoTiempo === '7D') {
        fechaInicio.setDate(fechaFin.getDate() - 7)
      } else if (rangoTiempo === '15D') {
        fechaInicio.setDate(fechaFin.getDate() - 15)
      } else if (rangoTiempo === '30D') {
        fechaInicio.setDate(fechaFin.getDate() - 30)
      }
    }

    // Normalizar fechas (sin horas)
    fechaInicio.setHours(0, 0, 0, 0)
    fechaFin.setHours(23, 59, 59, 999)

    console.log('📅 BarChart - Filtrando por rango:', {
      rangoTiempo,
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString()
    })

    // Filtrar incidencias en el rango
    const incidenciasFiltradas = incidencias.filter(inc => {
      if (!inc.fechaIncidente) return false
      const fechaInc = new Date(inc.fechaIncidente)
      return fechaInc >= fechaInicio && fechaInc <= fechaFin
    })

    console.log('📊 BarChart - Incidencias filtradas:', incidenciasFiltradas.length)

    if (incidenciasFiltradas.length === 0) {
      // Si no hay incidencias en el rango, crear estructura vacía
      const diasDiferencia = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24))
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
      return datosPorDia
    }

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

    // Contar incidencias filtradas por día
    incidenciasFiltradas.forEach(inc => {
      if (!inc.fechaIncidente) return
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

  console.log('🔍 BarChart - Datos actuales:', datosActuales)
  console.log('🔍 BarChart - Días:', dias)
  console.log('🔍 BarChart - Prop data:', data)
  console.log('🔍 BarChart - Prop incidencias:', incidencias)

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
  const getY = (value) => {
    // Las barras deben comenzar desde la misma línea base (paddingTop + chartHeight)
    // y crecer hacia arriba proporcionalmente
    return paddingTop + chartHeight - (value / maxValor) * chartHeight
  }

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

      <svg className="bar-chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
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
          className="chart-tooltip"
          style={{
            position: 'absolute',
            left: `${Math.min(Math.max((hoveredBar.x / width) * 100, 15), 85)}%`,
            top: `${(hoveredBar.y / height) * 100}%`,
            transform: hoveredBar.y < height / 2 ? 'translate(-50%, 10px)' : 'translate(-50%, calc(-100% - 10px))',
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
            {hoveredBar.dia} - {hoveredBar.valor} incidencia{hoveredBar.valor !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {hoveredBar.asunto}
          </div>
          {hoveredBar.topFaltas && hoveredBar.topFaltas.length > 0 && (
            <div style={{ fontSize: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '6px', marginTop: '6px' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Top 3 faltas:</div>
              {hoveredBar.topFaltas.map((falta, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', flex: 1, fontSize: '0.7rem' }}>{falta.falta}</span>
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