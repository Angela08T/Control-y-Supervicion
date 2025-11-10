import React, { useState, useEffect } from 'react'
import { FaCalendarAlt } from 'react-icons/fa'
import CalendarModal from './CalendarModal'

export default function LineChart({ title, subtitle, data, incidencias, faltasPorAsunto, onOpenDateModal }) {
  // Nuevos 6 asuntos
  const nuevosAsuntos = [
    'Conductas relacionadas con el cumplimiento del horario y asistencia',
    'Conductas relacionadas con el cumplimiento de funciones o desempeño',
    'Conductas relacionadas con el uso de recursos o bienes municipales',
    'Conductas relacionadas con la imagen o representación institucional',
    'Conductas relacionadas con la convivencia y comportamiento institucional',
    'Conductas que podrían afectar la seguridad o la integridad de las personas'
  ]

  const [filtrosActivos, setFiltrosActivos] = useState(
    nuevosAsuntos.reduce((acc, asunto) => ({ ...acc, [asunto]: true }), {})
  )
  const [rangoTiempo, setRangoTiempo] = useState('30D') // 7D, 15D, 30D, custom
  const [showCalendar, setShowCalendar] = useState(false)
  const [customDateRange, setCustomDateRange] = useState(null)
  const [animationKey, setAnimationKey] = useState(0)
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // Re-ejecutar animación cuando cambian los datos
  useEffect(() => {
    setAnimationKey(prev => prev + 1)
  }, [rangoTiempo, customDateRange])

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

    const fechaLimite = fechaInicio

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
  const colores = {
    'Conductas relacionadas con el cumplimiento del horario y asistencia': '#0ea5e9', // Azul cielo
    'Conductas relacionadas con el cumplimiento de funciones o desempeño': '#8b5cf6', // Morado
    'Conductas relacionadas con el uso de recursos o bienes municipales': '#10b981', // Verde
    'Conductas relacionadas con la imagen o representación institucional': '#f59e0b', // Naranja
    'Conductas relacionadas con la convivencia y comportamiento institucional': '#ec4899', // Rosa
    'Conductas que podrían afectar la seguridad o la integridad de las personas': '#ef4444' // Rojo
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
  
  const width = 800
  const height = 400
  const padding = 40
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  
  const getX = (index) => padding + (index / (meses.length - 1)) * chartWidth
  const getY = (value) => padding + chartHeight - (value / maxValue) * chartHeight

  // Crear path con curvas suaves
  const createPath = (values) => {
    if (values.length === 0) return ''
    if (values.length === 1) return `M ${getX(0)} ${getY(values[0])}`

    let path = `M ${getX(0)} ${getY(values[0])}`

    for (let i = 0; i < values.length - 1; i++) {
      const x1 = getX(i)
      const y1 = getY(values[i])
      const x2 = getX(i + 1)
      const y2 = getY(values[i + 1])

      // Calcular punto de control para curva suave
      const controlPointX = (x1 + x2) / 2
      const tension = 0.4 // Factor de tensión de la curva

      path += ` Q ${controlPointX} ${y1}, ${x2} ${y2}`
    }

    return path
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
      
      <svg className="line-chart-svg" viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding + (i / 4) * chartHeight
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="var(--grid-line-color)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          )
        })}

        {/* Líneas para cada asunto */}
        {nuevosAsuntos.map((asunto, asuntoIndex) => {
          if (!filtrosActivos[asunto]) return null

          const values = meses.map(mes => datosActuales[mes][asunto])
          const color = colores[asunto]
          const pathId = `path-${asunto.replace(/\s+/g, '-')}`

          return (
            <g key={`${asunto}-${animationKey}`}>
              {/* Línea con estilo de picos y animación montaña rusa */}
              <path
                id={pathId}
                d={createPath(values)}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="chart-line chart-line-animated"
                style={{
                  strokeDasharray: '1000',
                  strokeDashoffset: '1000',
                  animation: `drawLine 2.5s cubic-bezier(0.45, 0, 0.55, 1) forwards`,
                  animationDelay: `${asuntoIndex * 0.2}s`
                }}
              />

              {/* Puntos en cada vértice con tooltip */}
              {values.map((value, i) => {
                const topFaltas = getTopFaltas(asunto, meses[i])

                return (
                  <g
                    key={`${asunto}-${i}`}
                    className="chart-point-group"
                    style={{
                      animation: `fadeInPoint 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards`,
                      animationDelay: `${asuntoIndex * 0.2 + (i * 0.08)}s`,
                      opacity: 0,
                      cursor: value > 0 ? 'pointer' : 'default'
                    }}
                    onMouseEnter={() => value > 0 && setHoveredPoint({ asunto, dia: meses[i], value, topFaltas, x: getX(i), y: getY(value) })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={getX(i)}
                      cy={getY(value)}
                      r="4"
                      fill="white"
                      stroke={color}
                      strokeWidth="2"
                      className="chart-point-outer"
                    />
                    {value > 0 && (
                      <circle
                        cx={getX(i)}
                        cy={getY(value)}
                        r="2"
                        fill={color}
                        className="chart-point-inner"
                      />
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* Etiquetas del eje X */}
        {meses.map((mes, i) => {
          // Mostrar solo algunas etiquetas para evitar sobrecarga
          const shouldShow = rangoTiempo === '7D' ||
                             (rangoTiempo === '15D' && i % 2 === 0) ||
                             (rangoTiempo === '30D' && i % 3 === 0)

          if (!shouldShow) return null

          return (
            <text
              key={mes}
              x={getX(i)}
              y={height - 8}
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

      {/* Tooltip flotante */}
      {hoveredPoint && (
        <div
          className="chart-tooltip"
          style={{
            position: 'absolute',
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
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
            {hoveredPoint.dia} - {hoveredPoint.value} incidencia{hoveredPoint.value !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {hoveredPoint.asunto}
          </div>
          {hoveredPoint.topFaltas && hoveredPoint.topFaltas.length > 0 && (
            <div style={{ fontSize: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '6px', marginTop: '6px' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Top 3 faltas:</div>
              {hoveredPoint.topFaltas.map((falta, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{falta.falta}</span>
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