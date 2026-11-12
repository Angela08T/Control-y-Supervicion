import React, { useEffect, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import CalendarioInasistencias from '../../components/CalendarioInasistencias'
import ModalInasistencia from '../../components/ModalInasistencia'
import DateRangeModal from '../Dashboard/components/DateRangeModal'
import { createReport, getReports, mapFormDataToAPI } from '../../api/report'
import { createOffender, mapFormDataToOffenderAPI, getOffenders, createAttendances, getAttendances, deleteAttendance, deleteOffender } from '../../api/offender'
import { getModulePermissions } from '../../utils/permissions'
import { FiAlertCircle, FiCalendar, FiCheckCircle, FiChevronDown, FiClock, FiFileText, FiPlus, FiUsers } from 'react-icons/fi'
import { initSocket, onReportStatusChanged, disconnectSocket } from '../../services/websocket'
import ModalPDFInasistencias from '../../components/ModalPDFInasistencias'
import { toast } from '../../utils/toast'
import type { AttendanceItemDto, ID, ISODateString, Lead } from '@/types'
import { cardClass, cn, fitPage } from '../../utils/classes'
import Button from '@/components/UI/Button'
import { LoadingState } from '@/components/UI/EmptyState'

/** Fila de asistencia tal como la devuelve GET /attendance */
type AttendanceRow = Awaited<ReturnType<typeof getAttendances>>['data'][number]

/** Datos del formulario de inasistencia que consume mapFormDataToOffenderAPI */
type AttendanceFormInput = Parameters<typeof mapFormDataToOffenderAPI>[0]

/** Fila de la tabla de inasistencias (formato mapeado en el front) */
interface InasistenciaRow {
  id: ID | undefined
  dni: string
  nombreCompleto: string | null
  turno: string | null
  cargo: string | null
  regLab: string | null
  subgerencia: string | null
  asunto: string
  falta: string
  fechaIncidente: null
  createdAt?: ISODateString
  updatedAt?: ISODateString
}

/** Rango de fechas seleccionado en el calendario */
interface DateRange {
  start: Date
  end: Date
}

/** Marca de falta enviada desde CalendarioInasistencias */
interface AttendanceMark {
  dni: string
  dia: number
  mes: number
  anio: number
  tipo: string
}

/** Forma minima de un error de axios usada para leer el mensaje del backend */
interface RequestError {
  message?: string
  response?: {
    status?: number
    data?: { message?: string | string[] }
  }
}

export default function InasistenciasPage() {
  const { role: userRole } = useAppSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'inasistencias')

  const [inasistencias, setInasistencias] = useState<InasistenciaRow[]>([])
  const [showModal, setShowModal] = useState<boolean>(false)
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false)
  const [showPDFModal, setShowPDFModal] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [savedAttendances, setSavedAttendances] = useState<AttendanceRow[]>([]) // Inasistencias guardadas desde la API
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date()) // Mes actual del calendario

  // Estado para el rango de fechas (por defecto: mes actual)
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    return { start, end }
  })

  // WebSocket: Escuchar cambios de estado de reportes en tiempo real
  useEffect(() => {
    initSocket()

    const unsubscribe = onReportStatusChanged((data) => {
      setRefreshTrigger(prev => prev + 1)
    })

    return () => {
      unsubscribe()
      disconnectSocket()
    }
  }, [])

  // Cargar inasistencias desde la API de attendance con rango de fechas
  useEffect(() => {
    async function fetchInasistencias() {
      setLoading(true)
      try {
        // Formatear fechas para la API
        const startStr = `${dateRange.start.getFullYear()}-${String(dateRange.start.getMonth() + 1).padStart(2, '0')}-${String(dateRange.start.getDate()).padStart(2, '0')}`
        const endStr = `${dateRange.end.getFullYear()}-${String(dateRange.end.getMonth() + 1).padStart(2, '0')}-${String(dateRange.end.getDate()).padStart(2, '0')}`

        const result = await getAttendances(startStr, endStr)

        // Extraer los datos del response
        const attendancesData = result.data || []

        // Mapear los datos de attendances al formato esperado por la tabla
        const inasistenciasData: InasistenciaRow[] = attendancesData.map(person => ({
          id: person.id || person.offender_id,
          dni: person.dni,
          nombreCompleto: person.name && person.lastname
            ? `${person.name} ${person.lastname}`.trim()
            : person.fullname || null,
          turno: person.shift || null,
          cargo: person.job || null,
          regLab: person.regime || null,
          subgerencia: person.subgerencia || (typeof person.jurisdiction === 'object' ? person.jurisdiction?.name : person.jurisdiction) || null,
          asunto: 'Inasistencia',
          falta: 'Inasistencia',
          fechaIncidente: null,
          createdAt: person.created_at,
          updatedAt: person.updated_at
        }))

        setInasistencias(inasistenciasData)

        // También actualizar savedAttendances con los mismos datos
        setSavedAttendances(attendancesData)
      } catch (error) {
        const apiError = error as RequestError

        // Mostrar mensaje de error más específico
        let errorMessage = 'No se pudieron cargar las inasistencias'
        if (apiError.response?.status === 404) {
          errorMessage = 'No hay inasistencias registradas aún'
          setInasistencias([])
          setSavedAttendances([])
        } else if (apiError.message) {
          errorMessage += ': ' + apiError.message
        }

        // No mostrar alert si es 404 (no hay datos)
        if (apiError.response?.status !== 404) {
          toast.error(errorMessage)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchInasistencias()
  }, [refreshTrigger, dateRange])

  // Función para manejar la selección de rango de fechas desde el modal
  function handleDateRangeSelect(start: Date | null, end: Date | null) {
    if (start) setDateRange({ start, end: end ?? start })
    setShowCalendarModal(false)
  }

  // Formatear rango de fechas para mostrar
  function formatDateRange(): string {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
    const startStr = dateRange.start.toLocaleDateString('es-PE', options)
    const endStr = dateRange.end.toLocaleDateString('es-PE', options)
    return `${startStr} - ${endStr}`
  }

  // Crear inasistencia
  async function handleCreate(data: AttendanceFormInput, allLeads: Lead[] = []) {
    try {
      // 🔹 NUEVO: Usar endpoint de offender para inasistencias
      const offenderData = mapFormDataToOffenderAPI(data)
      const response = await createOffender(offenderData)

      toast.success('Inasistencia creada exitosamente')

      setShowModal(false)

      // Esperar un momento antes de recargar para asegurar que la API procesó el cambio
      setTimeout(() => {
        setRefreshTrigger(prev => {
          return prev + 1
        })
      }, 500)
    } catch (error) {
      const apiError = error as RequestError

      let errorMessage = 'Error al crear la inasistencia'

      if (apiError.response?.data?.message) {
        if (Array.isArray(apiError.response.data.message)) {
          errorMessage = 'Errores de validación:\n' + apiError.response.data.message.join('\n')
        } else {
          errorMessage = apiError.response.data.message
        }
      } else if (apiError.message) {
        errorMessage = apiError.message
      }

      toast.error(errorMessage)
    }
  }

  async function handleSaveMarks(marks: AttendanceMark[]) {
    // Guardar las marcas de falta seleccionadas en la API usando /api/attendance

    if (!marks || marks.length === 0) {
      toast.info('No hay marcas para guardar')
      return
    }

    try {
      // Agrupar marcas por offender_id (DNI)
      const groupedByOffender: Record<string, AttendanceItemDto[]> = {}

      for (const mark of marks) {
        // Buscar información del offender en las inasistencias
        const offenderInfo = inasistencias.find(i => i.dni === mark.dni)

        if (!offenderInfo) {
          continue
        }

        // Usar el ID del offender (puede ser id o gestionate_id)
        const offenderId = offenderInfo.id

        if (!offenderId) {
          continue
        }

        // Formatear la fecha en formato YYYY-MM-DD
        const date = `${mark.anio}-${String(mark.mes).padStart(2, '0')}-${String(mark.dia).padStart(2, '0')}`

        // Determinar el modo (JUSTIFIED o UNJUSTIFIED)
        const mode = mark.tipo === 'justificada' ? 'JUSTIFIED' : 'UNJUSTIFIED'

        // Agrupar por offender_id
        if (!groupedByOffender[offenderId]) {
          groupedByOffender[offenderId] = []
        }

        groupedByOffender[offenderId].push({ date, mode })
      }

      // Construir el payload para la API
      const items = Object.keys(groupedByOffender).map(offenderId => ({
        offender_id: offenderId,
        attendances: groupedByOffender[offenderId]
      }))

      const payload = { items }

      // Enviar a la API
      const response = await createAttendances(payload)

      // Verificar la respuesta
      const count = response.data?.count || 0

      if (count > 0 || response.message?.includes('exitosa')) {
        toast.success(`Se guardaron ${count} inasistencia(s) exitosamente`)
        setRefreshTrigger(prev => prev + 1)
      } else {
        toast.info('No se pudieron guardar las inasistencias. Verifica los datos.')
      }
    } catch (error) {
      const apiError = error as RequestError

      let errorMessage = 'Error al guardar las inasistencias'
      if (apiError.response?.data?.message) {
        // El backend envía texto aquí; se conserva el valor tal cual (sin cambiar el comportamiento)
        errorMessage = apiError.response.data.message as string
      } else if (apiError.message) {
        errorMessage = apiError.message
      }

      toast.error(errorMessage)
    }
  }

  async function handleDelete(offenderId?: ID | null, nombre?: string | null) {
    if (!offenderId) {
      toast.warning('No se pudo identificar a la persona')
      return
    }
    const confirmMsg = nombre
      ? `¿Eliminar a ${nombre} del registro de inasistencias?`
      : '¿Eliminar esta persona del registro de inasistencias?'
    if (!window.confirm(confirmMsg)) return
    try {
      await deleteOffender(offenderId)
      toast.success('Persona eliminada correctamente')
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      const apiError = error as RequestError
      toast.error((apiError.response?.data?.message as string | undefined) || 'Error al eliminar la persona')
    }
  }

  // Manejar cambio de mes en el calendario
  function handleMonthChange(newMonth: Date) {
    setCurrentMonth(newMonth)
  }

  // Eliminar marcas (attendances) en modo edición
  async function handleDeleteMarks(marksToDelete: ID[]) {
    if (!marksToDelete || marksToDelete.length === 0) {
      toast.info('No hay marcas para eliminar')
      return
    }

    try {
      // Eliminar cada marca
      for (const markId of marksToDelete) {
        await deleteAttendance(markId)
      }

      toast.info(`Se eliminaron ${marksToDelete.length} marca(s) exitosamente`)
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      const apiError = error as RequestError

      let errorMessage = 'Error al eliminar las marcas'
      if (apiError.response?.data?.message) {
        // El backend envía texto aquí; se conserva el valor tal cual (sin cambiar el comportamiento)
        errorMessage = apiError.response.data.message as string
      } else if (apiError.message) {
        errorMessage = apiError.message
      }

      toast.error(errorMessage)
    }
  }

  // Resumen del periodo para las tarjetas del encabezado
  const personasRegistradas = new Set(inasistencias.map(i => i.dni)).size
  const fechasValidas = savedAttendances.flatMap(p => (p.dates ?? []).filter(d => !d.delete_at && d.date))
  const injustificadas = fechasValidas.filter(d => d.mode !== 'JUSTIFIED').length
  const justificadas = fechasValidas.length - injustificadas
  const personasConFaltas = savedAttendances.filter(p => (p.dates ?? []).some(d => !d.delete_at && d.date)).length
  const diasPeriodo = Math.round((dateRange.end.getTime() - dateRange.start.getTime()) / 86400000) + 1

  const resumen = [
    {
      label: 'Personal registrado',
      value: personasRegistradas,
      detail: `${personasConFaltas} con faltas en el periodo`,
      icon: <FiUsers />,
      tone: 'bg-primary/10 text-primary dark:bg-primary/25 dark:text-accent-light',
    },
    {
      label: 'Injustificadas',
      value: injustificadas,
      detail: fechasValidas.length ? `${Math.round((injustificadas / fechasValidas.length) * 100)}% del total` : 'Sin registros',
      icon: <FiAlertCircle />,
      tone: 'bg-danger/10 text-red-ink',
    },
    {
      label: 'Justificadas',
      value: justificadas,
      detail: fechasValidas.length ? `${Math.round((justificadas / fechasValidas.length) * 100)}% del total` : 'Sin registros',
      icon: <FiCheckCircle />,
      tone: 'bg-success/12 text-lime-ink',
    },
    {
      label: 'Días del periodo',
      value: diasPeriodo,
      detail: formatDateRange(),
      icon: <FiClock />,
      tone: 'bg-warning/12 text-amber-ink',
    },
  ]

  return (
    <div className={fitPage}>
      {/* Encabezado como el de Incidencias: titulo grande a la izquierda, periodo y acciones a la derecha */}
      <header className="mb-4 flex shrink-0 flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold tracking-[0.14em] text-primary/70 uppercase dark:text-accent-light">Operación · Asistencia</p>
          <h2 className="m-0 mt-0.5 text-[30px] leading-tight font-bold tracking-[-0.02em] text-ink dark:text-content">Inasistencias</h2>
          <p className="m-0 mt-1 text-sm text-content-2">Registra y revisa las inasistencias del personal por día.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Periodo: boton grande con el rango, abre el selector con atajos */}
          <button
            type="button"
            onClick={() => setShowCalendarModal(true)}
            className="group inline-flex h-10 cursor-pointer items-center gap-2.5 rounded-xl border border-line-strong bg-surface pr-3 pl-1.5 text-left transition-[border-color,box-shadow] duration-150 hover:border-accent hover:shadow-[0_0_0_3px_var(--focus-ring)]"
            aria-label={`Cambiar periodo: ${formatDateRange()}`}
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm text-white" aria-hidden>
              <FiCalendar />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold tracking-[0.1em] text-muted uppercase">Periodo</span>
              <span className="text-[13px] font-semibold text-content tabular-nums">{formatDateRange()}</span>
            </span>
            <FiChevronDown className="text-muted transition-transform group-hover:translate-y-0.5" aria-hidden />
          </button>
          {userRole === 'validator' && (
            <Button variant="secondary" icon={<FiFileText />} onClick={() => setShowPDFModal(true)}>
              Generar PDF
            </Button>
          )}
          {permissions.canCreate && (
            <Button icon={<FiPlus />} onClick={() => setShowModal(true)}>
              Agregar inasistencia
            </Button>
          )}
        </div>
      </header>

      {/* Resumen del periodo */}
      <div className="mb-4 grid shrink-0 grid-cols-4 gap-3 max-lg:grid-cols-2 max-[420px]:grid-cols-1">
        {resumen.map(r => (
          <div
            key={r.label}
            className="flex items-center gap-3.5 rounded-2xl border border-[#d3dceb] bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgba(12,26,75,0.06),0_12px_28px_-14px_rgba(12,26,75,0.28)] dark:border-line"
          >
            <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl text-xl', r.tone)} aria-hidden>
              {r.icon}
            </span>
            <div className="min-w-0">
              <p className="m-0 truncate text-[13px] font-medium text-content-2">{r.label}</p>
              <p className="m-0 text-[24px] leading-tight font-bold tracking-[-0.02em] text-ink tabular-nums dark:text-content">
                {loading ? '—' : r.value}
              </p>
              <p className="m-0 truncate text-xs text-muted" title={r.detail}>{r.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className={cn(cardClass, 'flex-1 justify-center')}>
          <LoadingState label="Cargando inasistencias…" />
        </div>
      ) : (
        <CalendarioInasistencias
          inasistencias={inasistencias}
          savedAttendances={savedAttendances}
          onSave={handleSaveMarks}
          onDelete={handleDelete}
          onDeleteMarks={handleDeleteMarks}
          onMonthChange={handleMonthChange}
          dateRange={dateRange}
          isReadOnly={userRole === 'validator'}
          canDelete={userRole === 'admin'}
        />
      )}

      {showModal && (
        <ModalInasistencia
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
        />
      )}

      {showCalendarModal && (
        <DateRangeModal
          onClose={() => setShowCalendarModal(false)}
          onApply={handleDateRangeSelect}
          initialStart={dateRange.start}
          initialEnd={dateRange.end}
        />
      )}

      {showPDFModal && (
        <ModalPDFInasistencias
          onClose={() => setShowPDFModal(false)}
          inasistencias={inasistencias}
          savedAttendances={savedAttendances}
          dateRange={dateRange}
          onReportCreated={() => {
            // Forzar recarga de datos cuando se crea un reporte
            setRefreshTrigger(prev => prev + 1)
          }}
        />
      )}
    </div>
  )
}
