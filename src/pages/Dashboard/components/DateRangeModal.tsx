import React, { useState } from 'react'
import { FaTimes, FaCalendarAlt } from 'react-icons/fa'
import { toast } from '../../../utils/toast'
import { modalBackdrop } from '../../../utils/classes'

export interface DateRangeModalProps {
  onClose: () => void
  /** Recibe null, null al limpiar el filtro. */
  onApply: (start: Date | null, end: Date | null) => void
}

export default function DateRangeModal({ onClose, onApply }: DateRangeModalProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleApply = () => {
    if (startDate && endDate) {
      onApply(new Date(startDate), new Date(endDate))
    } else {
      toast.warning('Por favor selecciona ambas fechas')
    }
  }

  const handleClear = () => {
    onApply(null, null)
  }

  return (
    <div className={modalBackdrop}>
      <div className="w-[420px] max-w-[95vw] overflow-hidden rounded-[20px] border border-line bg-surface shadow-[0_20px_60px_var(--shadow-hover)] [backdrop-filter:blur(20px)] animate-[modalSlideIn_0.4s_cubic-bezier(0.68,-0.55,0.265,1.55)] max-[480px]:m-2.5 max-[480px]:w-full max-[480px]:rounded-[16px]">
        <div className="flex items-start justify-between border-b border-line bg-[linear-gradient(135deg,rgba(30,58,138,0.1)_0%,rgba(59,130,246,0.1)_100%)] px-6 py-5 max-[480px]:px-5 max-[480px]:py-4">
          <div>
            <h3 className="m-0 flex items-center gap-2.5 text-[18px] font-bold text-content [&_svg]:text-[20px] [&_svg]:text-primary">
              <FaCalendarAlt /> Filtrar por Rango de Fechas
            </h3>
            <p className="m-0 mt-1.5 text-[13px] text-muted">Selecciona el periodo a analizar</p>
          </div>
          <button className="flex cursor-pointer items-center justify-center rounded-[8px] border-none bg-transparent p-2 text-[20px] text-muted [transition:all_0.3s_ease]! hover:bg-[rgba(239,68,68,0.1)] hover:text-danger hover:[transform:rotate(90deg)]" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="flex flex-col gap-5 bg-card p-6 max-[480px]:p-5">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold uppercase tracking-[0.5px] text-content-2">Fecha Inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
              className="w-full cursor-pointer rounded-[10px] border-2 border-line bg-surface px-4 py-3 text-[14px] text-content [font-family:inherit]! [transition:all_0.3s_ease]! hover:border-secondary focus:border-primary focus:shadow-[0_0_0_3px_rgba(30,58,138,0.1)] focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:[filter:var(--calendar-icon-filter,none)] [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:[transition:opacity_0.3s_ease] [&::-webkit-calendar-picker-indicator:hover]:opacity-100 dark:[&::-webkit-calendar-picker-indicator]:[filter:invert(1)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold uppercase tracking-[0.5px] text-content-2">Fecha Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full cursor-pointer rounded-[10px] border-2 border-line bg-surface px-4 py-3 text-[14px] text-content [font-family:inherit]! [transition:all_0.3s_ease]! hover:border-secondary focus:border-primary focus:shadow-[0_0_0_3px_rgba(30,58,138,0.1)] focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:[filter:var(--calendar-icon-filter,none)] [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:[transition:opacity_0.3s_ease] [&::-webkit-calendar-picker-indicator:hover]:opacity-100 dark:[&::-webkit-calendar-picker-indicator]:[filter:invert(1)]"
            />
          </div>

          <div className="border-t border-line pt-2">
            <p className="m-0 mb-3 text-[12px] font-semibold uppercase tracking-[0.5px] text-muted">Accesos rápidos:</p>
            <div className="flex flex-wrap gap-2 max-[480px]:flex-col">
              <button
                onClick={() => {
                  const end = new Date()
                  const start = new Date()
                  start.setDate(start.getDate() - 7)
                  setStartDate(start.toISOString().split('T')[0])
                  setEndDate(end.toISOString().split('T')[0])
                }}
                className="cursor-pointer rounded-[8px] border border-line bg-surface px-3.5 py-2 text-[12px] font-medium text-content-2 [transition:all_0.3s_ease]! hover:border-primary hover:bg-primary hover:text-white hover:[transform:translateY(-2px)] hover:shadow-[0_4px_12px_rgba(30,58,138,0.3)] active:[transform:translateY(0)] max-[480px]:w-full max-[480px]:text-center"
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
                className="cursor-pointer rounded-[8px] border border-line bg-surface px-3.5 py-2 text-[12px] font-medium text-content-2 [transition:all_0.3s_ease]! hover:border-primary hover:bg-primary hover:text-white hover:[transform:translateY(-2px)] hover:shadow-[0_4px_12px_rgba(30,58,138,0.3)] active:[transform:translateY(0)] max-[480px]:w-full max-[480px]:text-center"
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
                className="cursor-pointer rounded-[8px] border border-line bg-surface px-3.5 py-2 text-[12px] font-medium text-content-2 [transition:all_0.3s_ease]! hover:border-primary hover:bg-primary hover:text-white hover:[transform:translateY(-2px)] hover:shadow-[0_4px_12px_rgba(30,58,138,0.3)] active:[transform:translateY(0)] max-[480px]:w-full max-[480px]:text-center"
              >
                Este mes
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-line bg-surface px-6 py-4 max-[480px]:flex-col max-[480px]:px-5">
          <button onClick={handleClear} className="cursor-pointer rounded-[10px] border-2 border-line bg-surface px-5 py-2.5 text-[14px] font-semibold text-content-2 [transition:all_0.3s_ease]! hover:border-muted hover:bg-card hover:text-content hover:[transform:translateY(-2px)] max-[480px]:w-full max-[480px]:justify-center">
            Limpiar Filtro
          </button>
          <button onClick={handleApply} className="relative cursor-pointer overflow-hidden rounded-[10px] border-none bg-[linear-gradient(135deg,var(--primary)_0%,var(--secondary)_100%)] px-5 py-2.5 text-[14px] font-semibold text-btn! shadow-[0_4px_15px_var(--shadow)] [transition:all_0.3s_ease]! hover:shadow-[0_6px_20px_rgba(30,58,138,0.4)] hover:[transform:translateY(-2px)] active:[transform:translateY(0)] max-[480px]:w-full max-[480px]:justify-center">
            Aplicar Filtro
          </button>
        </div>
      </div>
    </div>
  )
}
