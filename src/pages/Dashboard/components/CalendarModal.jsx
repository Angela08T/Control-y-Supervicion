import React, { useState } from 'react'
import { FaTimes } from 'react-icons/fa'

export default function CalendarModal({ onClose, onApply }) {
  const [selectedDates, setSelectedDates] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const diasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

  // Obtener días del mes
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Agregar espacios vacíos para los días anteriores
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Agregar todos los días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const days = getDaysInMonth(currentMonth)

  const isDateSelected = (date) => {
    if (!date) return false
    return selectedDates.some(d =>
      d.getDate() === date.getDate() &&
      d.getMonth() === date.getMonth() &&
      d.getFullYear() === date.getFullYear()
    )
  }

  const isDateInRange = (date) => {
    if (!date || selectedDates.length !== 2) return false
    const [start, end] = selectedDates.sort((a, b) => a - b)
    return date >= start && date <= end
  }

  const handleDateClick = (date) => {
    if (!date) return

    if (selectedDates.length === 0) {
      setSelectedDates([date])
    } else if (selectedDates.length === 1) {
      setSelectedDates([...selectedDates, date].sort((a, b) => a - b))
    } else {
      setSelectedDates([date])
    }
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const handleApply = () => {
    if (selectedDates.length === 2) {
      const [start, end] = selectedDates.sort((a, b) => a - b)
      onApply(start, end)
      onClose()
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={previousMonth}>
            ‹
          </button>
          <h3 className="calendar-month-title">
            {meses[currentMonth.getMonth()]} De {currentMonth.getFullYear()}
          </h3>
          <button className="calendar-nav-btn" onClick={nextMonth}>
            ›
          </button>
        </div>

        <div className="calendar-weekdays">
          {diasSemana.map((dia, i) => (
            <div key={i} className="calendar-weekday">{dia}</div>
          ))}
        </div>

        <div className="calendar-days">
          {days.map((date, i) => (
            <div
              key={i}
              className={`calendar-day ${
                !date ? 'empty' : ''
              } ${
                isDateSelected(date) ? 'selected' : ''
              } ${
                isDateInRange(date) ? 'in-range' : ''
              }`}
              onClick={() => handleDateClick(date)}
            >
              {date ? date.getDate() : ''}
            </div>
          ))}
        </div>

        <div className="calendar-footer">
          <button className="calendar-cancel-btn" onClick={handleCancel}>
            Cancelar
          </button>
          <button
            className="calendar-apply-btn"
            onClick={handleApply}
            disabled={selectedDates.length !== 2}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
