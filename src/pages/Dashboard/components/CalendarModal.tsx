import React, { useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import { cn } from '../../../utils/classes'

export interface CalendarModalProps {
  onClose: () => void
  onApply: (start: Date, end: Date) => void
}

/** Clases de una celda del calendario (equivale a .calendar-day con sus estados). */
const dayClassName = (date: Date | null, selected: boolean, inRange: boolean): string => cn(
  'flex aspect-square items-center justify-center rounded-[8px] text-[14px] font-semibold select-none [transition:all_0.2s_ease]',
  !date && 'cursor-default bg-transparent',
  date && 'cursor-pointer',
  date && !inRange && !selected && 'bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.3)]',
  date && inRange && 'bg-[rgba(255,255,255,0.4)]',
  date && !inRange && selected && 'bg-white',
  selected ? 'text-[#0c4a6e] shadow-[0_4px_12px_rgba(0,0,0,0.2)] [transform:scale(1.1)]' : 'text-white',
  date && !selected && 'hover:[transform:scale(1.05)]'
)

export default function CalendarModal({ onClose, onApply }: CalendarModalProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 [backdrop-filter:blur(4px)]">
      <div className="w-[90%] max-w-[400px] rounded-[16px] bg-[linear-gradient(135deg,#0c4a6e_0%,#075985_50%,#0369a1_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[slideUp_0.3s_ease] dark:bg-[linear-gradient(135deg,#1e40af_0%,#2563eb_50%,#3b82f6_100%)]">
        <div className="mb-5 flex items-center justify-between">
          <button className="flex size-8 cursor-pointer items-center justify-center rounded-[8px] border-none bg-[rgba(255,255,255,0.2)] text-[20px] text-white [transition:all_0.3s_ease] hover:bg-[rgba(255,255,255,0.3)] hover:[transform:scale(1.1)]" onClick={previousMonth}>
            ‹
          </button>
          <h3 className="m-0 text-[18px] font-bold text-white capitalize">
            {meses[currentMonth.getMonth()]} De {currentMonth.getFullYear()}
          </h3>
          <button className="flex size-8 cursor-pointer items-center justify-center rounded-[8px] border-none bg-[rgba(255,255,255,0.2)] text-[20px] text-white [transition:all_0.3s_ease] hover:bg-[rgba(255,255,255,0.3)] hover:[transform:scale(1.1)]" onClick={nextMonth}>
            ›
          </button>
        </div>

        <div className="mb-3 grid grid-cols-[repeat(7,1fr)] gap-2">
          {diasSemana.map((dia, i) => (
            <div key={i} className="py-2 text-center text-[12px] font-semibold text-white opacity-90">{dia}</div>
          ))}
        </div>

        <div className="mb-5 grid grid-cols-[repeat(7,1fr)] gap-2">
          {days.map((date, i) => (
            <div
              key={i}
              className={dayClassName(date, isDateSelected(date), isDateInRange(date))}
              onClick={() => handleDateClick(date)}
            >
              {date ? date.getDate() : ''}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button className="cursor-pointer rounded-[8px] border-none bg-[rgba(255,255,255,0.2)] px-5 py-2.5 text-[14px] font-semibold text-white [transition:all_0.3s_ease] hover:bg-[rgba(255,255,255,0.3)]" onClick={handleCancel}>
            Cancelar
          </button>
          <button
            className="cursor-pointer rounded-[8px] border-none bg-white px-5 py-2.5 text-[14px] font-semibold text-[#0c4a6e] [transition:all_0.3s_ease] hover:bg-[rgba(255,255,255,0.95)] hover:[transform:translateY(-2px)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:[transform:none] disabled:hover:shadow-none"
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
