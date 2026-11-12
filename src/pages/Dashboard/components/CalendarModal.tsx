import React, { useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import { cn } from '@/utils/classes'

export interface CalendarModalProps {
  onClose: () => void
  onApply: (start: Date, end: Date) => void
}

/** Clases de una celda del calendario: inicio/fin en primary, dias intermedios tintados. */
const dayClassName = (date: Date, selected: boolean, inRange: boolean): string => cn(
  'flex h-9 w-full cursor-pointer items-center justify-center rounded-md text-[13px] select-none transition-colors duration-150',
  selected && 'bg-primary font-semibold text-btn',
  !selected && inRange && 'bg-primary/8 text-content',
  !selected && !inRange && 'text-content hover:bg-subtle'
)

export default function CalendarModal({ onClose, onApply }: CalendarModalProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]

  const diasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

  // Obtener días del mes
  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []

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

  const isDateSelected = (date: Date | null): boolean => {
    if (!date) return false
    return selectedDates.some(d =>
      d.getDate() === date.getDate() &&
      d.getMonth() === date.getMonth() &&
      d.getFullYear() === date.getFullYear()
    )
  }

  const isDateInRange = (date: Date | null): boolean => {
    if (!date || selectedDates.length !== 2) return false
    const [start, end] = selectedDates.sort((a, b) => a.getTime() - b.getTime())
    return date >= start && date <= end
  }

  const handleDateClick = (date: Date | null): void => {
    if (!date) return

    if (selectedDates.length === 0) {
      setSelectedDates([date])
    } else if (selectedDates.length === 1) {
      setSelectedDates([...selectedDates, date].sort((a, b) => a.getTime() - b.getTime()))
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
      const [start, end] = selectedDates.sort((a, b) => a.getTime() - b.getTime())
      onApply(start, end)
      onClose()
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <Modal
      title="Seleccionar rango de fechas"
      description="Elige el día de inicio y el día de fin."
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={selectedDates.length !== 2}>
            Aplicar
          </Button>
        </>
      }
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={previousMonth}
          aria-label="Mes anterior"
          title="Mes anterior"
          className="flex size-8 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-base text-muted transition-colors duration-150 hover:bg-subtle hover:text-content"
        >
          <FiChevronLeft aria-hidden />
        </button>
        <p className="m-0 text-sm font-semibold text-content">
          {meses[currentMonth.getMonth()]} de {currentMonth.getFullYear()}
        </p>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Mes siguiente"
          title="Mes siguiente"
          className="flex size-8 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-base text-muted transition-colors duration-150 hover:bg-subtle hover:text-content"
        >
          <FiChevronRight aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {diasSemana.map((dia) => (
          <div key={dia} className="py-1 text-center text-xs text-muted">{dia}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => (
          date ? (
            <button
              key={i}
              type="button"
              aria-pressed={isDateSelected(date)}
              className={dayClassName(date, isDateSelected(date), isDateInRange(date))}
              onClick={() => handleDateClick(date)}
            >
              {date.getDate()}
            </button>
          ) : (
            <span key={i} aria-hidden />
          )
        ))}
      </div>
    </Modal>
  )
}
