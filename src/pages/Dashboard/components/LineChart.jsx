import React from 'react'

export default function LineChart({ title, subtitle, data }) {
  const meses = Object.keys(data)
  const maxValue = Math.max(...meses.map(mes => 
    Object.values(data[mes]).reduce((a, b) => a + b, 0)
  ), 1)
  
  // Calcular puntos para cada asunto
  const asuntos = ['Falta disciplinaria', 'Abandono de servicio', 'Inasistencia']
  const colores = {
    'Falta disciplinaria': '#4a6cf7',
    'Abandono de servicio': '#8a4af3',
    'Inasistencia': '#4caf50'
  }
  
  const width = 600
  const height = 300
  const padding = 40
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  
  const getX = (index) => padding + (index / (meses.length - 1)) * chartWidth
  const getY = (value) => padding + chartHeight - (value / maxValue) * chartHeight
  
  // Crear path suave para cada línea
  const createSmoothPath = (values) => {
    if (values.length === 0) return ''
    
    let path = `M ${getX(0)} ${getY(values[0])}`
    
    for (let i = 0; i < values.length - 1; i++) {
      const x1 = getX(i)
      const y1 = getY(values[i])
      const x2 = getX(i + 1)
      const y2 = getY(values[i + 1])
      
      const cx = (x1 + x2) / 2
      
      path += ` Q ${cx} ${y1}, ${x2} ${y2}`
    }
    
    return path
  }
  
  // Crear área bajo la curva
  const createArea = (values) => {
    if (values.length === 0) return ''
    
    let path = createSmoothPath(values)
    path += ` L ${getX(values.length - 1)} ${height - padding}`
    path += ` L ${getX(0)} ${height - padding}`
    path += ' Z'
    
    return path
  }
  
  return (
    <div className="line-chart-card">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">{title}</h3>
          <p className="chart-subtitle">{subtitle}</p>
        </div>
        <select className="chart-select">
          <option>2025</option>
          <option>2024</option>
        </select>
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
              stroke="rgba(0,0,0,0.05)"
              strokeWidth="1"
            />
          )
        })}
        
        {/* Áreas y líneas para cada asunto */}
        {asuntos.map(asunto => {
          const values = meses.map(mes => data[mes][asunto])
          const color = colores[asunto]
          
          return (
            <g key={asunto}>
              {/* Área con gradiente */}
              <defs>
                <linearGradient id={`gradient-${asunto}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                </linearGradient>
              </defs>
              
              <path
                d={createArea(values)}
                fill={`url(#gradient-${asunto})`}
              />
              
              {/* Línea */}
              <path
                d={createSmoothPath(values)}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Puntos */}
              {values.map((value, i) => (
                <circle
                  key={i}
                  cx={getX(i)}
                  cy={getY(value)}
                  r="4"
                  fill={color}
                  className="chart-point"
                />
              ))}
            </g>
          )
        })}
        
        {/* Etiquetas del eje X */}
        {meses.map((mes, i) => (
          <text
            key={mes}
            x={getX(i)}
            y={height - 10}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="12"
          >
            {mes}
          </text>
        ))}
      </svg>
      
      {/* Leyenda */}
      <div className="chart-legend">
        {asuntos.map(asunto => (
          <div key={asunto} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: colores[asunto] }}></span>
            <span className="legend-label">{asunto}</span>
          </div>
        ))}
      </div>
    </div>
  )
}