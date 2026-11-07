import React, { useState, useMemo, useEffect } from 'react'
import { FiChevronLeft, FiChevronRight, FiTrash2 } from 'react-icons/fi'
import { toast } from '../utils/toast'
import type { ID } from '@/types'
import { actionBtnDanger, cn, fitCard } from '@/utils/classes'
import Button from '@/components/UI/Button'
import { EmptyState } from '@/components/UI/EmptyState'
import { PAGE_SIZE } from '@/hooks/usePagedList'

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

/** Cabecera de la rejilla: fondo suave, sin lineas verticales */
const th = 'border-b border-line bg-subtle py-2.5 text-xs font-medium whitespace-nowrap text-muted'
const thSticky = 'sticky top-0 z-10'
/** Cabecera de las columnas fijas (cruza el scroll en ambas direcciones) */
const thFixed = 'sticky top-0 z-20'

/** Celda del cuerpo: solo una linea fina debajo de cada fila */
const td = 'border-b border-line py-2.5 text-[13px] whitespace-nowrap text-content-2'

/** Columnas fijas del cuerpo: se mantienen al desplazar la tabla en horizontal */
const bodyFixed = 'sticky z-10 bg-surface transition-colors duration-150 group-hover:bg-subtle'

/** Fila del cuerpo: solo cambia el fondo al pasar el cursor */
const bodyRow = 'group transition-colors duration-150 hover:bg-subtle'

/** Sabado y domingo: fondo apenas azulado para leer la semana de un vistazo */
const weekendCell = 'bg-[rgba(30,58,138,0.035)]'
/** Columna de hoy */
const todayCell = 'bg-[rgba(30,58,138,0.07)]'

/** Celda de dia clicable en modo marcado */
const clickableDay = 'cursor-pointer transition-colors duration-150 hover:bg-[rgba(30,58,138,0.10)]'

/** Celda de marca guardada en modo edicion */
const editableDay = 'cursor-pointer transition-colors duration-150 hover:bg-[rgba(242,165,15,0.14)]'

/** Celda seleccionada: fondo tenue del azul de accion */
const selectedDay = 'bg-[rgba(30,58,138,0.14)]'

/** Marca de falta: cuadro pequeno con letra y color suave */
const marcaBase = 'inline-flex size-6 items-center justify-center rounded-md text-xs font-semibold'
const marcaJustificada = 'bg-[rgba(142,188,34,0.18)] text-[#3f6212]'
const marcaInjustificada = 'bg-[rgba(199,21,34,0.12)] text-[#b91c1c]'
/** Anchos de columna (px). "#" y eliminar deben coincidir con los `left-*` de las columnas fijas */
const COL_NUM = 40
const COL_DELETE = 48
const COL_NAME = 260
const COL_JOB = 170
const COL_REGIME = 110
const COL_SHIFT = 90
const COL_DAY = 40
const COL_TOTAL = 64

/** Muestra pequena de la marca, para la leyenda */
const legendMark = 'inline-flex size-5 items-center justify-center rounded text-[11px] font-semibold'
/** Marca temporal (aun sin guardar) */
const marcaPendiente = 'border border-dashed border-current'

/** Selector de modo de marcado: una sola pieza con tres opciones */
const segBase = 'inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border-none px-3 text-[13px] font-medium transition-colors duration-150'
const segIdle = 'bg-transparent text-content-2 hover:text-content'
const segActive = 'bg-surface text-content shadow-[0_1px_2px_rgba(15,23,42,0.14)]'

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
  const itemsPerPage = PAGE_SIZE // Límite de personas por página (máx. 10)

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

  // Dia de hoy (para resaltar su columna)
  const hoy = new Date()
  const esHoy = (dia: DiaCalendario) =>
    dia.fecha.getFullYear() === hoy.getFullYear() &&
    dia.fecha.getMonth() === hoy.getMonth() &&
    dia.fecha.getDate() === hoy.getDate()
  const esFinDeSemana = (dia: DiaCalendario) => dia.fecha.getDay() === 0 || dia.fecha.getDay() === 6

  // Cambios que el usuario aun no guarda (marcas nuevas + marcas por quitar)
  const pendingCount = Object.keys(tempMarks).length + marksToDelete.length

  // Columnas fijas: "#" (40px) y, si hay eliminar, la columna de eliminar (48px)
  const nameLeft = canDelete ? 'left-[88px]' : 'left-10'
  const tableWidth =
    COL_NUM + (canDelete ? COL_DELETE : 0) + COL_NAME + COL_JOB + COL_REGIME + COL_SHIFT + diasDelMes.length * COL_DAY + COL_TOTAL

  const periodo =
    dateRange?.start && dateRange?.end
      ? `${dateRange.start.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} al ${dateRange.end.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : `${meses[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`

  const modeHint = editMode
    ? 'Haz clic en las marcas guardadas para quitarlas.'
    : markMode
      ? `Haz clic en los días para marcar ${markMode === 'I' ? 'injustificadas' : 'justificadas'}.`
      : 'Elige un modo para marcar inasistencias en la tabla.'

  return (
    <div className={fitCard}>
      {/* Titulo del periodo y resumen */}
      <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-4">
        <div>
          <h3 className="m-0 text-[15px] font-semibold text-content">Inasistencias de servicio</h3>
          <p className="m-0 mt-0.5 text-[13px] text-muted">{periodo}</p>
        </div>
        <div className="flex items-center gap-5 text-[13px] text-muted">
          <span>
            <strong className="font-semibold text-content">{totalPersonas}</strong>{' '}
            {totalPersonas === 1 ? 'persona' : 'personas'}
          </span>
          <span>
            <strong className="font-semibold text-content">{Object.keys(savedMarks).length}</strong> marcadas
          </span>
        </div>
      </div>

      {totalPersonas === 0 ? (
        <div className="border-t border-line">
          <EmptyState
            title="No hay personas con inasistencias en este periodo"
            description="Agrega una inasistencia o cambia el periodo para ver el calendario."
          />
        </div>
      ) : (
        <>
          {/* Barra de modo y leyenda */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line px-5 py-3">
            {!isReadOnly ? (
              <div className="flex flex-wrap items-center gap-3">
                <div role="group" aria-label="Modo de marcado" className="inline-flex gap-0.5 rounded-lg bg-subtle p-0.5">
                  <button
                    type="button"
                    aria-pressed={markMode === 'I'}
                    className={cn(segBase, markMode === 'I' ? segActive : segIdle)}
                    onClick={() => handleToggleMark('I')}
                    title={markMode === 'I' ? 'Desactivar modo injustificada' : 'Activar modo injustificada'}
                  >
                    <span className="size-2 rounded-full bg-brand-red" aria-hidden />
                    Injustificada
                  </button>
                  <button
                    type="button"
                    aria-pressed={markMode === 'J'}
                    className={cn(segBase, markMode === 'J' ? segActive : segIdle)}
                    onClick={() => handleToggleMark('J')}
                    title={markMode === 'J' ? 'Desactivar modo justificada' : 'Activar modo justificada'}
                  >
                    <span className="size-2 rounded-full bg-brand-lime" aria-hidden />
                    Justificada
                  </button>
                </div>
                <span className="text-[13px] text-muted">{modeHint}</span>
              </div>
            ) : (
              <span className="text-[13px] text-muted">Vista de solo lectura.</span>
            )}

            {/* Leyenda: el texto acompana al color */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted" aria-label="Leyenda">
              <span className="inline-flex items-center gap-1.5">
                <span className={cn(legendMark, marcaJustificada)}>J</span>
                Justificada
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className={cn(legendMark, marcaInjustificada)}>I</span>
                Injustificada
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className={cn(legendMark, marcaInjustificada, marcaPendiente)} />
                Sin guardar
              </span>
            </div>
          </div>

          {/* Tabla calendario */}
          <div className="min-h-0 flex-1 overflow-auto border-t border-line">
            {/* Layout fijo: las columnas fijas miden exactamente lo que dicen sus desplazamientos (left-*),
                asi ninguna cubre a la siguiente; solo "Cargo" absorbe el ancho que sobre */}
            <table
              className="min-w-full table-fixed border-separate border-spacing-0"
              style={{ width: tableWidth }}
            >
              <colgroup>
                <col style={{ width: COL_NUM }} />
                {canDelete && <col style={{ width: COL_DELETE }} />}
                <col style={{ width: COL_NAME }} />
                <col style={{ width: COL_JOB }} />
                <col style={{ width: COL_REGIME }} />
                <col style={{ width: COL_SHIFT }} />
                {diasDelMes.map(dia => (
                  <col key={dia.fecha.getTime()} style={{ width: COL_DAY }} />
                ))}
                <col style={{ width: COL_TOTAL }} />
              </colgroup>
              <thead>
                <tr>
                  <th className={cn(th, thFixed, 'left-0 px-2 text-center')}>#</th>
                  {canDelete && <th className={cn(th, thFixed, 'left-10')}></th>}
                  <th className={cn(th, thFixed, nameLeft, 'border-r px-3 text-left')}>Apellidos y nombres</th>
                  <th className={cn(th, thSticky, 'px-3 text-left')}>Cargo</th>
                  <th className={cn(th, thSticky, 'px-3 text-left')}>Régimen</th>
                  <th className={cn(th, thSticky, 'px-3 text-left')}>Turno</th>
                  {diasDelMes.map(dia => (
                    <th
                      key={dia.fecha.getTime()}
                      className={cn(th, thSticky, 'px-0 text-center', esFinDeSemana(dia) && weekendCell, esHoy(dia) && todayCell)}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-medium text-muted">{dia.diaSemana}</span>
                        <span
                          className={cn(
                            'flex size-6 items-center justify-center rounded-full text-[13px] font-semibold',
                            esHoy(dia) ? 'bg-primary text-btn' : 'text-content'
                          )}
                        >
                          {dia.numero}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className={cn(th, thFixed, 'right-0 border-l px-3 text-center')}>Total</th>
                </tr>
              </thead>
              <tbody>
                {personasPaginadas.map((persona, index) => {
                  // Total de inasistencias de la persona: marcas guardadas + marcas temporales
                  const totalInasistencias = diasDelMes.reduce((count, dia) => {
                    const savedKey = `${persona.dni}-${dia.numero}`
                    const mes = dia.mes !== undefined ? dia.mes + 1 : selectedDate.getMonth() + 1
                    const anio = dia.anio !== undefined ? dia.anio : selectedDate.getFullYear()
                    const fullKey = `${persona.dni}-${dia.numero}-${mes}-${anio}`

                    if (savedMarks[savedKey] || tempMarks[fullKey]) {
                      return count + 1
                    }
                    return count
                  }, 0)

                  // Número de fila global (considerando la paginación)
                  const numeroFila = startIndex + index + 1

                  return (
                    <tr key={persona.dni} className={bodyRow}>
                      <td className={cn(td, bodyFixed, 'left-0 px-2 text-center text-muted')}>{numeroFila}</td>
                      {canDelete && (
                        <td className={cn(td, bodyFixed, 'left-10 px-2 text-center')}>
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
                      <td className={cn(td, bodyFixed, nameLeft, 'border-r border-line px-3 text-left whitespace-normal')}>
                        <div className="font-medium text-content">{persona.nombreCompleto}</div>
                        <div className="text-xs text-muted">DNI {persona.dni}</div>
                      </td>
                      <td className={cn(td, 'px-3 text-left whitespace-normal')}>
                        {persona.cargo}
                      </td>
                      <td className={cn(td, 'px-3 text-left')}>{persona.regimen}</td>
                      <td className={cn(td, 'px-3 text-left')}>{persona.turno}</td>
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

                        // Interaccion: celdas clicables, seleccionadas y editables
                        const clickable = !!(markMode || editMode)
                        const editable = editMode && !!savedMark

                        // Marca temporal o guardada; una celda vacia queda limpia (en modo marcado, al pasar el cursor
                        // muestra como quedaria la marca)
                        let content: React.ReactNode = null

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
                        } else if (markMode) {
                          content = (
                            <span
                              className={cn(
                                marcaBase,
                                'border border-dashed border-line-strong text-muted opacity-0 transition-opacity duration-150 group-hover/cell:opacity-100'
                              )}
                            >
                              {markMode}
                            </span>
                          )
                        }

                        return (
                          <td
                            key={dia.fecha.getTime()}
                            className={cn(
                              td,
                              'group/cell h-12 px-0 text-center',
                              esFinDeSemana(dia) && weekendCell,
                              esHoy(dia) && todayCell,
                              clickable && !editable && clickableDay,
                              editable && editableDay,
                              isSelected && selectedDay
                            )}
                            onClick={() => handleCellClick(persona.dni, dia.numero, mes, anio)}
                          >
                            {content}
                          </td>
                        )
                      })}
                      <td
                        className={cn(
                          td,
                          bodyFixed,
                          'right-0 border-l border-line px-3 text-center font-semibold',
                          totalInasistencias > 0 ? 'text-content' : 'text-muted'
                        )}
                      >
                        {totalInasistencias}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
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

          {/* Guardar / cancelar: solo si no es modo solo lectura */}
          {!isReadOnly && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-subtle px-5 py-3">
              <span className="text-[13px] text-muted" aria-live="polite">
                {pendingCount === 0
                  ? 'Sin cambios pendientes.'
                  : `${pendingCount} ${pendingCount === 1 ? 'cambio sin guardar' : 'cambios sin guardar'}.`}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleCancel} disabled={pendingCount === 0 && !markMode && !editMode}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={pendingCount === 0}>
                  Guardar cambios
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
