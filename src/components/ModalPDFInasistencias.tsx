import React, { useState, useEffect, useMemo } from 'react'
import { pdf } from '@react-pdf/renderer'
import { useAppSelector } from '../store/hooks'
import logoSJL from '../assets/logo-sjl.png'
import { getLeads } from '../api/lead'
import { getSubjects } from '../api/subject'
import { getLacks } from '../api/lack'
import { createAbsenceReport, getAttendances } from '../api/offender'
import InformePDFDocument from './PDFDocument'
import { toast } from '../utils/toast'
import type { CreateAbsenceDto, ID, Mode } from '@/types'
import { btnPrimary, btnSecondary, modalActions, modalBackdrop, modalClose, modalHeader } from '../utils/classes'

/** Texto o relación `{ name }`: el backend a veces devuelve un objeto y a veces un string. */
type TextOrNamed = string | { name?: string | null } | null

/** Personal (lead) tal como lo usa este modal; `title` y `job` no están en el tipo Lead del API. */
interface FormLead {
  id: ID
  title?: string
  name?: string
  lastname?: string
  job?: TextOrNamed
}

/** Asunto o falta para los selects: se lee `name` y, si no es string, `description`. */
interface OptionItem {
  id: ID
  name?: string | null
  description?: string | null
}

/** Fecha de inasistencia de una persona (campo `dates`). */
interface AttendanceDateItem {
  date: string | null
  mode?: string | null
  delete_at?: string | null
}

/** Persona con inasistencias, según lo que lee este modal. */
interface AttendancePerson {
  id?: ID
  dni: string
  name?: string
  lastname?: string
  fullname?: string
  job?: TextOrNamed
  regime?: TextOrNamed
  shift?: TextOrNamed
  jurisdiction?: TextOrNamed
  dates?: AttendanceDateItem[]
}

/** Campos de la respuesta de createAbsenceReport que lee este modal. */
interface AbsenceReportData {
  report_id?: string
}

interface AbsenceReportResponse {
  message?: string
  code?: string | null
  data?: AbsenceReportData
}

/** Forma del error que lee este modal al crear el reporte. */
interface ApiErrorLike {
  message?: string
  response?: { data?: { message?: string } }
}

interface DateRangeValue {
  start: Date
  end: Date
}

interface CcLead {
  name: string
  job: string
}

interface ReportResult {
  message: string
  data?: AbsenceReportData
  toLead: FormLead
  ccLeads: CcLead[]
}

interface PersonaResumen {
  dni: string
  nombreCompleto: string
  turno: TextOrNamed
  cargo: TextOrNamed
  regimen: TextOrNamed
  fechasArray: string[]
  justificadas: number
  injustificadas: number
  totalFaltas: number
}

interface PersonaConFechas extends PersonaResumen {
  fechas: string
}

export interface ModalPDFInasistenciasProps {
  onClose: () => void
  inasistencias?: unknown
  savedAttendances?: AttendancePerson[]
  dateRange?: DateRangeValue
  onReportCreated?: (data?: AbsenceReportData) => void
  /** Props que IncidenciasPage envia hoy pero este componente no lee (se conservan por compatibilidad) */
  incidencia?: unknown
  inasistenciasHistoricas?: unknown
  onSave?: () => void
}

// Función para formatear fechas
function formatearFecha(fecha: string | Date | null | undefined): string {
  if (!fecha) return 'Fecha no disponible'

  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

  let d: Date

  if (typeof fecha === 'string') {
    if (fecha.includes('/') || fecha.includes('-')) {
      const separator = fecha.includes('/') ? '/' : '-'
      const parts = fecha.split(separator)

      if (parts.length === 3) {
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const year = parseInt(parts[2], 10)
        const fullYear = year < 100 ? 2000 + year : year
        d = new Date(fullYear, month, day)
      } else {
        d = new Date(fecha)
      }
    } else {
      d = new Date(fecha)
    }
  } else {
    d = new Date(fecha)
  }

  if (isNaN(d.getTime())) {
    return `Fecha inválida (${fecha})`
  }

  return `${d.getDate()} de ${meses[d.getMonth()]} del ${d.getFullYear()}`
}

/** Etiqueta de cada campo del encabezado de configuración */
const topbarLabel = 'block mb-1 text-[0.75rem] font-bold text-muted'

/** Celdas de la tabla de datos del informe (CC, DE, ASUNTO) */
const informeLabelCell = 'py-2 pr-2.5 pl-0 font-bold align-top border-b border-[#eee]'
const informeValueCell = 'py-2 px-0 border-b border-[#eee]'

/** Celda con borde de la tabla de inasistencias */
const tablaCell = 'border border-black p-1'

export default function ModalPDFInasistencias({ onClose, inasistencias, savedAttendances, dateRange: initialDateRange, onReportCreated }: ModalPDFInasistenciasProps) {
  const { username } = useAppSelector((state) => state.auth)
  const [logoBase64, setLogoBase64] = useState('')
  const [generating, setGenerating] = useState(false)

  // Estados para el formulario del reporte
  const [leads, setLeads] = useState<FormLead[]>([])
  const [subjects, setSubjects] = useState<OptionItem[]>([])
  const [lacks, setLacks] = useState<OptionItem[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Estados del formulario
  const [selectedTo, setSelectedTo] = useState('')
  const [selectedCc, setSelectedCc] = useState<string[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedLack, setSelectedLack] = useState('')
  const [selectedMode, setSelectedMode] = useState<Mode>('UNJUSTIFIED')

  // Estado para el rango de fechas (editable en el modal)
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => {
    if (initialDateRange?.start && initialDateRange?.end) {
      return initialDateRange
    }
    // Valor por defecto: mes actual
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0)
    }
  })

  // Estado para mostrar resultado exitoso
  const [reportResult, setReportResult] = useState<ReportResult | null>(null)

  // Estado para los datos de inasistencias filtrados
  const [filteredAttendances, setFilteredAttendances] = useState<AttendancePerson[]>([])
  const [loadingAttendances, setLoadingAttendances] = useState(false)

  // Cargar datos para los selects
  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoadingData(true)
        setLoadError(null)

        // Cargar leads, subjects y lacks en paralelo
        const [leadsRes, subjectsRes, lacksRes] = await Promise.all([
          getLeads(1, 100),
          getSubjects(1, 100),
          getLacks(1, 100)
        ])

        // Extraer datos de las respuestas
        const leadsData: unknown = leadsRes.data?.data || leadsRes.data || []
        const subjectsData: unknown = subjectsRes.data?.data || subjectsRes.data || []
        const lacksData: unknown = lacksRes.data?.data || lacksRes.data || []

        setLeads(Array.isArray(leadsData) ? leadsData as FormLead[] : [])
        setSubjects(Array.isArray(subjectsData) ? subjectsData as OptionItem[] : [])
        setLacks(Array.isArray(lacksData) ? lacksData as OptionItem[] : [])

        // Buscar y preseleccionar el asunto de "conductas relacionadas con el cumplimiento del horario y asistencia"
        const subjectsArray: OptionItem[] = Array.isArray(subjectsData) ? subjectsData as OptionItem[] : []
        const defaultSubject = subjectsArray.find(s => {
          const name = typeof s.name === 'string' ? s.name.toLowerCase() : (s.description || '').toLowerCase()
          return name.includes('conductas') && name.includes('horario') && name.includes('asistencia')
        })
        if (defaultSubject) {
          setSelectedSubject(defaultSubject.id)
        }

        // Buscar y preseleccionar la falta de "inasistencia"
        const lacksArray: OptionItem[] = Array.isArray(lacksData) ? lacksData as OptionItem[] : []
        const defaultLack = lacksArray.find(l => {
          const name = typeof l.name === 'string' ? l.name.toLowerCase() : (l.description || '').toLowerCase()
          return name.includes('inasistencia')
        })
        if (defaultLack) {
          setSelectedLack(defaultLack.id)
        }
      } catch (error) {
        setLoadError('Error al cargar los datos del formulario. Por favor, intente nuevamente.')
      } finally {
        setLoadingData(false)
      }
    }

    loadFormData()
  }, [])

  // Convertir logo a base64
  useEffect(() => {
    const convertLogoToBase64 = async () => {
      try {
        const response = await fetch(logoSJL)
        const blob = await response.blob()
        const reader = new FileReader()
        reader.onloadend = () => {
          setLogoBase64(reader.result as string)
        }
        reader.readAsDataURL(blob)
      } catch (error) {
      }
    }

    convertLogoToBase64()
  }, [])

  // Cargar inasistencias filtradas cuando cambien dateRange o mode
  useEffect(() => {
    const loadFilteredAttendances = async () => {
      if (!dateRange?.start || !dateRange?.end) return

      setLoadingAttendances(true)
      try {
        // Formatear fechas para la API
        const startStr = `${dateRange.start.getFullYear()}-${String(dateRange.start.getMonth() + 1).padStart(2, '0')}-${String(dateRange.start.getDate()).padStart(2, '0')}`
        const endStr = `${dateRange.end.getFullYear()}-${String(dateRange.end.getMonth() + 1).padStart(2, '0')}-${String(dateRange.end.getDate()).padStart(2, '0')}`

        const result = await getAttendances(startStr, endStr, selectedMode)

        const attendancesData = result.data || []

        setFilteredAttendances(attendancesData)
      } catch (error) {
        setFilteredAttendances([])
      } finally {
        setLoadingAttendances(false)
      }
    }

    loadFilteredAttendances()
  }, [dateRange, selectedMode])

  // Manejar cambio de destinatario principal
  const handleToChange = (leadId: string): void => {
    setSelectedTo(leadId)
    // Si el lead seleccionado estaba en CC, quitarlo
    if (selectedCc.includes(leadId)) {
      setSelectedCc(prev => prev.filter(id => id !== leadId))
    }
  }

  // Manejar selección de CC (múltiple)
  const handleCcChange = (leadId: string): void => {
    setSelectedCc(prev => {
      if (prev.includes(leadId)) {
        return prev.filter(id => id !== leadId)
      } else {
        return [...prev, leadId]
      }
    })
  }

  // Procesar datos para el PDF
  const pdfData = useMemo<PersonaConFechas[]>(() => {
    const personasMap: Record<string, PersonaResumen> = {}

    // Verificar que savedAttendances sea un array válido
    if (!savedAttendances || !Array.isArray(savedAttendances)) {
      return []
    }

    // Procesar savedAttendances para obtener las fechas de inasistencia
    savedAttendances.forEach(person => {
      const dni = person.dni
      if (!personasMap[dni]) {
        personasMap[dni] = {
          dni: person.dni,
          nombreCompleto: person.name && person.lastname
            ? `${person.lastname} ${person.name}`.trim().toUpperCase()
            : person.fullname?.toUpperCase() || 'SIN NOMBRE',
          turno: person.shift || '-',
          cargo: person.job || '-',
          regimen: person.regime || '-',
          fechasArray: [],
          justificadas: 0,
          injustificadas: 0,
          totalFaltas: 0
        }
      }

      // Agregar fechas de inasistencia
      if (person.dates && Array.isArray(person.dates)) {
        person.dates.forEach(dateObj => {
          if (!dateObj.delete_at) {
            const date = new Date(dateObj.date as string)
            const dayStr = date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })
            personasMap[dni].fechasArray.push(dayStr)
            personasMap[dni].totalFaltas++

            if (dateObj.mode === 'JUSTIFIED') {
              personasMap[dni].justificadas++
            } else {
              personasMap[dni].injustificadas++
            }
          }
        })
      }
    })

    // Convertir a array y formatear fechas
    return Object.values(personasMap)
      .filter(p => p.totalFaltas > 0)
      .map(p => ({
        ...p,
        fechas: p.fechasArray.join(', ')
      }))
      .sort((a, b) => b.totalFaltas - a.totalFaltas)
  }, [savedAttendances])

  async function handleGeneratePDF(): Promise<void> {
    // Validar campos requeridos
    if (!selectedTo) {
      toast.warning('Debe seleccionar un destinatario principal')
      return
    }
    if (!selectedSubject) {
      toast.warning('Debe seleccionar un asunto')
      return
    }
    if (!selectedLack) {
      toast.warning('Debe seleccionar una falta')
      return
    }

    setGenerating(true)
    try {
      // Obtener datos del destinatario principal
      const toLead = leads.find(l => l.id === selectedTo)
      if (!toLead) {
        throw new Error('No se encontró el destinatario seleccionado')
      }

      // Obtener datos de los destinatarios en copia
      const ccLeads: CcLead[] = selectedCc.map((ccId): CcLead | null => {
        const lead = leads.find(l => l.id === ccId)
        if (!lead) return null
        // Asegurar que job sea string
        const jobValue = typeof lead.job === 'object' ? (lead.job?.name || '') : (lead.job || '')
        return {
          name: `${lead.title || ''} ${lead.name || ''} ${lead.lastname || ''}`.trim(),
          job: jobValue
        }
      }).filter((c): c is CcLead => c !== null)

      // Formatear fechas para la API
      if (!dateRange?.start || !dateRange?.end) {
        throw new Error('El rango de fechas no está definido')
      }
      const startStr = `${dateRange.start.getFullYear()}-${String(dateRange.start.getMonth() + 1).padStart(2, '0')}-${String(dateRange.start.getDate()).padStart(2, '0')}`
      const endStr = `${dateRange.end.getFullYear()}-${String(dateRange.end.getMonth() + 1).padStart(2, '0')}-${String(dateRange.end.getDate()).padStart(2, '0')}`

      // Asegurar que toLead.job sea string
      const toLeadJobValue = typeof toLead.job === 'object' ? (toLead.job?.name || '') : (toLead.job || '')

      // Construir payload para la API
      const reportData: CreateAbsenceDto = {
        header: {
          to: {
            name: `${toLead.title || ''} ${toLead.name || ''} ${toLead.lastname || ''}`.trim(),
            job: toLeadJobValue
          },
          cc: ccLeads
        },
        subject_id: selectedSubject,
        lack_id: selectedLack,
        mode: selectedMode,
        start: startStr,
        end: endStr
      }

      // Llamar a la API
      const response = (await createAbsenceReport(reportData)) as unknown as AbsenceReportResponse

      // Obtener el code del reporte de la respuesta (ejemplo: "042-2025")
      // createAbsenceReport ya devuelve response.data, por lo que response.code es el correcto
      const reportCode = response.code || '---'

      // Preparar datos para el PDF usando el formato que espera InformePDFDocument
      // Mapear inasistencias al formato de inasistenciasHistoricas
      const inasistenciasHistoricas = filteredAttendances
        .filter(person => {
          const validDates = person.dates?.filter(d => !d.delete_at && d.date)
          return validDates && validDates.length > 0
        })
        .flatMap(person => {
          // Crear una entrada por cada fecha de inasistencia
          const validDates = person.dates?.filter(d => !d.delete_at && d.date) || []
          return validDates.map(dateObj => ({
            nombreCompleto: person.name && person.lastname
              ? `${person.lastname} ${person.name}`.trim()
              : person.fullname || '-',
            cargo: typeof person.job === 'object' ? (person.job?.name || '-') : (person.job || '-'),
            regLab: typeof person.regime === 'object' ? (person.regime?.name || '-') : (person.regime || '-'),
            turno: typeof person.shift === 'object' ? (person.shift?.name || '-') : (person.shift || '-'),
            jurisdiccion: typeof person.jurisdiction === 'object' ? (person.jurisdiction?.name || '-') : (person.jurisdiction || '-'),
            fechaFalta: formatearFecha(dateObj.date),
            tipoInasistencia: selectedMode === 'UNJUSTIFIED' ? 'INJUSTIFICADA' : 'JUSTIFICADA'
          }))
        })

      // Obtener nombre del subject y lack seleccionados
      const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.name || 'Conductas relacionadas con el Cumplimiento del Horario y Asistencia'
      const selectedLackName = lacks.find(l => l.id === selectedLack)?.name || 'Inasistencia'

      // Preparar formData para el componente InformePDFDocument
      const formData = {
        numeroInforme: reportCode,
        destinatarioNombre: `${toLead.title || ''} ${toLead.name || ''} ${toLead.lastname || ''}`.trim(),
        destinatarioCargo: toLeadJobValue,
        fecha: new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }),
        falta: selectedLackName,
        tipoInasistencia: selectedMode === 'UNJUSTIFIED' ? 'INJUSTIFICADA' : 'JUSTIFICADA',
        descripcionAdicional: '', // Dejar vacío para usar el texto predeterminado
        imagenes: [], // No hay imágenes en reportes de inasistencias
        links: ''
      }

      // Preparar incidencia para el componente InformePDFDocument
      const incidencia = {
        asunto: 'Conductas relacionadas con el Cumplimiento del Horario y Asistencia',
        falta: selectedLackName,
        cc: ccLeads.map(c => c.name)
      }

      // Crear el documento PDF usando InformePDFDocument
      const doc = (
        <InformePDFDocument
          formData={formData}
          incidencia={incidencia}
          inasistenciasHistoricas={inasistenciasHistoricas}
          logoBase64={logoBase64}
          formatearFecha={formatearFecha}
        />
      )

      // Generar el blob del PDF
      const pdfBlob = await pdf(doc).toBlob()

      // Crear URL para descarga
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Reporte_Inasistencias_${reportCode}_${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Guardar el resultado para mostrarlo en el modal
      setReportResult({
        message: response.message || 'Creación exitosa',
        data: response.data,
        toLead: toLead,
        ccLeads: ccLeads
      })

      // Llamar al callback para notificar que se creó el reporte
      if (onReportCreated) {
        onReportCreated(response.data)
      }
    } catch (error) {
      const errorInfo = error as ApiErrorLike
      let errorMessage = 'Error al crear el reporte'
      if (errorInfo.response?.data?.message) {
        errorMessage = errorInfo.response.data.message
      } else if (errorInfo.message) {
        errorMessage = errorInfo.message
      }

      toast.error(errorMessage)
    } finally {
      setGenerating(false)
    }
  }

  const formatDateRange = () => {
    if (!dateRange?.start || !dateRange?.end) return ''
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
    const startStr = dateRange.start.toLocaleDateString('es-PE', options)
    const endStr = dateRange.end.toLocaleDateString('es-PE', options)
    return `${startStr} - ${endStr}`
  }

  // Calcular totales
  const totalInasistencias = pdfData.reduce((sum, person) => sum + (person.totalFaltas || 0), 0)
  const totalJustificadas = pdfData.reduce((sum, person) => sum + (person.justificadas || 0), 0)
  const totalInjustificadas = pdfData.reduce((sum, person) => sum + (person.injustificadas || 0), 0)

  // Obtener datos del lead seleccionado
  const selectedLeadData = leads.find(l => l.id === selectedTo)
  const selectedCcData = selectedCc.map(ccId => {
    const lead = leads.find(l => l.id === ccId)
    return lead ? `${lead.title || ''} ${lead.name || ''} ${lead.lastname || ''}`.trim() : ''
  }).filter(Boolean)

  // Obtener nombre del asunto seleccionado
  const selectedSubjectData = subjects.find(s => s.id === selectedSubject)
  const subjectName = selectedSubjectData
    ? (typeof selectedSubjectData.name === 'string' ? selectedSubjectData.name : (selectedSubjectData.description || ''))
    : ''

  return (
    <div className={modalBackdrop}>
      <div className="w-[750px] max-w-[750px] max-h-[90vh] max-[900px]:w-[95%] flex flex-col rounded-[20px] border border-[#e2e8f0] bg-white! shadow-[0_20px_60px_rgba(0,0,0,0.1)] animate-[modalSlideIn_0.4s_cubic-bezier(0.68,-0.55,0.265,1.55)]">
        <div className={modalHeader}>
          <h3 className="m-[18px] text-[20px] font-bold text-primary! [text-shadow:none]!">Crear Reporte de Inasistencias</h3>
          <button className={modalClose} onClick={onClose}>×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 max-h-[75vh] bg-white! text-black!">
          {loadingData ? (
            <div className="text-center p-10 text-muted">
              Cargando datos...
            </div>
          ) : loadError ? (
            <div className="text-center p-10 text-[#dc2626]">
              {loadError}
            </div>
          ) : (
            <>
              {/* Topbar de configuración */}
              <div className="mb-5 grid grid-cols-[1fr_1fr] gap-2.5 rounded-lg bg-surface p-[15px]">
                {/* Fila 1: Dirigido a y Con copia */}
                <div>
                  <label className={topbarLabel}>
                    Dirigido a:
                  </label>
                  <select
                    value={selectedTo}
                    onChange={(e) => handleToChange(e.target.value)}
                    className="w-full rounded py-1.5 px-2 border-none bg-transparent text-content text-[0.8rem]"
                  >
                    <option value="">Seleccione...</option>
                    {leads.map(lead => {
                      const leadName = `${lead.title || ''} ${lead.name || ''} ${lead.lastname || ''}`.trim()
                      return (
                        <option key={lead.id} value={lead.id}>{leadName}</option>
                      )
                    })}
                  </select>
                </div>

                <div>
                  <label className={topbarLabel}>
                    Con copia a:
                  </label>
                  <div className="max-h-[60px] overflow-y-auto rounded py-1 px-2 text-[0.75rem]">
                    {leads.filter(l => l.id !== selectedTo).map(lead => {
                      const leadName = `${lead.title || ''} ${lead.name || ''} ${lead.lastname || ''}`.trim()
                      return (
                        <label key={lead.id} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCc.includes(lead.id)}
                            onChange={() => handleCcChange(lead.id)}
                            className="size-3"
                          />
                          {leadName}
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Fila 2: Asunto y Falta (valores fijos) */}
                <div>
                  <label className={topbarLabel}>
                    Asunto:
                  </label>
                  <div className="w-full rounded py-1.5 px-2 text-content text-[0.75rem]">
                    Conductas relacionadas con el cumplimiento del horario y asistencia
                  </div>
                </div>

                <div>
                  <label className={topbarLabel}>
                    Falta:
                  </label>
                  <div className="w-full rounded py-1.5 px-2 text-content text-[0.8rem]">
                    Inasistencia
                  </div>
                </div>

                {/* Fila 3: Tipo de inasistencia y Rango de fechas */}
                <div>
                  <label className={topbarLabel}>
                    Tipo:
                  </label>
                  <div className="flex gap-[15px]">
                    <label className="flex items-center gap-1 cursor-pointer text-[0.8rem]">
                      <input
                        type="radio"
                        name="mode"
                        value="UNJUSTIFIED"
                        checked={selectedMode === 'UNJUSTIFIED'}
                        onChange={(e) => setSelectedMode(e.target.value as Mode)}
                      />
                      Injustificada
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer text-[0.8rem]">
                      <input
                        type="radio"
                        name="mode"
                        value="JUSTIFIED"
                        checked={selectedMode === 'JUSTIFIED'}
                        onChange={(e) => setSelectedMode(e.target.value as Mode)}
                      />
                      Justificada
                    </label>
                  </div>
                </div>

                <div>
                  <label className={topbarLabel}>
                    Rango de fechas:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={dateRange?.start ? `${dateRange.start.getFullYear()}-${String(dateRange.start.getMonth() + 1).padStart(2, '0')}-${String(dateRange.start.getDate()).padStart(2, '0')}` : ''}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value + 'T00:00:00')
                        setDateRange(prev => ({ ...prev, start: newDate }))
                      }}
                      className="w-[120px] rounded py-1 px-1.5 border-none bg-transparent text-content text-[0.75rem]"
                    />
                    <span className="text-[0.75rem] text-muted">a</span>
                    <input
                      type="date"
                      value={dateRange?.end ? `${dateRange.end.getFullYear()}-${String(dateRange.end.getMonth() + 1).padStart(2, '0')}-${String(dateRange.end.getDate()).padStart(2, '0')}` : ''}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value + 'T00:00:00')
                        setDateRange(prev => ({ ...prev, end: newDate }))
                      }}
                      className="w-[120px] rounded py-1 px-1.5 border-none bg-transparent text-content text-[0.75rem]"
                    />
                  </div>
                </div>
              </div>

              {/* Plantilla del informe */}
              <div className="bg-white p-[30px] rounded-lg border border-[#ddd] text-black [font-family:Times_New_Roman,serif]">
                {/* Encabezado con logo */}
                <div className="flex items-center mb-5 border-b-2 border-[#1e3a5f] pb-[15px]">
                  {logoBase64 && (
                    <img
                      src={logoBase64}
                      alt="Logo SJL"
                      className="size-15 mr-[15px]"
                    />
                  )}
                  <div className="flex-1 text-center">
                    <h3 className="m-0 text-[14px] font-bold text-[#1e3a5f]">
                      SAN JUAN DE LURIGANCHO
                    </h3>
                    <p className="m-[2px_0] text-[10px] italic text-[#666]">
                      es momento de crecer
                    </p>
                  </div>
                </div>

                {/* Año */}
                <p className="m-0 mb-5 text-center text-[10px] italic text-[#333]">
                  "Año de la recuperación y consolidación de la economía peruana"
                </p>

                {/* Número de informe */}
                <div className="mb-5 p-2.5 text-center bg-[#f8fafc] rounded">
                  <p className="m-0 text-[12px] font-bold">
                    INFORME N°
                  </p>
                  <p className="m-[5px_0_0_0] text-[11px] text-[#666]">
                    {reportResult?.data?.report_id || '---'}
                  </p>
                </div>

                {/* Datos del informe */}
                <table className="w-full mb-[15px] text-[11px] border-collapse">
                  <tbody>
                    <tr>
                      <td className={`w-20 ${informeLabelCell}`}>
                        A :
                      </td>
                      <td className={informeValueCell}>
                        {selectedLeadData ? (
                          <>
                            <strong>
                              {`${selectedLeadData.title || ''} ${selectedLeadData.name || ''} ${selectedLeadData.lastname || ''}`.trim()}
                            </strong>
                            <br />
                            <span className="text-[10px] text-[#666]">
                              {typeof selectedLeadData.job === 'string' ? selectedLeadData.job : ''}
                            </span>
                          </>
                        ) : (
                          <span className="text-[#999] italic">Seleccione un destinatario</span>
                        )}
                      </td>
                    </tr>

                    {selectedCcData.length > 0 && (
                      <tr>
                        <td className={informeLabelCell}>
                          CC :
                        </td>
                        <td className={informeValueCell}>
                          {selectedCcData.join(', ')}
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td className={informeLabelCell}>
                        DE :
                      </td>
                      <td className={`${informeValueCell} font-bold`}>
                        CONTROL Y SUPERVISIÓN
                      </td>
                    </tr>

                    <tr>
                      <td className={informeLabelCell}>
                        ASUNTO :
                      </td>
                      <td className={informeValueCell}>
                        {subjectName || <span className="text-[#999] italic">Seleccione un asunto</span>}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-2 pr-2.5 pl-0 font-bold align-top">
                        FECHA :
                      </td>
                      <td className="py-2 px-0">
                        {new Date().toLocaleDateString('es-PE', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Párrafo descriptivo */}
                <div className="mt-[15px] text-justify text-[10px] leading-[1.6]">
                  <p className="m-0 mb-2.5 indent-[40px]">
                    Tengo el agrado de dirigirme a Ud, con la finalidad de saludarlo, a la vez
                    informarle sobre el reporte de inasistencias al centro de labores del personal
                    de la Subgerencia de Serenazgo, correspondiente del turno{' '}
                    <strong>
                      {(() => {
                        // Obtener turnos únicos de los datos filtrados
                        const turnos = [...new Set(filteredAttendances.map(p => {
                          if (typeof p.shift === 'object') return p.shift?.name || ''
                          return p.shift || ''
                        }).filter(Boolean))]
                        if (turnos.length === 0) return 'MAÑANA / TARDE / NOCHE'
                        return turnos.join(' / ')
                      })()}
                    </strong>.
                    Durante el período{' '}
                    <strong>
                      {dateRange?.start?.toLocaleDateString('es-PE', { day: '2-digit' }) || '--'} al{' '}
                      {dateRange?.end ? dateRange.end.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase() : '--'}
                    </strong>
                    , se ha registrado un número significativo de inasistencias{' '}
                    <strong>{selectedMode === 'UNJUSTIFIED' ? 'injustificadas' : 'justificadas'}</strong>{' '}
                    por parte del personal mencionado.
                  </p>
                </div>

                {/* Tabla de inasistencias */}
                {loadingAttendances ? (
                  <div className="p-5 text-center text-[10px] text-[#666]">
                    Cargando inasistencias...
                  </div>
                ) : filteredAttendances.length === 0 ? (
                  <div className="mt-2.5 p-5 text-center text-[10px] italic text-[#666] bg-[#f8fafc] rounded">
                    No hay inasistencias registradas en el período seleccionado
                  </div>
                ) : (
                  <div className="mt-2.5 overflow-x-auto">
                    <table className="w-full border-collapse text-[8px] border border-black">
                      <thead>
                        <tr className="bg-[#f0f0f0]">
                          <th className={`${tablaCell} text-center`}>N°</th>
                          <th className={`${tablaCell} text-left`}>APELLIDOS Y NOMBRES</th>
                          <th className={`${tablaCell} text-center`}>CARGO</th>
                          <th className={`${tablaCell} text-center`}>REG. LAB.</th>
                          <th className={`${tablaCell} text-center`}>TURNO</th>
                          <th className={`${tablaCell} text-center`}>FECHA</th>
                          <th className={`${tablaCell} text-center`}>TIPO DE INASISTENCIA</th>
                          <th className={`${tablaCell} text-center`}>JURISDICCION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAttendances
                          .filter(person => {
                            // Filtrar solo personas que tengan fechas de inasistencias válidas
                            const validDates = person.dates?.filter(d => !d.delete_at && d.date)
                            return validDates && validDates.length > 0
                          })
                          .map((person, index) => {
                          // Obtener las fechas de inasistencia
                          const fechas = person.dates?.filter(d => !d.delete_at).map(d => {
                            const date = new Date(d.date as string)
                            return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          }).join(', ') || '-'

                          // Manejar campos que pueden ser objetos
                          const jobValue = typeof person.job === 'object' ? (person.job?.name || '-') : (person.job || '-')
                          const regimeValue = typeof person.regime === 'object' ? (person.regime?.name || '-') : (person.regime || '-')
                          const shiftValue = typeof person.shift === 'object' ? (person.shift?.name || '-') : (person.shift || '-')
                          const jurisdictionValue = typeof person.jurisdiction === 'object' ? (person.jurisdiction?.name || '-') : (person.jurisdiction || '-')

                          return (
                            <tr key={person.id || index}>
                              <td className={`${tablaCell} text-center`}>{index + 1}</td>
                              <td className={tablaCell}>
                                {person.name && person.lastname
                                  ? `${person.lastname} ${person.name}`.toUpperCase()
                                  : person.fullname?.toUpperCase() || '-'}
                              </td>
                              <td className={`${tablaCell} text-center`}>
                                {jobValue}
                              </td>
                              <td className={`${tablaCell} text-center`}>
                                {regimeValue}
                              </td>
                              <td className={`${tablaCell} text-center`}>
                                {shiftValue}
                              </td>
                              <td className={`${tablaCell} text-center text-[7px]`}>
                                {fechas}
                              </td>
                              <td className={`${tablaCell} text-center`}>
                                {selectedMode === 'UNJUSTIFIED' ? 'INJUSTIFICADA' : 'JUSTIFICADA'}
                              </td>
                              <td className={`${tablaCell} text-center`}>
                                {jurisdictionValue}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Mensaje de éxito si existe */}
                {reportResult && (
                  <div className="mt-[15px] p-2.5 bg-[#d1fae5] rounded text-center text-[11px] text-[#059669]">
                    ✓ {reportResult.message}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className={modalActions}>
          {reportResult ? (
            <button className={btnPrimary} onClick={onClose}>
              Cerrar
            </button>
          ) : (
            <>
              <button className={btnSecondary} onClick={onClose} disabled={generating}>
                Cancelar
              </button>
              <button
                className={btnPrimary}
                onClick={handleGeneratePDF}
                disabled={generating || loadingData || !!loadError || !selectedTo || !selectedSubject || !selectedLack}
              >
                {generating ? 'Creando...' : 'Crear Reporte'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
