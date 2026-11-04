import React, { useState, useMemo, useEffect } from 'react'
import { FiChevronLeft, FiChevronRight, FiTrash2 } from 'react-icons/fi'
import { toast } from '../utils/toast'
import type { ID } from '@/types'
import { actionBtnDanger, cardClass, cn } from '@/utils/classes'
import Badge from '@/components/UI/Badge'
import Button from '@/components/UI/Button'
import { EmptyState } from '@/components/UI/EmptyState'

/** Persona con inasistencias tal como llega desde la pagina de inasistencias */
interface InasistenciaItem {
  id?: ID
  dni: string
  nombreCompleto?: string | null
  apellidos?: string | null
  nombres?: string | null
  turno?: string | null
  cargo?: string | null
  regLab?: string | null
  regimen?: string | null
  subgerencia?: string | null
  /** "DD/MM/YYYY" o ISO */
  fechaIncidente?: string | null
  falta?: string | null
}

/** Fecha de asistencia guardada en la API (GET /attendance) */
interface SavedAttendanceDate {
  id: ID
  date: string | null
  mode?: string | null
  delete_at?: string | null
}

/** Fila de asistencias guardadas: solo se leen dni y dates */
interface SavedAttendance {
  dni: string
  dates?: SavedAttendanceDate[]
}

/** Rango de fechas seleccionado en el padre */
interface DateRangeValue {
  start: Date
  end: Date
}

/** Marca de falta enviada a onSave */
interface MarcaFalta {
  dni: string
  dia: number
  mes: number
  anio: number
  tipo: string
}

/** Marca temporal (aun no guardada) */
interface TempMark {
  tipo: string
  id: ID | null
}

/** Marca guardada (proviene de la API) */
interface SavedMark {
  tipo: 'J' | 'I'
  id: ID
}

/** Dia del calendario */
interface DiaCalendario {
  numero: number
  diaSemana: string
  fecha: Date
  mes: number
  anio: number
}

/** Fila de persona en la tabla */
interface PersonaRow {
  id: ID | undefined
  dni: string
  nombreCompleto: string
  turno: string
  cargo: string
  regimen: string
  subgerencia: string
  faltas: Record<number, 'J' | 'I'>
}

export interface CalendarioInasistenciasProps {
  inasistencias?: InasistenciaItem[]
  savedAttendances?: SavedAttendance[]
  onDelete?: (id?: ID, nombreCompleto?: string) => void
  onSave?: (marks: MarcaFalta[]) => void
  onDeleteMarks?: (ids: ID[]) => void
  onMonthChange?: (date: Date) => void
  dateRange?: DateRangeValue | null
  isReadOnly?: boolean
  canDelete?: boolean
}

/** Celda de la rejilla: borde fino, sin franjas ni sombras */
const cellBase = 'border border-line py-2 text-[13px] whitespace-nowrap text-content-2'

/** Cabecera de la rejilla */
const headerBase = 'border border-line bg-subtle py-2.5 text-xs font-semibold whitespace-nowrap text-muted'
const headerSticky = 'sticky top-0 z-10'
/** Cabecera de las columnas fijas (cruza el scroll en ambas direcciones) */
const headerFixed = 'sticky top-0 z-20'

/** Columnas fijas del cuerpo: se mantienen al desplazar la tabla en horizontal */
const bodyFixed = 'sticky z-10 bg-surface transition-colors duration-150 group-hover:bg-subtle'

/** Fila del cuerpo: solo cambia el fondo al pasar el cursor */
const bodyRow = 'group transition-colors duration-150 hover:bg-subtle'

/** Celda de dia clicable en modo marcado */
const clickableDay = 'cursor-pointer transition-colors duration-150 hover:bg-[rgba(59,130,246,0.08)]'

/** Celda de marca guardada en modo edicion */
const editableDay = 'cursor-pointer transition-colors duration-150 hover:bg-[rgba(245,158,11,0.10)]'

/** Celda seleccionada: fondo tenue del azul de accion */
const selectedDay = 'bg-[rgba(30,58,138,0.12)] font-semibold'

/** Dia de hoy: anillo fino, sin relleno fuerte */
const hoyRing = 'ring-2 ring-inset ring-accent'

/** Marca de falta: texto + color suave */
const marcaBase = 'inline-flex min-w-6 items-center justify-center rounded px-1.5 py-0.5 text-xs font-semibold'
const marcaJustificada = 'bg-[rgba(16,185,129,0.12)] text-[#047857]'
const marcaInjustificada = 'bg-[rgba(239,68,68,0.10)] text-[#b91c1c]'
/** Marca temporal (aun sin guardar) */
const marcaPendiente = 'border border-dashed border-current'

/** Botones de modo de marcado (I / J) */
const toggleBase = 'inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors duration-150'
const toggleIdle = 'border-line-strong bg-surface text-content-2 hover:bg-subtle hover:text-content'
const toggleInjustificada = 'border-danger bg-[rgba(239,68,68,0.10)] text-[#b91c1c]'
const toggleJustificada = 'border-success bg-[rgba(16,185,129,0.12)] text-[#047857]'

/** Paginacion de personas */
const pageBtn = 'inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border border-line-strong bg-surface px-2 text-[13px] text-content-2 transition-colors duration-150 hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40'
const pageBtnActive = 'border-primary bg-primary text-btn hover:bg-primary'

export default function CalendarioInasistencias({
  inasistencias = [],
  savedAttendances = [],
  onDelete,
  onSave,
  onDeleteMarks,
  onMonthChange,
  dateRange,
  isReadOnly = false,
  canDelete = false
}: CalendarioInasistenciasProps) {
  // Usar la fecha de inicio del rango si está disponible
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (dateRange?.start) {
      return new Date(dateRange.start)
    }
    return new Date()
  })
  const [markMode, setMarkMode] = useState<'I' | 'J' | null>(null) // Modo de marcado: 'I' (injustificado), 'J' (justificado) o null
  const [editMode, setEditMode] = useState(false) // Modo de edición para quitar marcas
  const [selectedCells, setSelectedCells] = useState<Record<string, boolean>>({}) // Celdas seleccionadas: { "dni-dia": true }
  const [tempMarks, setTempMarks] = useState<Record<string, TempMark>>({}) // Marcas temporales: { "dni-dia": { tipo: "I"/"J", id: null } }
  const [marksToDelete, setMarksToDelete] = useState<ID[]>([]) // IDs de marcas a eliminar
  const [currentPage, setCurrentPage] = useState(1) // Página actual
  const itemsPerPage = 12 // Límite de personas por página

  // Sincronizar selectedDate cuando cambie dateRange desde el padre
  useEffect(() => {
    if (dateRange?.start) {
      setSelectedDate(new Date(dateRange.start))
      setCurrentPage(1)
      setSelectedCells({})
      setTempMarks({})
      setMarksToDelete([])
      setMarkMode(null)
      setEditMode(false)
    }
  }, [dateRange])

  // Obtener nombre del mes en español
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]

  const diasSemanaCorto = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

  // Procesar savedAttendances para obtener las marcas guardadas: { "dni-dia": { tipo: "J"/"I", id: "uuid" } }
  const savedMarks = useMemo(() => {
    const marks: Record<string, SavedMark> = {}

    savedAttendances.forEach(person => {
      const dni = person.dni

      if (person.dates && Array.isArray(person.dates)) {
        person.dates.forEach(dateObj => {
          // Solo procesar si no está eliminado (delete_at es null)
          if (!dateObj.delete_at && dateObj.date) {
            const date = new Date(dateObj.date)
            const day = date.getDate()
            const key = `${dni}-${day}`

            marks[key] = {
              tipo: dateObj.mode === 'JUSTIFIED' ? 'J' : 'I',
              id: dateObj.id
            }
          }
        })
      }
    })

    return marks
  }, [savedAttendances])

  // Calcular días según el rango seleccionado
  const diasDelMes = useMemo(() => {
    const dias: DiaCalendario[] = []

    if (dateRange?.start && dateRange?.end) {
      // Usar el rango de fechas seleccionado
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)

      // Iterar desde la fecha de inicio hasta la fecha de fin
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        dias.push({
          numero: currentDate.getDate(),
          diaSemana: diasSemanaCorto[currentDate.getDay()],
          fecha: new Date(currentDate),
          mes: currentDate.getMonth(),
          anio: currentDate.getFullYear()
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
    } else {
      // Fallback: mostrar todo el mes actual
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth()
      const ultimoDia = new Date(year, month + 1, 0)
      const totalDias = ultimoDia.getDate()

      for (let i = 1; i <= totalDias; i++) {
        const fecha = new Date(year, month, i)
        dias.push({
          numero: i,
          diaSemana: diasSemanaCorto[fecha.getDay()],
          fecha: fecha,
          mes: month,
          anio: year
        })
      }
    }

    return dias
  }, [selectedDate, dateRange])

  // Filtrar inasistencias del mes seleccionado (solo para mostrar faltas existentes)
  const inasistenciasDelMes = useMemo(() => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()

    return inasistencias.filter(item => {
      if (!item.fechaIncidente) return false
      // Parsear fecha en formato DD/MM/YYYY o ISO
      let fecha: Date
      if (item.fechaIncidente.includes('/')) {
        const [dia, mes, anio] = item.fechaIncidente.split('/')
        fecha = new Date(Number(anio), Number(mes) - 1, Number(dia))
      } else {
        fecha = new Date(item.fechaIncidente)
      }
      return fecha.getFullYear() === year && fecha.getMonth() === month
    })
  }, [inasistencias, selectedDate])

  // Agrupar TODAS las personas (offenders), no solo las que tienen inasistencias este mes
  const personasConInasistencias = useMemo(() => {
    const personas: Record<string, PersonaRow> = {}

    // 🔹 CAMBIO: Primero agregar TODOS los offenders (de inasistencias, sin filtrar por mes)
    inasistencias.forEach(item => {
      const key = item.dni
      if (!personas[key]) {
        personas[key] = {
          id: item.id,
          dni: item.dni,
          nombreCompleto: item.nombreCompleto || `${item.apellidos || ''} ${item.nombres || ''}`.trim(),
          turno: item.turno || '-',
          cargo: item.cargo || '-',
          regimen: item.regLab || item.regimen || '-',
          subgerencia: item.subgerencia || '-',
          faltas: {}
        }
      }
    })

    // Luego marcar las faltas del mes seleccionado
    inasistenciasDelMes.forEach(item => {
      const key = item.dni

      // Marcar el día de la falta
      let diaFalta: number | undefined
      if (item.fechaIncidente && item.fechaIncidente.includes('/')) {
        const [dia] = item.fechaIncidente.split('/')
        diaFalta = parseInt(dia)
      } else if (item.fechaIncidente) {
        diaFalta = new Date(item.fechaIncidente).getDate()
      }

      if (diaFalta && personas[key]) {
        personas[key].faltas[diaFalta] = item.falta?.includes('Justificada') ? 'J' : 'I'
      }
    })

    return Object.values(personas)
  }, [inasistencias, inasistenciasDelMes])

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newDate = new Date(selectedDate)
    newDate.setMonth(parseInt(e.target.value))
    setSelectedDate(newDate)
    // Limpiar selecciones al cambiar mes
    setSelectedCells({})
    setTempMarks({})
    setMarksToDelete([])
    setMarkMode(null)
    setEditMode(false)
    setCurrentPage(1) // Resetear a página 1

    // Notificar al padre del cambio de mes
    if (onMonthChange) {
      onMonthChange(newDate)
    }
  }

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newDate = new Date(selectedDate)
    newDate.setFullYear(parseInt(e.target.value))
    setSelectedDate(newDate)
    // Limpiar selecciones al cambiar año
    setSelectedCells({})
    setTempMarks({})
    setMarksToDelete([])
    setMarkMode(null)
    setEditMode(false)
    setCurrentPage(1) // Resetear a página 1

    // Notificar al padre del cambio de mes
    if (onMonthChange) {
      onMonthChange(newDate)
    }
  }

  function handleDownloadPDF() {
  }

  function handleToggleMark(tipo: 'I' | 'J') {
    // Si ya está activo este modo, desactivarlo
    if (markMode === tipo) {
      setMarkMode(null)
      setSelectedCells({})
    } else {
      // Activar el nuevo modo
      setMarkMode(tipo)
      // Limpiar selecciones previas
      setSelectedCells({})
      setTempMarks({})
      // Desactivar modo edición si está activo
      if (editMode) {
        setEditMode(false)
      }
    }
  }

  function handleToggleEdit() {
    setEditMode(!editMode)
    if (editMode) {
      // Si se desactiva el modo edición, limpiar selecciones
      setSelectedCells({})
    }
    // Desactivar modo de marcado si está activo
    if (markMode) {
      setMarkMode(null)
      setSelectedCells({})
    }
  }

  function handleCellClick(dni: string, dia: number, mes: number, anio: number) {
    // Key simple para savedMarks (compatibilidad con el formato actual)
    const savedKey = `${dni}-${dia}`
    // Key completa para tempMarks (incluye mes y año para evitar conflictos)
    const fullKey = `${dni}-${dia}-${mes}-${anio}`

    // Modo de marcado (I o J): agregar marcas temporales (solo si NO hay marca guardada)
    if (markMode) {
      // No permitir marcar si ya existe una marca guardada
      if (savedMarks[savedKey]) {
        toast.warning('Esta celda ya tiene una marca guardada. Usa el modo EDITAR para eliminarla.')
        return
      }

      setSelectedCells(prev => {
        const newSelected = { ...prev }
        if (newSelected[fullKey]) {
          delete newSelected[fullKey]
          // Quitar marca temporal
          setTempMarks(marks => {
            const newMarks = { ...marks }
            delete newMarks[fullKey]
            return newMarks
          })
        } else {
          newSelected[fullKey] = true
          // Agregar marca temporal con el tipo seleccionado (I o J)
          setTempMarks(marks => ({
            ...marks,
            [fullKey]: { tipo: markMode === 'I' ? 'injustificada' : 'justificada', id: null }
          }))
        }
        return newSelected
      })
    }

    // Modo edición: seleccionar marcas guardadas para eliminar
    if (editMode) {
      // Solo permitir seleccionar celdas que tienen marcas guardadas
      if (savedMarks[savedKey]) {
        const markId = savedMarks[savedKey].id

        setMarksToDelete(prev => {
          const newMarks = [...prev]
          const index = newMarks.indexOf(markId)

          if (index > -1) {
            // Ya está seleccionado, quitarlo
            newMarks.splice(index, 1)
          } else {
            // No está seleccionado, agregarlo
            newMarks.push(markId)
          }

          return newMarks
        })

        // Toggle selección visual
        setSelectedCells(prev => {
          const newSelected = { ...prev }
          if (newSelected[fullKey]) {
            delete newSelected[fullKey]
          } else {
            newSelected[fullKey] = true
          }
          return newSelected
        })
      }
    }
  }

  function handleDeleteSelected() {
    if (onDelete) {
      onDelete()
    }
  }

  function handleCancel() {
    // Limpiar todas las selecciones y marcas temporales
    setSelectedCells({})
    setTempMarks({})
    setMarkMode(null)
    setEditMode(false)
  }

  function handleSave() {
    // Modo de marcado: guardar marcas nuevas
    if (markMode || Object.keys(tempMarks).length > 0) {
      const marksToSave = Object.keys(tempMarks).map(key => {
        // El key ahora es "dni-dia-mes-anio" o "dni-dia" (para compatibilidad)
        const parts = key.split('-')
        const dni = parts[0]
        const dia = parseInt(parts[1])
        const mes = parts[2] ? parseInt(parts[2]) : selectedDate.getMonth() + 1
        const anio = parts[3] ? parseInt(parts[3]) : selectedDate.getFullYear()
        const markData = tempMarks[key]
        return {
          dni,
          dia,
          mes,
          anio,
          tipo: markData.tipo || 'injustificada'
        }
      })

      if (marksToSave.length === 0) {
        toast.warning('No hay faltas seleccionadas para guardar')
        return
      }

      if (onSave) {
        onSave(marksToSave)
      }

      // Limpiar después de guardar
      setSelectedCells({})
      setTempMarks({})
      setMarkMode(null)
      // No mostrar alert aquí, el componente padre lo hará
    }

    // Modo edición: eliminar marcas seleccionadas
    if (editMode) {
      if (marksToDelete.length === 0) {
        toast.warning('No hay marcas seleccionadas para eliminar')
        setEditMode(false)
        return
      }

      if (onDeleteMarks) {
        onDeleteMarks(marksToDelete)
      }

      // Limpiar después de eliminar
      setSelectedCells({})
      setMarksToDelete([])
      setEditMode(false)
      // No mostrar alert aquí, el componente padre lo hará
    }
  }

  // Generar años disponibles
  const years: number[] = []
  const currentYear = new Date().getFullYear()
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    years.push(i)
  }

  // Calcular paginación
  const totalPersonas = personasConInasistencias.length
  const totalPages = Math.ceil(totalPersonas / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const personasPaginadas = personasConInasistencias.slice(startIndex, endIndex)

  // Funciones de navegación de página
  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  function handlePreviousPage() {
    handlePageChange(currentPage - 1)
  }

  function handleNextPage() {
    handlePageChange(currentPage + 1)
  }

  // Dia de hoy (para el anillo de la cabecera y de la celda)
  const hoy = new Date()
  const esHoy = (dia: DiaCalendario) =>
    dia.fecha.getFullYear() === hoy.getFullYear() &&
    dia.fecha.getMonth() === hoy.getMonth() &&
    dia.fecha.getDate() === hoy.getDate()

  // Columnas fijas: "#" (40px) y, si hay eliminar, la columna de eliminar (48px)
  const nameLeft = canDelete ? 'left-[88px]' : 'left-10'
  const colSpanVacio = (canDelete ? 7 : 6) + diasDelMes.length

  return (
    <div className={cardClass}>
      {/* Titulo del periodo */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <h3 className="m-0 text-[15px] font-semibold text-content">
          {dateRange?.start && dateRange?.end ? (
            <>
              Inasistencias de servicio: {dateRange.start.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} al {dateRange.end.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
            </>
          ) : (
            `Inasistencias de servicio: ${meses[selectedDate.getMonth()]}`
          )}
        </h3>
      </div>

      {/* Modo de marcado: solo si no es modo solo lectura */}
      {!isReadOnly && (
        <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
          <button
            type="button"
            aria-pressed={markMode === 'I'}
            className={cn(toggleBase, markMode === 'I' ? toggleInjustificada : toggleIdle)}
            onClick={() => handleToggleMark('I')}
            title={markMode === 'I' ? 'Desactivar modo injustificada' : 'Activar modo injustificada'}
          >
            <span className="font-semibold">I</span>
            Injustificada
          </button>
          <button
            type="button"
            aria-pressed={markMode === 'J'}
            className={cn(toggleBase, markMode === 'J' ? toggleJustificada : toggleIdle)}
            onClick={() => handleToggleMark('J')}
            title={markMode === 'J' ? 'Desactivar modo justificada' : 'Activar modo justificada'}
          >
            <span className="font-semibold">J</span>
            Justificada
          </button>

          {markMode === 'I' && (
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-content-2">
              <Badge tone="danger">Modo injustificada activo</Badge>
              Haz clic en las celdas para marcar la inasistencia.
            </div>
          )}
          {markMode === 'J' && (
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-content-2">
              <Badge tone="success">Modo justificada activo</Badge>
              Haz clic en las celdas para marcar la inasistencia.
            </div>
          )}
          {editMode && (
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-content-2">
              <Badge tone="warning">Modo edición activo</Badge>
              Haz clic en las celdas marcadas para eliminarlas.
            </div>
          )}
        </div>
      )}

      {/* Leyenda: el texto acompana al color */}
      <div className="flex flex-wrap items-center gap-2 px-5 pt-4 text-xs text-muted">
        <span>Leyenda:</span>
        <Badge tone="success">J · Justificada</Badge>
        <Badge tone="danger">I · Injustificada</Badge>
        <Badge tone="neutral">- · Sin marca</Badge>
        <span>Borde punteado: sin guardar</span>
      </div>

      {/* Tabla calendario */}
      <div className="mt-4 overflow-x-auto border-y border-line">
        <table className="w-full min-w-[1200px] border-collapse">
          <thead>
            <tr>
              <th className={cn(headerBase, headerFixed, 'left-0 w-10 px-2 text-center')}>#</th>
              {canDelete && <th className={cn(headerBase, headerFixed, 'left-10 w-12')}></th>}
              <th className={cn(headerBase, headerFixed, nameLeft, 'min-w-[200px] px-2 text-left')}>Apellidos y nombres</th>
              <th className={cn(headerBase, headerSticky, 'min-w-[80px] px-2 text-center')}>Turno</th>
              <th className={cn(headerBase, headerSticky, 'min-w-[120px] px-2 text-center')}>Cargo</th>
              <th className={cn(headerBase, headerSticky, 'min-w-[100px] px-2 text-center')}>Régimen</th>
              {diasDelMes.map(dia => (
                <th key={dia.numero} className={cn(headerBase, headerSticky, 'w-9 min-w-9 text-center', esHoy(dia) && hoyRing)}>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[11px] font-medium text-muted">{dia.diaSemana}</span>
                    <span className="text-[13px] font-semibold text-content">{dia.numero.toString().padStart(2, '0')}</span>
                  </div>
                </th>
              ))}
              <th className={cn(headerBase, headerSticky, 'min-w-[60px] px-2 text-center')}>Total</th>
            </tr>
          </thead>
          <tbody>
            {totalPersonas === 0 ? (
              <tr>
                <td colSpan={colSpanVacio} className="border border-line p-0">
                  <EmptyState title="No hay inasistencias registradas en este periodo" />
                </td>
              </tr>
            ) : (
              personasPaginadas.map((persona, index) => {
                // Calcular total de inasistencias para esta persona
                // Contar marcas guardadas + marcas temporales para este DNI
                const totalInasistencias = diasDelMes.reduce((count, dia) => {
                  const savedKey = `${persona.dni}-${dia.numero}`
                  const mes = dia.mes !== undefined ? dia.mes + 1 : selectedDate.getMonth() + 1
                  const anio = dia.anio !== undefined ? dia.anio : selectedDate.getFullYear()
                  const fullKey = `${persona.dni}-${dia.numero}-${mes}-${anio}`

                  // Contar si hay marca guardada O marca temporal
                  if (savedMarks[savedKey] || tempMarks[fullKey]) {
                    return count + 1
                  }
                  return count
                }, 0)

                // Número de fila global (considerando la paginación)
                const numeroFila = startIndex + index + 1

                return (
                  <tr key={persona.dni} className={bodyRow}>
                    <td className={cn(cellBase, bodyFixed, 'left-0 w-10 px-2 text-center font-semibold text-muted')}>{numeroFila}</td>
                    {canDelete && (
                      <td className={cn(cellBase, bodyFixed, 'left-10 w-12 px-2 text-center')}>
                        <button
                          type="button"
                          title="Eliminar persona"
                          aria-label={`Eliminar a ${persona.nombreCompleto}`}
                          onClick={() => onDelete && onDelete(persona.id, persona.nombreCompleto)}
                          className={actionBtnDanger}
                        >
                          <FiTrash2 aria-hidden />
                        </button>
                      </td>
                    )}
                    <td className={cn(cellBase, bodyFixed, nameLeft, 'min-w-[200px] px-2 text-left font-medium text-content')}>{persona.nombreCompleto}</td>
                    <td className={cn(cellBase, 'min-w-[80px] px-2 text-center')}>{persona.turno}</td>
                    <td className={cn(cellBase, 'min-w-[120px] px-2 text-center')}>{persona.cargo}</td>
                    <td className={cn(cellBase, 'min-w-[100px] px-2 text-center')}>{persona.regimen}</td>
                    {diasDelMes.map(dia => {
                      // Key para savedMarks (simple)
                      const savedKey = `${persona.dni}-${dia.numero}`
                      // Key completa para tempMarks y selectedCells
                      const mes = dia.mes !== undefined ? dia.mes + 1 : selectedDate.getMonth() + 1
                      const anio = dia.anio !== undefined ? dia.anio : selectedDate.getFullYear()
                      const fullKey = `${persona.dni}-${dia.numero}-${mes}-${anio}`

                      const isSelected = selectedCells[fullKey]
                      const tempMark = tempMarks[fullKey]
                      const savedMark = savedMarks[savedKey]

                      // Mostrar marca temporal o marca guardada, o guion si no hay nada
                      let content: React.ReactNode

                      if (tempMark) {
                        // Marca temporal (nueva, aún no guardada)
                        const esJustificada = tempMark.tipo === 'justificada'
                        content = (
                          <span
                            title={esJustificada ? 'Justificada (sin guardar)' : 'Injustificada (sin guardar)'}
                            className={cn(marcaBase, esJustificada ? marcaJustificada : marcaInjustificada, marcaPendiente)}
                          >
                            {esJustificada ? 'J' : 'I'}
                          </span>
                        )
                      } else if (savedMark) {
                        // Marca guardada desde la API
                        const esJustificada = savedMark.tipo === 'J'
                        content = (
                          <span
                            title={esJustificada ? 'Justificada' : 'Injustificada'}
                            className={cn(marcaBase, esJustificada ? marcaJustificada : marcaInjustificada)}
                          >
                            {savedMark.tipo}
                          </span>
                        )
                      } else {
                        // Sin marca
                        content = <span className="text-xs text-muted">-</span>
                      }

                      // Interaccion: celdas clicables, seleccionadas y editables
                      const clickable = !!(markMode || editMode)
                      const editable = editMode && !!savedMark
                      const cellClass = cn(
                        cellBase,
                        'w-9 min-w-9 text-center',
                        clickable && !editable && clickableDay,
                        editable && editableDay,
                        isSelected && selectedDay,
                        esHoy(dia) && hoyRing
                      )

                      return (
                        <td
                          key={`${dia.numero}-${mes}-${anio}`}
                          className={cellClass}
                          onClick={() => handleCellClick(persona.dni, dia.numero, mes, anio)}
                        >
                          {content}
                        </td>
                      )
                    })}
                    <td className={cn(cellBase, 'min-w-[60px] px-2 text-center font-semibold text-content')}>{totalInasistencias}</td>
                  </tr>
                )
              })
            )}
            {/* Filas vacías para completar hasta 12 */}
            {Array.from({ length: Math.max(0, itemsPerPage - personasPaginadas.length) }).map((_, index) => (
              <tr key={`empty-${index}`} className={bodyRow}>
                <td className={cn(cellBase, bodyFixed, 'left-0 w-10 px-2 text-center font-semibold text-muted')}>{startIndex + personasPaginadas.length + index + 1}</td>
                {canDelete && <td className={cn(cellBase, bodyFixed, 'left-10 w-12')}></td>}
                <td className={cn(cellBase, bodyFixed, nameLeft, 'min-w-[200px] px-2 text-left')}></td>
                <td className={cn(cellBase, 'min-w-[80px]')}></td>
                <td className={cn(cellBase, 'min-w-[120px]')}></td>
                <td className={cn(cellBase, 'min-w-[100px]')}></td>
                {diasDelMes.map(dia => (
                  <td key={dia.numero} className={cn(cellBase, 'w-9 min-w-9 text-center', markMode && clickableDay)}>
                    <span className="text-xs text-muted">-</span>
                  </td>
                ))}
                <td className={cn(cellBase, 'min-w-[60px] px-2 text-center font-semibold text-content')}>0</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controles de paginación */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <span className="text-[13px] text-muted">
            {totalPersonas} {totalPersonas === 1 ? 'persona' : 'personas'} · Página {currentPage} de {totalPages}
          </span>
          <nav className="flex items-center gap-1" aria-label="Paginación">
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={pageBtn}
              aria-label="Página anterior"
            >
              <FiChevronLeft aria-hidden />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  aria-current={currentPage === pageNum ? 'page' : undefined}
                  className={cn(pageBtn, 'font-medium', currentPage === pageNum && pageBtnActive)}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={pageBtn}
              aria-label="Página siguiente"
            >
              <FiChevronRight aria-hidden />
            </button>
          </nav>
        </div>
      )}

      {/* Botones de Cancelar y Guardar - Solo mostrar si no es modo solo lectura */}
      {!isReadOnly && (
        <div className="flex flex-wrap justify-end gap-3 border-t border-line bg-subtle px-5 py-3">
          <Button variant="secondary" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar cambios
          </Button>
        </div>
      )}
    </div>
  )
}
