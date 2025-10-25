import React, { useState } from 'react'
import { FaTimes, FaCalendarAlt } from 'react-icons/fa'

export default function DateRangeModal({ onClose, onApply }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const handleApply = () => {
    if (startDate && endDate) {
      onApply(new Date(startDate), new Date(endDate))
    } else {
      alert('Por favor selecciona ambas fechas')
    }
  }
  
  const handleClear = () => {
    onApply(null, null)
  }
  
  return (
    <div className="modal-backdrop">
      <div className="date-modal-card">
        <div className="date-modal-header">
          <div>
            <h3 className="date-modal-title">
              <FaCalendarAlt /> Filtrar por Rango de Fechas
            </h3>
            <p className="date-modal-subtitle">Selecciona el periodo a analizar</p>
          </div>
          <button className="date-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="date-modal-body">
          <div className="date-input-group">
            <label>Fecha Inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="date-input"
            />
          </div>
          
          <div className="date-input-group">
            <label>Fecha Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="date-input"
            />
          </div>
          
          <div className="date-presets">
            <p className="date-presets-label">Accesos rápidos:</p>
            <div className="date-preset-buttons">
              <button 
                onClick={() => {
                  const end = new Date()
                  const start = new Date()
                  start.setDate(start.getDate() - 7)
                  setStartDate(start.toISOString().split('T')[0])
                  setEndDate(end.toISOString().split('T')[0])
                }}
                className="preset-btn"
              >
                Últimos 7 días
              </button>
              
              <button 
                onClick={() => {
                  const end = new Date()
                  const start = new Date()
                  start.setDate(start.getDate() - 30)
                  setStartDate(start.toISOString().split('T')[0])
                  setEndDate(end.toISOString().split('T')[0])
                }}
                className="preset-btn"
              >
                Últimos 30 días
              </button>
              
              <button 
                onClick={() => {
                  const now = new Date()
                  const start = new Date(now.getFullYear(), now.getMonth(), 1)
                  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                  setStartDate(start.toISOString().split('T')[0])
                  setEndDate(end.toISOString().split('T')[0])
                }}
                className="preset-btn"
              >
                Este mes
              </button>
            </div>
          </div>
        </div>
        
        <div className="date-modal-actions">
          <button onClick={handleClear} className="btn-secondary">
            Limpiar Filtro
          </button>
          <button onClick={handleApply} className="btn-primary">
            Aplicar Filtro
          </button>
        </div>
      </div>
    </div>
  )
}