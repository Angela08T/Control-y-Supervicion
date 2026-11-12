import React, { useState, useMemo, useEffect } from 'react'
import {
  FiCalendar,
  FiCheckCircle,
  FiEdit3,
  FiEye,
  FiMousePointer,
  FiSave,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import { toast } from '../utils/toast'
import type { ID } from '@/types'
import { actionBtnDanger, cn, fitCard } from '@/utils/classes'
import Button from '@/components/UI/Button'
import { EmptyState } from '@/components/UI/EmptyState'
import Pagination from '@/components/UI/Pagination'
import { colorAvatar, iniciales } from '@/utils/incidenciaFormat'
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
const th = 'border-b border-line bg-subtle py-2.5 text-xs font-semibold whitespace-nowrap text-muted'
const thSticky = 'sticky top-0 z-10'
/** Cabecera de las columnas fijas (cruza el scroll en ambas direcciones) */
const thFixed = 'sticky top-0 z-20'

/** Celda del cuerpo: solo una linea fina debajo de cada fila */
const td = 'border-b border-line py-2 text-[13px] whitespace-nowrap text-content-2'

/** Columnas fijas del cuerpo: se mantienen al desplazar la tabla en horizontal */
const bodyFixed = 'sticky z-10 bg-surface transition-colors duration-150 group-hover:bg-card-hover'

/** Fila del cuerpo: solo cambia el fondo al pasar el cursor */
const bodyRow = 'group transition-colors duration-150 hover:bg-card-hover'

/** Sabado y domingo: fondo apenas azulado para leer la semana de un vistazo */
const weekendCell = 'bg-primary/4 dark:bg-primary/8'
/** Columna de hoy */
const todayCell = 'bg-primary/8 dark:bg-primary/15'
/** Separador de semana: linea antes de cada lunes */
const weekStart = 'border-l border-l-line'

/** Celda de dia clicable en modo marcado */
const clickableDay = 'cursor-pointer transition-colors duration-150 hover:bg-primary/12'

/** Celda de marca guardada en modo "quitar marcas" */
const editableDay = 'cursor-pointer transition-colors duration-150 hover:bg-warning/15'

/** Marca de falta: ficha con la letra; color lleno si esta guardada, borde punteado si falta guardar */
const marcaBase = 'inline-flex size-7 items-center justify-center rounded-lg text-xs font-bold transition-transform duration-150'
const marcaJustificada = 'bg-success text-white shadow-[0_3px_8px_-3px_rgba(111,154,20,0.7)] dark:text-[#14210a]'
const marcaInjustificada = 'bg-danger text-white shadow-[0_3px_8px_-3px_rgba(199,21,34,0.6)]'
const pendienteJustificada = 'border-2 border-dashed border-success bg-success/12 text-lime-ink'
const pendienteInjustificada = 'border-2 border-dashed border-danger bg-danger/10 text-red-ink'
/** Marca guardada elegida para quitar */
const marcaPorQuitar = 'scale-90 line-through opacity-45 ring-2 ring-warning ring-offset-2 ring-offset-surface'

/** Anchos de columna (px). "#" y eliminar deben coincidir con los `left-*` de las columnas fijas */
const COL_NUM = 40
const COL_DELETE = 48
const COL_NAME = 270
const COL_JOB = 170
const COL_REGIME = 110
const COL_SHIFT = 90
const COL_DAY = 42
const COL_TOTAL = 72

/** Muestra pequena de la marca, para la leyenda */
const legendMark = 'inline-flex size-5 items-center justify-center rounded-md text-[10px] font-bold'

/** Herramientas de marcado: cada una con su color cuando esta activa */
const toolBase =
  'inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-[13px] font-semibold transition-[background-color,border-color,color,box-shadow] duration-150'
const toolIdle = 'border-line bg-surface text-content-2 hover:border-line-strong hover:bg-subtle hover:text-content'
const toolActivo = {
  I: 'border-danger bg-danger text-white shadow-[0_8px_18px_-10px_rgba(199,21,34,0.9)]',
  J: 'border-success bg-success text-white shadow-[0_8px_18px_-10px_rgba(111,154,20,0.9)] dark:text-[#14210a]',
  E: 'border-warning bg-warning text-white shadow-[0_8px_18px_-10px_rgba(201,125,0,0.9)] dark:text-[#2a1a00]',
}
/** Aviso del modo activo, con el color de la herramienta */
const hintTono = {
  I: 'border-danger/30 bg-danger/6 text-red-ink',
  J: 'border-success/35 bg-success/10 text-lime-ink',
  E: 'border-warning/35 bg-warning/10 text-amber-ink',
}

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
  const [busqueda, setBusqueda] = useState('') // Buscador de personas (solo UI)
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
      // Desactivar modo edición si está activo (y descartar lo elegido para quitar)
      if (editMode) {
        setEditMode(false)
        setMarksToDelete([])
      }
    }
  }

  function handleToggleEdit() {
    setEditMode(!editMode)
    if (editMode) {
      // Si se desactiva el modo edición, limpiar selecciones y lo elegido para quitar
      setSelectedCells({})
      setMarksToDelete([])
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
    setMarksToDelete([])
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

  // Buscador de personas (nombre, DNI o cargo), sin importar tildes
  const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const filtro = normalizar(busqueda.trim())
  const personasFiltradas = filtro
    ? personasConInasistencias.filter(p => normalizar(`${p.nombreCompleto} ${p.dni} ${p.cargo}`).includes(filtro))
    : personasConInasistencias

  // Calcular paginación
  const totalPersonas = personasConInasistencias.length
  const totalFiltradas = personasFiltradas.length
  const totalPages = Math.ceil(totalFiltradas / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const personasPaginadas = personasFiltradas.slice(startIndex, endIndex)

  // Funciones de navegación de página
  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  // Dia de hoy (para resaltar su columna)
  const hoy = new Date()
  const esHoy = (dia: DiaCalendario) =>
    dia.fecha.getFullYear() === hoy.getFullYear() &&
    dia.fecha.getMonth() === hoy.getMonth() &&
    dia.fecha.getDate() === hoy.getDate()
  const esFinDeSemana = (dia: DiaCalendario) => dia.fecha.getDay() === 0 || dia.fecha.getDay() === 6
  const esLunes = (dia: DiaCalendario, i: number) => i > 0 && dia.fecha.getDay() === 1

  // Cambios que el usuario aun no guarda (marcas nuevas + marcas por quitar)
  const nuevas = Object.keys(tempMarks).length
  const pendingCount = nuevas + marksToDelete.length

  // Columnas fijas: "#" (40px) y, si hay eliminar, la columna de eliminar (48px)
  const nameLeft = canDelete ? 'left-[88px]' : 'left-10'
  const tableWidth =
    COL_NUM + (canDelete ? COL_DELETE : 0) + COL_NAME + COL_JOB + COL_REGIME + COL_SHIFT + diasDelMes.length * COL_DAY + COL_TOTAL

  const periodo =
    dateRange?.start && dateRange?.end
      ? `${dateRange.start.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} al ${dateRange.end.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : `${meses[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`

  const modoActivo: 'I' | 'J' | 'E' | null = editMode ? 'E' : markMode
  const modeHint =
    modoActivo === 'E'
      ? 'Toca las marcas guardadas que quieras quitar y luego pulsa «Guardar cambios».'
      : modoActivo
        ? `Toca los días de cada persona para marcarlos como ${modoActivo === 'I' ? 'injustificados' : 'justificados'}.`
        : null

  return (
    <div className={cn(fitCard, 'flex-1')}>
      {/* Titulo del periodo, resumen y buscador */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 max-sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary dark:bg-primary/25 dark:text-accent-light"
            aria-hidden
          >
            <FiCalendar />
          </span>
          <div className="min-w-0">
            <h3 className="m-0 text-[15px] font-semibold text-content">Calendario de inasistencias</h3>
            <p className="m-0 mt-0.5 text-[13px] text-muted">
              <span className="capitalize">{periodo}</span> · {totalPersonas} {totalPersonas === 1 ? 'persona' : 'personas'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
          {totalPersonas > 0 && (
            <div className="relative min-w-[220px] max-sm:min-w-0 max-sm:flex-1">
              <FiSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
              <input
                value={busqueda}
                onChange={e => {
                  setBusqueda(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Buscar persona o DNI"
                aria-label="Buscar persona por nombre, DNI o cargo"
                className="h-9 w-full rounded-xl border border-line-strong bg-surface pr-8 pl-9 text-sm text-content outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted hover:border-line-hover focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)]"
              />
              {busqueda && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setBusqueda('')}
                  className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-muted hover:bg-subtle hover:text-content"
                >
                  <FiX aria-hidden />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {totalPersonas === 0 ? (
        <div className="flex flex-1 flex-col justify-center border-t border-line">
          <EmptyState
            title="No hay personas con inasistencias en este periodo"
            description="Agrega una inasistencia o cambia el periodo para ver el calendario."
          />
        </div>
      ) : (
        <>
          {/* Herramientas de marcado y leyenda */}
          <div className="flex flex-col gap-3 border-t border-line px-5 py-3 max-sm:px-4">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              {!isReadOnly ? (
                <div role="toolbar" aria-label="Herramientas de marcado" className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-xs font-bold tracking-[0.1em] text-muted uppercase max-sm:hidden">Marcar</span>
                  <button
                    type="button"
                    aria-pressed={markMode === 'I'}
                    className={cn(toolBase, markMode === 'I' ? toolActivo.I : toolIdle)}
                    onClick={() => handleToggleMark('I')}
                  >
                    <span className={cn('size-2.5 rounded-full', markMode === 'I' ? 'bg-white' : 'bg-danger')} aria-hidden />
                    Injustificada
                  </button>
                  <button
                    type="button"
                    aria-pressed={markMode === 'J'}
                    className={cn(toolBase, markMode === 'J' ? toolActivo.J : toolIdle)}
                    onClick={() => handleToggleMark('J')}
                  >
                    <span className={cn('size-2.5 rounded-full', markMode === 'J' ? 'bg-white dark:bg-[#14210a]' : 'bg-success')} aria-hidden />
                    Justificada
                  </button>
                  <span className="mx-1 h-6 w-px bg-line max-sm:hidden" aria-hidden />
                  <button
                    type="button"
                    aria-pressed={editMode}
                    className={cn(toolBase, editMode ? toolActivo.E : toolIdle)}
                    onClick={handleToggleEdit}
                  >
                    <FiEdit3 aria-hidden />
                    Quitar marcas
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-lg bg-subtle px-3 py-1.5 text-[13px] text-content-2">
                  <FiEye aria-hidden className="text-muted" />
                  Vista de solo lectura
                </span>
              )}

              {/* Leyenda: el texto acompana al color */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted" aria-label="Leyenda">
                <span className="inline-flex items-center gap-1.5">
                  <span className={cn(legendMark, marcaInjustificada)}>I</span>
                  Injustificada
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className={cn(legendMark, marcaJustificada)}>J</span>
                  Justificada
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className={cn(legendMark, pendienteInjustificada, 'border')}>I</span>
                  Sin guardar
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-4 w-3 rounded-sm bg-primary/10 dark:bg-primary/20" aria-hidden />
                  Fin de semana
                </span>
              </div>
            </div>

            {modeHint && modoActivo && (
              <p
                className={cn(
                  'm-0 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] font-medium animate-[fadeInSoft_0.2s_ease-out]',
                  hintTono[modoActivo]
                )}
                aria-live="polite"
              >
                <FiMousePointer className="shrink-0" aria-hidden />
                {modeHint}
              </p>
            )}
          </div>

          {/* Tabla calendario */}
          <div className="min-h-0 flex-1 overflow-auto border-t border-line">
            {totalFiltradas === 0 ? (
              <EmptyState title="Nadie coincide con la búsqueda" description="Prueba con otro nombre, DNI o cargo." />
            ) : (
              /* Layout fijo: las columnas fijas miden exactamente lo que dicen sus desplazamientos (left-*),
                 asi ninguna cubre a la siguiente; solo "Cargo" absorbe el ancho que sobre */
              <table className="min-w-full table-fixed border-separate border-spacing-0" style={{ width: tableWidth }}>
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
                    <th className={cn(th, thFixed, nameLeft, 'border-r px-3 text-left')}>Personal</th>
                    <th className={cn(th, thSticky, 'px-3 text-left')}>Cargo</th>
                    <th className={cn(th, thSticky, 'px-3 text-left')}>Régimen</th>
                    <th className={cn(th, thSticky, 'px-3 text-left')}>Turno</th>
                    {diasDelMes.map((dia, i) => (
                      <th
                        key={dia.fecha.getTime()}
                        className={cn(
                          th,
                          thSticky,
                          'px-0 text-center',
                          esFinDeSemana(dia) && weekendCell,
                          esHoy(dia) && todayCell,
                          esLunes(dia, i) && weekStart
                        )}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn('text-[10px] font-semibold uppercase', esFinDeSemana(dia) ? 'text-muted/80' : 'text-muted')}>
                            {dia.diaSemana}
                          </span>
                          <span
                            className={cn(
                              'flex size-7 items-center justify-center rounded-lg text-[13px] font-bold tabular-nums',
                              esHoy(dia) ? 'bg-primary text-white shadow-[0_4px_10px_-4px_rgba(30,58,138,0.8)]' : 'text-content'
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
                        <td className={cn(td, bodyFixed, 'left-0 px-2 text-center text-xs text-muted tabular-nums')}>{numeroFila}</td>
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
                        <td className={cn(td, bodyFixed, nameLeft, 'border-r border-line px-3 text-left')}>
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className="flex size-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white"
                              style={{ background: colorAvatar(persona.dni || persona.nombreCompleto) }}
                              aria-hidden
                            >
                              {iniciales(persona.nombreCompleto, persona.dni)}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-content" title={persona.nombreCompleto}>
                                {persona.nombreCompleto || '—'}
                              </div>
                              <div className="text-xs text-muted tabular-nums">DNI {persona.dni}</div>
                            </div>
                          </div>
                        </td>
                        <td className={cn(td, 'truncate px-3 text-left')} title={persona.cargo}>
                          {persona.cargo}
                        </td>
                        <td className={cn(td, 'px-3 text-left')}>{persona.regimen}</td>
                        <td className={cn(td, 'px-3 text-left')}>
                          {persona.turno && persona.turno !== '-' ? (
                            <span className="inline-flex rounded-md bg-subtle px-2 py-0.5 text-xs font-semibold text-content-2">{persona.turno}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        {diasDelMes.map((dia, i) => {
                          // Key para savedMarks (simple)
                          const savedKey = `${persona.dni}-${dia.numero}`
                          // Key completa para tempMarks y selectedCells
                          const mes = dia.mes !== undefined ? dia.mes + 1 : selectedDate.getMonth() + 1
                          const anio = dia.anio !== undefined ? dia.anio : selectedDate.getFullYear()
                          const fullKey = `${persona.dni}-${dia.numero}-${mes}-${anio}`

                          const isSelected = selectedCells[fullKey]
                          const tempMark = tempMarks[fullKey]
                          const savedMark = savedMarks[savedKey]

                          // Interaccion: celdas clicables y editables
                          const clickable = !!(markMode || editMode)
                          const editable = editMode && !!savedMark

                          // Marca temporal o guardada; una celda vacia queda limpia (en modo marcado, al pasar el cursor
                          // muestra como quedaria la marca)
                          let content: React.ReactNode = null

                          if (tempMark) {
                            const esJustificada = tempMark.tipo === 'justificada'
                            content = (
                              <span
                                title={esJustificada ? 'Justificada (sin guardar)' : 'Injustificada (sin guardar)'}
                                className={cn(marcaBase, esJustificada ? pendienteJustificada : pendienteInjustificada)}
                              >
                                {esJustificada ? 'J' : 'I'}
                              </span>
                            )
                          } else if (savedMark) {
                            const esJustificada = savedMark.tipo === 'J'
                            content = (
                              <span
                                title={
                                  editMode && isSelected
                                    ? 'Se quitará al guardar'
                                    : esJustificada
                                      ? 'Justificada'
                                      : 'Injustificada'
                                }
                                className={cn(
                                  marcaBase,
                                  esJustificada ? marcaJustificada : marcaInjustificada,
                                  editMode && isSelected && marcaPorQuitar,
                                  editable && !isSelected && 'group-hover/cell:scale-110'
                                )}
                              >
                                {savedMark.tipo}
                              </span>
                            )
                          } else if (markMode) {
                            content = (
                              <span
                                className={cn(
                                  marcaBase,
                                  'border-2 border-dashed opacity-0 group-hover/cell:opacity-100',
                                  markMode === 'I' ? 'border-danger/60 text-red-ink' : 'border-success/70 text-lime-ink'
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
                                'group/cell h-14 px-0 text-center',
                                esFinDeSemana(dia) && weekendCell,
                                esHoy(dia) && todayCell,
                                esLunes(dia, i) && weekStart,
                                clickable && !editable && clickableDay,
                                editable && editableDay
                              )}
                              onClick={() => handleCellClick(persona.dni, dia.numero, mes, anio)}
                            >
                              {content}
                            </td>
                          )
                        })}
                        <td className={cn(td, bodyFixed, 'right-0 border-l border-line px-3 text-center')}>
                          <span
                            className={cn(
                              'inline-flex min-w-8 items-center justify-center rounded-lg px-2 py-1 text-[13px] font-bold tabular-nums',
                              totalInasistencias === 0
                                ? 'text-muted'
                                : totalInasistencias >= 3
                                  ? 'bg-danger/10 text-red-ink'
                                  : 'bg-subtle text-content'
                            )}
                            title={totalInasistencias >= 3 ? '3 o más inasistencias en el periodo' : undefined}
                          >
                            {totalInasistencias}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Controles de paginación */}
          {totalPages > 1 && (
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              total={totalFiltradas}
              from={startIndex + 1}
              to={Math.min(endIndex, totalFiltradas)}
              onPageChange={handlePageChange}
            />
          )}

          {/* Guardar / cancelar: solo si no es modo solo lectura */}
          {!isReadOnly && (
            <div
              className={cn(
                'flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-5 py-3 transition-colors duration-200 max-sm:px-4',
                pendingCount > 0 ? 'border-warning/40 bg-warning/10' : 'border-line bg-subtle'
              )}
            >
              <span className="flex items-center gap-2 text-[13px] text-content-2" aria-live="polite">
                {pendingCount === 0 ? (
                  <>
                    <FiCheckCircle className="shrink-0 text-muted" aria-hidden />
                    Sin cambios pendientes.
                  </>
                ) : (
                  <>
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-warning text-xs font-bold text-white tabular-nums dark:text-[#2a1a00]">
                      {pendingCount}
                    </span>
                    <span>
                      <strong className="font-semibold text-content">{pendingCount === 1 ? 'Cambio sin guardar' : 'Cambios sin guardar'}</strong>
                      {nuevas > 0 && ` · ${nuevas} ${nuevas === 1 ? 'marca nueva' : 'marcas nuevas'}`}
                      {marksToDelete.length > 0 && ` · ${marksToDelete.length} por quitar`}
                    </span>
                  </>
                )}
              </span>
              <div className="flex gap-2 max-sm:w-full max-sm:[&>*]:flex-1">
                <Button variant="ghost" onClick={handleCancel} disabled={pendingCount === 0 && !markMode && !editMode}>
                  Cancelar
                </Button>
                <Button icon={<FiSave />} onClick={handleSave} disabled={pendingCount === 0}>
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
