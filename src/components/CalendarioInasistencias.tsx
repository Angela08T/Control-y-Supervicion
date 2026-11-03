import React, { useState, useMemo, useEffect } from 'react'
import { FaFilePdf, FaTrash } from 'react-icons/fa'
import { toast } from '../utils/toast'
import type { ID } from '@/types'
import { cn } from '@/utils/classes'

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

/** Celda de la tabla (equivale a `.calendario-table th, .calendario-table td`) */
const cellBase = 'border border-line p-2 text-center text-[0.85rem] whitespace-nowrap'

/** Encabezado de la tabla (equivale a `.calendario-table th`) */
const headerCell = `${cellBase} sticky top-0 z-10 bg-surface font-semibold text-content`

/** Fila del cuerpo: franjas pares y hover (equivale a `.calendario-table tbody tr`) */
const bodyRow = 'even:bg-[rgba(59,130,246,0.03)] hover:bg-[rgba(59,130,246,0.08)]'

/** Celda de dia clicable en modo marcado o edicion (equivale a `.col-dia.clickable`) */
const clickableDay = 'cursor-pointer transition-all duration-200 ease-[ease]'

/** Hover de celda clicable que no es editable (equivale a `.col-dia.clickable:hover`) */
const clickableDayHover = 'hover:bg-[rgba(59,130,246,0.15)]!'

/** Celda con marca guardada en modo edicion (equivale a `.col-dia.editable:hover`) */
const editableDay = 'cursor-pointer hover:bg-[rgba(245,158,11,0.15)]!'

/** Celda seleccionada (equivale a `.col-dia.selected`) */
const selectedDay = 'border-2! border-primary! bg-[rgba(59,130,246,0.25)]!'

/** Texto vacio de la tabla (equivale a `.empty-message`) */
const emptyMessage = 'border border-line p-[30px]! text-center! text-[0.85rem] whitespace-nowrap italic text-muted'

/** Marca de falta base (equivale a `.marca-falta`) */
const marcaFalta = 'inline-block rounded-[4px] px-1.5 py-0.5 text-[0.75rem]'

/** Boton I / J de modo de marcado (equivale a `.btn-fl`) */
const btnFl = 'cursor-pointer rounded-[6px] border px-4 py-2 text-[0.9rem] font-semibold text-white transition-all duration-200 ease-[ease] hover:-translate-y-px'

/** Boton I / J sin activar (`.btn-fl.btn-injustificado` y `.btn-fl.btn-justificado`) */
const btnFlIdle = 'border-[#ef4444] bg-[#ef4444] hover:border-[#dc2626] hover:bg-[#dc2626]'

/** Boton I / J activo (`.btn-fl.active` + `.btn-*.active`) */
const btnFlActive = 'border-[#dc2626] bg-[#dc2626] shadow-[0_0_10px_rgba(239,68,68,0.4)]'

/** Boton Anterior / Siguiente (equivale a `.calendario-pagination .btn-secondary`) */
const paginationBtn = 'flex cursor-pointer items-center gap-[5px] rounded-[6px] border border-line bg-surface px-4 py-2 text-[0.9rem] font-medium text-content transition-all duration-200 ease-[ease] hover:-translate-y-0.5 enabled:hover:border-primary enabled:hover:bg-primary enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50'

/** Numero de pagina (equivale a `.page-number`) */
const pageNumberBase = 'cursor-pointer rounded-[4px] border px-3 py-2 min-w-[40px] transition-all duration-200 ease-[ease]'
const pageNumberIdle = 'border-line bg-transparent font-medium text-content hover:bg-surface'
const pageNumberActive = 'border-primary bg-primary font-bold text-white'

/** Boton Cancelar del pie (equivale a `.calendario-footer .btn-secondary`) */
const footerSecondary = 'cursor-pointer rounded-[6px] border border-line bg-surface px-[30px] py-2.5 text-[0.95rem] font-semibold text-content transition-all duration-200 ease-[ease] hover:-translate-y-0.5 hover:bg-line max-[768px]:w-full'

/** Boton Guardar del pie (equivale a `.calendario-footer .btn-primary`) */
const footerPrimary = 'relative cursor-pointer overflow-hidden rounded-[6px] border border-primary bg-primary px-[30px] py-2.5 text-[0.95rem] font-semibold text-btn! shadow-[0_4px_15px_var(--shadow)] transition-all duration-200 ease-[ease] hover:-translate-y-px hover:bg-primary-hover hover:shadow-[0_4px_12px_rgba(30,58,138,0.3)] active:-translate-y-px [&:active:not(:hover)]:scale-[1.02] max-[768px]:w-full'

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
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ]

  const diasSemanaCorto = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SÁ']

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

  return (
    <div className="rounded-[12px] border border-line bg-card p-5 shadow-[0_4px_12px_var(--shadow)]">
      {/* Botones de acción - Solo mostrar si no es modo solo lectura */}
      {!isReadOnly && (
        <div className="mb-5 flex items-center gap-[10px]">
          <button
            className={cn(btnFl, markMode === 'I' ? btnFlActive : btnFlIdle)}
            onClick={() => handleToggleMark('I')}
            title={markMode === 'I' ? 'Desactivar modo Injustificado' : 'Activar modo Injustificado'}
          >
            I
          </button>
          <button
            className={cn(btnFl, markMode === 'J' ? btnFlActive : btnFlIdle)}
            onClick={() => handleToggleMark('J')}
            title={markMode === 'J' ? 'Desactivar modo Justificado' : 'Activar modo Justificado'}
          >
            J
          </button>
          {markMode === 'I' && (
            <span className="ml-2.5 text-[0.9rem] font-medium text-danger">
              Modo Injustificado activo - Haz clic en las celdas para marcar inasistencia injustificada
            </span>
          )}
          {markMode === 'J' && (
            <span className="ml-2.5 text-[0.9rem] font-medium text-danger">
              Modo Justificado activo - Haz clic en las celdas para marcar inasistencia justificada
            </span>
          )}
          {editMode && (
            <span className="ml-2.5 text-[0.9rem] font-medium text-warning">
              Modo edición activo - Haz clic en las celdas marcadas para eliminarlas
            </span>
          )}
        </div>
      )}

      {/* Tabla calendario */}
      <div className="overflow-hidden rounded-lg border border-line">
        <div className="bg-primary px-5 py-3 text-center text-[1rem] font-semibold tracking-[0.5px] text-white">
          {dateRange?.start && dateRange?.end ? (
            <>
              INASISTENCIAS DE SERVICIO - {
                dateRange.start.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }).toUpperCase()
              } AL {
                dateRange.end.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
              }
            </>
          ) : (
            `INASISTENCIAS DE SERVICIO - MES DE ${meses[selectedDate.getMonth()]}`
          )}
        </div>

        <div className="overflow-x-auto bg-surface">
          <table className="w-full min-w-[1200px] border-collapse">
            <thead>
              <tr>
                <th className={cn(headerCell, 'w-10')}>#</th>
                {canDelete && <th className={headerCell}></th>}
                <th className={cn(headerCell, 'min-w-[200px] text-left!')}>APELLIDOS Y NOMBRES</th>
                <th className={cn(headerCell, 'min-w-[80px]')}>TURNO</th>
                <th className={cn(headerCell, 'min-w-[120px]')}>CARGO</th>
                <th className={cn(headerCell, 'min-w-[100px]')}>RÉGIMEN</th>
                {diasDelMes.map(dia => (
                  <th key={dia.numero} className={cn(headerCell, 'w-[35px] min-w-[35px]')}>
                    <div className="flex flex-col items-center gap-[2px]">
                      <span className="text-[0.75rem] font-semibold text-content-2">{dia.diaSemana}</span>
                      <span className="text-[0.8rem] font-medium text-content">{dia.numero.toString().padStart(2, '0')}</span>
                    </div>
                  </th>
                ))}
                <th className={cn(headerCell, 'min-w-[60px]')}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {totalPersonas === 0 ? (
                <tr className={bodyRow}>
                  <td colSpan={6 + diasDelMes.length} className={emptyMessage}>
                    No hay inasistencias registradas en este mes
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
                      <td className={cn(cellBase, 'w-10 font-semibold text-muted')}>{numeroFila}</td>
                      {canDelete && (
                        <td className={cellBase}>
                          <button
                            title="Eliminar persona"
                            onClick={() => onDelete && onDelete(persona.id, persona.nombreCompleto)}
                            className="flex cursor-pointer items-center rounded-[4px] border-none bg-transparent p-1 text-danger"
                          >
                            <FaTrash size={13} />
                          </button>
                        </td>
                      )}
                      <td className={cn(cellBase, 'min-w-[200px] text-left! font-medium')}>{persona.nombreCompleto}</td>
                      <td className={cn(cellBase, 'min-w-[80px]')}>{persona.turno}</td>
                      <td className={cn(cellBase, 'min-w-[120px]')}>{persona.cargo}</td>
                      <td className={cn(cellBase, 'min-w-[100px]')}>{persona.regimen}</td>
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
                          const displayText = tempMark.tipo === 'justificada' ? 'J' : 'I'
                          content = <span className={cn(marcaFalta, 'animate-[pulse_1s_infinite] border border-danger bg-[rgba(239,68,68,0.2)] font-semibold text-danger')}>{displayText}</span>
                        } else if (savedMark) {
                          // Marca guardada desde la API
                          const displayText = savedMark.tipo // "J" o "I"
                          content = <span className={cn(marcaFalta, 'border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.15)] font-bold text-[#dc2626]')}>{displayText}</span>
                        } else {
                          // Sin marca
                          content = <span className="text-[0.8rem] text-muted">-</span>
                        }

                        // Interaccion: celdas clicables, seleccionadas y editables
                        const clickable = !!(markMode || editMode)
                        const editable = editMode && !!savedMark
                        const cellClass = cn(
                          cellBase,
                          'w-[35px] min-w-[35px]',
                          clickable && clickableDay,
                          clickable && !editable && clickableDayHover,
                          editable && editableDay,
                          isSelected && selectedDay
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
                      <td className={cn(cellBase, 'min-w-[60px] bg-primary font-bold text-white')}>
                        <span className="text-[1rem] font-bold">{totalInasistencias}</span>
                      </td>
                    </tr>
                  )
                })
              )}
              {/* Filas vacías para completar hasta 12 */}
              {Array.from({ length: Math.max(0, itemsPerPage - personasPaginadas.length) }).map((_, index) => (
                <tr key={`empty-${index}`} className={bodyRow}>
                  <td className={cn(cellBase, 'w-10 font-semibold text-muted')}>{startIndex + personasPaginadas.length + index + 1}</td>
                  {canDelete && <td className={cellBase}></td>}
                  <td className={cn(cellBase, 'min-w-[200px] text-left! font-medium')}></td>
                  <td className={cn(cellBase, 'min-w-[80px]')}></td>
                  <td className={cn(cellBase, 'min-w-[120px]')}></td>
                  <td className={cn(cellBase, 'min-w-[100px]')}></td>
                  {diasDelMes.map(dia => (
                    <td key={dia.numero} className={cn(cellBase, 'w-[35px] min-w-[35px]', markMode && clickableDay, markMode && clickableDayHover)}>
                      <span className="text-[0.8rem] text-muted">-</span>
                    </td>
                  ))}
                  <td className={cn(cellBase, 'min-w-[60px] bg-primary font-bold text-white')}>
                    <span className="text-[1rem] font-bold">0</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Controles de paginación */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2.5 rounded-lg border border-line p-[15px] max-[768px]:flex-wrap">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={paginationBtn}
          >
            ← Anterior
          </button>

          <div className="flex items-center gap-[5px] max-[768px]:flex-wrap max-[768px]:justify-center">
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
                  onClick={() => handlePageChange(pageNum)}
                  className={cn(pageNumberBase, currentPage === pageNum ? pageNumberActive : pageNumberIdle)}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={paginationBtn}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Botones de Cancelar y Guardar - Solo mostrar si no es modo solo lectura */}
      {!isReadOnly && (
        <div className="mt-5 flex justify-end gap-[15px] border-t border-line pt-5 max-[768px]:flex-col">
          <button className={footerSecondary} onClick={handleCancel}>
            CANCELAR
          </button>
          <button className={footerPrimary} onClick={handleSave}>
            GUARDAR
          </button>
        </div>
      )}
    </div>
  )
}
