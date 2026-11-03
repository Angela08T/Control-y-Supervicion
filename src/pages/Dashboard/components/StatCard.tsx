import React from 'react'

export default function StatCard({ title, value, subtitle, change, icon, color, onIconClick }) {
  const isPositive = change?.startsWith('+')
  
  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-info">
          <p className="stat-title">{title}</p>
          <h3 className="stat-value">
            {value}
            {change && (
              <span className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
                {change}
              </span>
            )}
          </h3>
          {subtitle && <p className="stat-subtitle">{subtitle}</p>}
        </div>
        
        <div 
          className="stat-icon-container" 
          style={{ background: color }}
          onClick={onIconClick}
          role={onIconClick ? "button" : undefined}
          tabIndex={onIconClick ? 0 : undefined}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}