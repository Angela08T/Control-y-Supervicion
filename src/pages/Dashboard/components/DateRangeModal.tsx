import React, { useState } from 'react'
import { toast } from '../../../utils/toast'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import { Field, Input } from '@/components/UI/Field'

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

  const applyPreset = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }

  return (
    <Modal
      title="Filtrar por rango de fechas"
      description="Selecciona el periodo a analizar."
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" className="mr-auto" onClick={handleClear}>
            Limpiar filtro
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleApply}>Aplicar filtro</Button>
        </>
      }
    >
      <Field label="Fecha de inicio">
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </Field>

      <Field label="Fecha de fin">
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
      </Field>

      <div className="flex flex-col gap-2 border-t border-line pt-4">
        <p className="m-0 text-xs text-muted">Accesos rápidos</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => applyPreset(7)}>
            Últimos 7 días
          </Button>
          <Button variant="secondary" size="sm" onClick={() => applyPreset(30)}>
            Últimos 30 días
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const now = new Date()
              const start = new Date(now.getFullYear(), now.getMonth(), 1)
              const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
              setStartDate(start.toISOString().split('T')[0])
              setEndDate(end.toISOString().split('T')[0])
            }}
          >
            Este mes
          </Button>
        </div>
      </div>
    </Modal>
  )
}
