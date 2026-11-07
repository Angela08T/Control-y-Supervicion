import React, { useState, useEffect } from 'react'
import { pdf } from '@react-pdf/renderer'
import { useAppSelector } from '@/store/hooks'
import logoSJL from '../assets/logo-sjl.png'
import { trackPDFDownload } from '../utils/storage'
import { getReportWithEvidences, updateReportWithEvidences, getEvidenceImageUrl, deleteEvidence } from '../api/report'
import { getAttendances } from '../api/offender'
import InformePDFDocument from './PDFDocument'
import { toast } from '../utils/toast'
import { cn } from '../utils/classes'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import { Field, Input, Textarea } from '@/components/UI/Field'
import { FiDownload, FiLoader, FiUpload, FiX } from 'react-icons/fi'
import type { ID, Incidencia, ReportWithEvidences } from '@/types'

/** Imagen de evidencia del formulario: existente en el backend o nueva (aun sin subir). */
interface ImagenInforme {
  id?: ID
  name: string
  url: string
  base64: string
  anexo: string
  file?: File
  isExisting: boolean
}

/** Campos del estado formData del modal. */
interface InformeFormData {
  numeroInforme: string
  destinatarioCargo: string
  destinatarioNombre: string
  fecha: string
  horaIncidente: string
  fechaIncidente: string
  ubicacion: string
  jurisdiccion: string
  sereno: string
  dni: string
  cargo: string
  regLab: string
  turno: string
  nombreCompleto: string
  falta: string
  articulo: string
  bodycam: string
  bodycamAsignadaA: string
  tipoMedio: string
  numeroCamara: string
  supervisor: string
  descripcionAdicional: string
  tipoInasistencia: string
  fechaFalta: string
  imagenes: ImagenInforme[]
  links: string
}

/** Incidencia tal como la recibe el modal; `fechaFalta` se lee aunque Incidencia no lo declare. */
type IncidenciaInforme = Incidencia & { fechaFalta?: string | null }

/** Fila de inasistencia historica que consume PDFDocument. */
interface InasistenciaHistorica {
  nombreCompleto: string
  cargo: string
  regLab: string
  turno: string
  jurisdiccion: string
  fechaFalta?: string | null
  tipoInasistencia?: string | null
}

/** Valor que puede venir como texto o como objeto con `name` (campos de GET /attendance). */
interface NamedValue {
  name?: string | null
}

/** Fecha de inasistencia de una persona; `dates` no esta declarado en la API de attendance. */
interface AttendanceDateRow {
  date?: string | null
  mode?: string | null
  delete_at?: string | null
}

/** Persona de GET /attendance tal como la usa el componente. */
interface AttendancePersonRow {
  id?: ID
  name?: string
  lastname?: string
  fullname?: string
  job?: string | NamedValue | null
  regime?: string | NamedValue | null
  shift?: string | NamedValue | null
  jurisdiction?: string | NamedValue | null
  dates?: AttendanceDateRow[]
}

/** getReportWithEvidences devuelve `link`, que no esta declarado en Report. */
type ReportWithEvidencesConLink = ReportWithEvidences & { link?: string | null }

/** Forma minima del error de axios que lee el componente. */
interface ApiErrorLike {
  response?: { data?: { message?: string | string[] } }
}

export interface ModalPDFInformeProps {
  incidencia: IncidenciaInforme
  inasistenciasHistoricas?: InasistenciaHistorica[]
  onClose: () => void
  onSave?: () => void
}

function formatearFecha(fecha: string | number | Date | null | undefined): string {
  if (!fecha) return 'Fecha no disponible'

  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

  let d: Date

  // Intentar diferentes formatos de fecha
  // 1. Si es un string, verificar si es formato DD/MM/YYYY o DD-MM-YYYY
  if (typeof fecha === 'string') {
    // Formato DD/MM/YYYY o DD-MM-YYYY
    if (fecha.includes('/') || fecha.includes('-')) {
      const separator = fecha.includes('/') ? '/' : '-'
      const parts = fecha.split(separator)

      // Si tiene 3 partes, asumir DD/MM/YYYY o DD-MM-YYYY
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // Los meses en JS son 0-indexados
        const year = parseInt(parts[2], 10)

        // Si el año es de 2 dígitos, asumirlo como 20XX
        const fullYear = year < 100 ? 2000 + year : year

        d = new Date(fullYear, month, day)
      } else {
        // Intentar crear Date normalmente
        d = new Date(fecha)
      }
    } else {
      // Intentar crear Date normalmente (ISO format, etc)
      d = new Date(fecha)
    }
  } else {
    // Si es Date object o timestamp
    d = new Date(fecha)
  }

  // Verificar si la fecha es válida
  if (isNaN(d.getTime())) {
    return `Fecha inválida (${fecha})`
  }

  return `${d.getDate()} de ${meses[d.getMonth()]} del ${d.getFullYear()}`
}

function obtenerHoraFormateada(hora: string | null | undefined): string {
  if (!hora) return ''
  const [h, m] = hora.split(':')
  return `${h}:${m}`
}

const articulosPorFalta: Record<string, string> = {
  'Dormir en horario laboral': '68.12',
  'Comer en horario laboral': '68.15',
  'Jugar en horario laboral': '68.18',
  'Abandono injustificado del puesto': '70.05',
  'Abandono temporal reiterado': '70.08',
  'Negativa a cumplir funciones asignadas': '70.12',
  'Inasistencia prolongada sin aviso': '72.03',
  'Llegó fuera de horario': '72.06'
}

/* Clases del formulario del informe. El documento final se genera aparte (PDFDocument), asi que aqui
   se usa el mismo estilo que el resto de los formularios. */

/** Bloque de datos que vienen del sistema y no se editan */
const readBlock = 'm-0 grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg bg-subtle p-4 max-md:grid-cols-1'
/** Aviso del numero de informe antes de la aprobacion */
const pendingCode = 'rounded-lg border border-dashed border-line-strong bg-subtle px-3 py-2 text-sm text-muted'
/** Zona para adjuntar imagenes (el input nativo va oculto) */
const uploadBox =
  'flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-line-strong bg-subtle px-4 py-3 text-sm text-content-2 transition-colors duration-150 hover:border-accent focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus-ring)]'
const removeImgBtn =
  'absolute -top-2 -right-2 flex size-6 cursor-pointer items-center justify-center rounded-full border border-line bg-surface p-0 text-sm text-muted shadow-[0_1px_3px_rgba(15,23,42,0.15)] transition-colors duration-150 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50'

/** Tabla del reporte de inasistencias */
const th = 'border-b border-line bg-subtle px-3 py-2 text-xs font-medium whitespace-nowrap text-muted'
const td = 'border-b border-line px-3 py-2 text-content-2'

/** Dato de solo lectura: etiqueta pequena y valor */
function ReadOnlyItem({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="m-0 text-sm font-medium break-words text-content">{children || '—'}</dd>
    </div>
  )
}

export default function ModalPDFInforme({ incidencia, inasistenciasHistoricas = [], onClose, onSave }: ModalPDFInformeProps) {
  // Obtener usuario logueado de Redux
  const { username, nombre, apellido } = useAppSelector((state) => state.auth)

  const nombreFirmante = (nombre && apellido) ? `${nombre} ${apellido}`.toUpperCase() : (username ? username.toUpperCase() : 'SUPERVISOR')

  // Detectar si es un reporte de inasistencias
  const isAbsenceReport = incidencia?.isAbsenceReport || false

  const [formData, setFormData] = useState<InformeFormData>({
    numeroInforme: '',
    destinatarioCargo: '',
    destinatarioNombre: '',
    fecha: '',
    horaIncidente: '',
    fechaIncidente: '',
    ubicacion: '',
    jurisdiccion: '',
    sereno: '',
    dni: '',
    cargo: '',
    regLab: '',
    turno: '',  // Agregar turno
    nombreCompleto: '',  // Agregar nombre completo
    falta: '',
    articulo: '',
    bodycam: '',
    bodycamAsignadaA: '',
    tipoMedio: 'bodycam', // 'bodycam' o 'camara'
    numeroCamara: '',
    supervisor: '',
    descripcionAdicional: '',
    tipoInasistencia: '',
    fechaFalta: '',
    imagenes: [],
    links: ''
  })

  const [loadingEvidences, setLoadingEvidences] = useState(false)
  const [savingReport, setSavingReport] = useState(false)
  const [validationErrors, setValidationErrors] = useState<number[]>([])
  const [logoBase64, setLogoBase64] = useState('')
  const [attendanceData, setAttendanceData] = useState<AttendancePersonRow[]>([]) // Datos de attendance para reportes de inasistencias
  const [loadingAttendance, setLoadingAttendance] = useState(false)

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

  useEffect(() => {
    if (incidencia) {
      // El código del informe (numeroInforme) SOLO se muestra si el informe está aprobado
      // El backend lo genera automáticamente al aprobar, con número correlativo y año
      const numeroInforme = incidencia.code || '' // Si no está aprobado, será vacío

      // Si es un reporte de inasistencias, usar datos diferentes
      if (isAbsenceReport) {
        // Para reportes de inasistencias, el PDF ya está generado y solo lo mostramos
        setFormData({
          numeroInforme,
          destinatarioCargo: (incidencia.cargoDestinatario || incidencia.dirigidoA || '').toUpperCase(),
          destinatarioNombre: (incidencia.destinatario || '').toUpperCase(),
          fecha: formatearFecha(incidencia.fechaIncidente),
          horaIncidente: '',
          fechaIncidente: '',
          ubicacion: '',
          jurisdiccion: '',
          sereno: '',
          dni: '',
          cargo: '',
          regLab: '',
          turno: '',
          nombreCompleto: '',
          falta: incidencia.falta || 'Inasistencia',
          articulo: '',
          bodycam: '',
          bodycamAsignadaA: '',
          tipoMedio: 'reporte',
          numeroCamara: '',
          supervisor: '',
          descripcionAdicional: incidencia.message || '',
          tipoInasistencia: incidencia.absenceMode === 'JUSTIFIED' ? 'Justificada' : 'Injustificada',
          fechaFalta: '',
          imagenes: [],
          links: incidencia.link || ''
        })
        return
      }

      // Usar el cargo del destinatario de la API si está disponible, sino usar el mapeo antiguo
      let cargo = incidencia.cargoDestinatario || ''
      if (!cargo) {
        // Fallback al mapeo antiguo si no hay cargoDestinatario
        if (incidencia.dirigidoA === 'Jefe de operaciones') cargo = 'Jefe de Operaciones'
        else if (incidencia.dirigidoA === 'Coordinadores') cargo = 'Coordinador'
        else if (incidencia.dirigidoA === 'Subgerente') cargo = 'Subgerente'
      }

      const articulo = articulosPorFalta[incidencia.falta] || ''

      // OBTENER SOLO LA DIRECCIÓN, NO LAS COORDENADAS
      const obtenerDireccion = () => {
        if (incidencia.ubicacion?.address) {
          return incidencia.ubicacion.address
        } else if (incidencia.ubicacion?.coordinates) {
          return 'Dirección no especificada (solo coordenadas)'
        } else if (Array.isArray(incidencia.ubicacion)) {
          return 'Dirección no especificada (solo coordenadas)'
        }
        return 'No especificada'
      }

      // Generar contenido del informe predeterminado
      const generarContenidoInforme = () => {
        const hora = obtenerHoraFormateada(incidencia.horaIncidente)
        const fecha = formatearFecha(incidencia.fechaIncidente)
        const fechaFaltaFormatted = incidencia.fechaFalta ? formatearFecha(incidencia.fechaFalta) : fecha
        const direccion = obtenerDireccion()
        const nombreCompleto = incidencia.nombreCompleto || 'NOMBRE NO DISPONIBLE'
        const cargoPersona = incidencia.cargo || 'Inspector Comercial'
        const regLab = incidencia.regLab || 'N/A'
        const turno = incidencia.turno || 'N/A'
        const falta = incidencia.falta || 'Falta no especificada'
        const bodycamNum = incidencia.bodycamNumber || 'N/A'
        const tipoInasistencia = incidencia.tipoInasistencia || 'Injustificada'
        const tipoMedio = incidencia.tipoMedio || 'bodycam'
        const numeroCamara = incidencia.numeroCamara || 'N/A'

        // Si es una inasistencia, usar plantilla específica
        if (falta.startsWith('Inasistencia')) {
          return `Es grato dirigirme a Ud. con la finalidad de informarle lo siguiente:

Para conocimiento, informo que el personal ${nombreCompleto}, con régimen ${regLab}, ${cargoPersona} del turno ${turno}, donde presuntamente...

[INSTRUCCIÓN: Describa aquí de manera objetiva lo ocurrido, utilizando términos como "presuntamente", "aparentemente", u otros similares que denoten objetividad y eviten afirmaciones categóricas. Detalle la situación observada de forma clara y precisa.]

...incurriendo presuntamente en la falta disciplinaria establecida como "${falta}", en el lugar ubicado en ${direccion}, el día ${fecha} a las ${hora}.

[INSTRUCCIÓN: Si desea agregar observaciones adicionales sobre el contexto o circunstancias del incidente, puede incluirlas aquí.]

Como medida inmediata, se realizó el registro documental del incidente y se adjuntó evidencia fotográfica y audiovisual, con la finalidad de que sea evaluada conforme al proceso administrativo correspondiente.

Finalmente, se deja constancia de que la situación descrita constituye un incumplimiento de las obligaciones del personal, motivo por el cual se adjunta la información del involucrado y las capturas correspondientes. Se remite la presente comunicación a la Subgerencia de Serenazgo para su conocimiento y fines correspondientes.

Se adjuntan las evidencias:`
        }

        // Para otras faltas - verificar si es bodycam o cámara
        if (tipoMedio === 'camara') {
          return `Es grato dirigirme a Ud. con la finalidad de informarle lo siguiente:

Para conocimiento, informo que el personal ${nombreCompleto}, con régimen ${regLab}, ${cargoPersona} del turno ${turno}, donde presuntamente...

[INSTRUCCIÓN: Describa aquí de manera objetiva lo ocurrido, utilizando términos como "presuntamente", "aparentemente", u otros similares que denoten objetividad y eviten afirmaciones categóricas. Detalle la situación observada de forma clara y precisa.]

...incurriendo presuntamente en la falta disciplinaria establecida como "${falta}", registrada a través de la CÁMARA ${numeroCamara}, en el lugar ubicado en ${direccion}, el día ${fecha} a las ${hora}.

[INSTRUCCIÓN: Si desea agregar observaciones adicionales sobre el contexto o circunstancias del incidente, puede incluirlas aquí.]

Como medida inmediata, se realizó el registro documental del incidente y se adjuntó evidencia fotográfica y audiovisual obtenida por la CÁMARA ${numeroCamara}, con la finalidad de que sea evaluada conforme al proceso administrativo correspondiente.

Finalmente, se deja constancia de que la situación descrita constituye un incumplimiento de las obligaciones del personal, motivo por el cual se adjunta la información del involucrado y las capturas correspondientes de la CÁMARA. Se remite la presente comunicación a la Subgerencia de Serenazgo para su conocimiento y fines correspondientes.

Se adjuntan las evidencias:`
        }

        // Para otras faltas (con bodycam)
        return `Es grato dirigirme a Ud. con la finalidad de informarle lo siguiente:

Para conocimiento, informo que el personal ${nombreCompleto}, con régimen ${regLab}, ${cargoPersona} del turno ${turno}, donde presuntamente...

[INSTRUCCIÓN: Describa aquí de manera objetiva lo ocurrido, utilizando términos como "presuntamente", "aparentemente", u otros similares que denoten objetividad y eviten afirmaciones categóricas. Detalle la situación observada de forma clara y precisa.]

...incurriendo presuntamente en la falta disciplinaria establecida como "${falta}", registrada a través de la BODYCAM ${bodycamNum}, en el lugar ubicado en ${direccion}, el día ${fecha} a las ${hora}.

[INSTRUCCIÓN: Si desea agregar observaciones adicionales sobre el contexto o circunstancias del incidente, puede incluirlas aquí.]

Como medida inmediata, se realizó el registro documental del incidente y se adjuntó evidencia fotográfica y audiovisual obtenida por la BODYCAM ${bodycamNum}, con la finalidad de que sea evaluada conforme al proceso administrativo correspondiente.

Finalmente, se deja constancia de que la situación descrita constituye un incumplimiento de las obligaciones del personal, motivo por el cual se adjunta la información del involucrado y las capturas correspondientes de la BODYCAM. Se remite la presente comunicación a la Subgerencia de Serenazgo para su conocimiento y fines correspondientes.

Se adjuntan las evidencias:`
      }

      // Formatear fechaFalta antes de guardarla
      const fechaFaltaFormateada = incidencia.fechaFalta
        ? formatearFecha(incidencia.fechaFalta)
        : formatearFecha(incidencia.fechaIncidente)

      setFormData({
        numeroInforme,
        destinatarioCargo: cargo,
        destinatarioNombre: incidencia.destinatario || '',
        fecha: formatearFecha(new Date()),
        horaIncidente: obtenerHoraFormateada(incidencia.horaIncidente),
        fechaIncidente: formatearFecha(incidencia.fechaIncidente),
        ubicacion: obtenerDireccion(), // SOLO DIRECCIÓN
        jurisdiccion: incidencia.jurisdiccion || '',
        sereno: incidencia.nombreCompleto ? incidencia.nombreCompleto.toUpperCase() : '',  // Auto-rellenar con nombre completo
        dni: incidencia.dni || '',
        nombreCompleto: incidencia.nombreCompleto || '',  // Agregar nombre completo
        cargo: incidencia.cargo || '',
        regLab: incidencia.regLab || '',
        turno: incidencia.turno || '',  // Agregar turno
        falta: incidencia.falta || '',
        articulo,
        bodycam: incidencia.bodycamNumber || '',
        bodycamAsignadaA: incidencia.bodycamAsignadaA || '',
        tipoMedio: incidencia.tipoMedio || 'bodycam',
        numeroCamara: incidencia.numeroCamara || '',
        supervisor: nombreFirmante,  // Usuario logueado
        descripcionAdicional: generarContenidoInforme(),  // Generar plantilla para todos los tipos
        tipoInasistencia: incidencia.tipoInasistencia || '',
        fechaFalta: fechaFaltaFormateada,  // Usar fecha ya formateada
        imagenes: [],
        links: ''
      })
    }
  }, [incidencia])

  // Cargar evidencias existentes del reporte
  useEffect(() => {
    async function loadExistingEvidences() {
      if (!incidencia || !incidencia.id) return

      // No cargar evidencias para reportes de inasistencias
      if (isAbsenceReport) {
        setLoadingEvidences(false)
        return
      }

      setLoadingEvidences(true)
      try {
        const reportData = (await getReportWithEvidences(incidencia.id)) as ReportWithEvidencesConLink | null

        if (reportData && reportData.evidences && reportData.evidences.length > 0) {

          // Cargar las imágenes existentes y convertirlas a base64 para el PDF
          const imagenesExistentes = await Promise.all(
            reportData.evidences.map(async (ev): Promise<ImagenInforme | null> => {
              try {

                // Obtener el token de localStorage
                const getToken = (): string | null | undefined => {
                  try {
                    const persistRoot = localStorage.getItem('persist:root')
                    if (persistRoot) {
                      const parsed = JSON.parse(persistRoot) as { auth?: string }
                      if (parsed.auth) {
                        const authState = JSON.parse(parsed.auth) as { token?: string | null }
                        return authState.token
                      }
                    }
                  } catch (error) {
                  }
                  return null
                }

                const token = getToken()

                // Obtener la imagen como blob con autenticación
                const response = await fetch(ev.imageUrl, {
                  method: 'GET',
                  headers: token ? {
                    'Authorization': `Bearer ${token}`
                  } : {}
                })

                if (!response.ok) {
                  throw new Error(`Error al cargar imagen: ${response.status} ${response.statusText}`)
                }

                const blob = await response.blob()

                // Convertir blob a base64
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader()
                  reader.onloadend = () => resolve(reader.result as string)
                  reader.readAsDataURL(blob)
                })

                return {
                  id: ev.id,
                  name: `evidence_${ev.id}.jpg`,
                  url: ev.imageUrl,
                  base64: base64,
                  anexo: ev.description || '',
                  isExisting: true // Marcar como imagen existente
                }
              } catch (error) {
                return null
              }
            })
          )

          // Filtrar imágenes que se cargaron exitosamente
          const imagenesValidas = imagenesExistentes.filter((img): img is ImagenInforme => img !== null)

          setFormData(prev => ({
            ...prev,
            imagenes: imagenesValidas,
            descripcionAdicional: reportData.message || prev.descripcionAdicional,
            links: reportData.link || prev.links
          }))
        } else if (reportData) {
          // Si no hay evidencias pero hay datos del reporte, cargar message y link
          setFormData(prev => ({
            ...prev,
            descripcionAdicional: reportData.message || prev.descripcionAdicional,
            links: reportData.link || prev.links
          }))
        }
      } catch (error) {
      } finally {
        setLoadingEvidences(false)
      }
    }

    loadExistingEvidences()
  }, [incidencia])

  // Cargar datos de attendance para reportes de inasistencias
  useEffect(() => {
    async function loadAttendanceData() {
      console.log('=== LOADING ATTENDANCE DATA ===')
      console.log('incidencia:', incidencia)
      console.log('isAbsenceReport:', isAbsenceReport)

      if (!incidencia || !isAbsenceReport) {
        console.log('No es un reporte de inasistencias o no hay incidencia')
        return
      }

      if (!incidencia.absenceStart || !incidencia.absenceEnd) {
        console.log('No hay absenceStart o absenceEnd:', {
          absenceStart: incidencia.absenceStart,
          absenceEnd: incidencia.absenceEnd,
          absences: incidencia.absences
        })
        return
      }

      setLoadingAttendance(true)
      try {
        // Formatear fechas para la API (YYYY-MM-DD)
        const startDate = new Date(incidencia.absenceStart)
        const endDate = new Date(incidencia.absenceEnd)

        const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
        const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
        const mode = incidencia.absenceMode || 'UNJUSTIFIED'

        console.log('Llamando a getAttendances con:', { startStr, endStr, mode })

        const result = await getAttendances(startStr, endStr, mode)
        const attendancesData = result.data || []

        console.log('Datos de attendance recibidos:', attendancesData)
        setAttendanceData(attendancesData)
      } catch (error) {
        console.error('Error al cargar datos de attendance:', error)
        setAttendanceData([])
      } finally {
        setLoadingAttendance(false)
      }
    }

    loadAttendanceData()
  }, [incidencia, isAbsenceReport])

  function handleChange(field: keyof InformeFormData, value: string) {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }

      // Si cambia el número de bodycam o numeroCamara, actualizar la plantilla automáticamente
      if ((field === 'bodycam' || field === 'numeroCamara') && !(incidencia.falta && incidencia.falta.startsWith('Inasistencia'))) {
        const hora = obtenerHoraFormateada(incidencia.horaIncidente)
        const fecha = formatearFecha(incidencia.fechaIncidente)
        const direccion = prev.ubicacion
        const nombreCompleto = incidencia.nombreCompleto || 'NOMBRE NO DISPONIBLE'
        const cargoPersona = incidencia.cargo || 'Inspector Comercial'
        const regLab = incidencia.regLab || 'N/A'
        const turno = incidencia.turno || 'N/A'
        const falta = incidencia.falta || 'Falta no especificada'
        const tipoMedio = incidencia.tipoMedio || prev.tipoMedio || 'bodycam'

        let nuevaPlantilla

        if (tipoMedio === 'camara') {
          const numeroCamara = field === 'numeroCamara' ? value : (prev.numeroCamara || 'N/A')

          nuevaPlantilla = `Es grato dirigirme a Ud. con la finalidad de informarle lo siguiente:

Para conocimiento, informo que el personal ${nombreCompleto}, con régimen ${regLab}, ${cargoPersona} del turno ${turno}, donde presuntamente...

[INSTRUCCIÓN: Describa aquí de manera objetiva lo ocurrido, utilizando términos como "presuntamente", "aparentemente", u otros similares que denoten objetividad y eviten afirmaciones categóricas. Detalle la situación observada de forma clara y precisa.]

...incurriendo presuntamente en la falta disciplinaria establecida como "${falta}", registrada a través de la CÁMARA ${numeroCamara}, en el lugar ubicado en ${direccion}, el día ${fecha} a las ${hora}.

[INSTRUCCIÓN: Si desea agregar observaciones adicionales sobre el contexto o circunstancias del incidente, puede incluirlas aquí.]

Como medida inmediata, se realizó el registro documental del incidente y se adjuntó evidencia fotográfica y audiovisual obtenida por la CÁMARA ${numeroCamara}, con la finalidad de que sea evaluada conforme al proceso administrativo correspondiente.

Finalmente, se deja constancia de que la situación descrita constituye un incumplimiento de las obligaciones del personal, motivo por el cual se adjunta la información del involucrado y las capturas correspondientes de la CÁMARA. Se remite la presente comunicación a la Subgerencia de Serenazgo para su conocimiento y fines correspondientes.

Se adjuntan las evidencias:`
        } else {
          const bodycamNum = field === 'bodycam' ? value : (prev.bodycam || 'N/A')

          nuevaPlantilla = `Es grato dirigirme a Ud. con la finalidad de informarle lo siguiente:

Para conocimiento, informo que el personal ${nombreCompleto}, con régimen ${regLab}, ${cargoPersona} del turno ${turno}, donde presuntamente...

[INSTRUCCIÓN: Describa aquí de manera objetiva lo ocurrido, utilizando términos como "presuntamente", "aparentemente", u otros similares que denoten objetividad y eviten afirmaciones categóricas. Detalle la situación observada de forma clara y precisa.]

...incurriendo presuntamente en la falta disciplinaria establecida como "${falta}", registrada a través de la BODYCAM ${bodycamNum}, en el lugar ubicado en ${direccion}, el día ${fecha} a las ${hora}.

[INSTRUCCIÓN: Si desea agregar observaciones adicionales sobre el contexto o circunstancias del incidente, puede incluirlas aquí.]

Como medida inmediata, se realizó el registro documental del incidente y se adjuntó evidencia fotográfica y audiovisual obtenida por la BODYCAM ${bodycamNum}, con la finalidad de que sea evaluada conforme al proceso administrativo correspondiente.

Finalmente, se deja constancia de que la situación descrita constituye un incumplimiento de las obligaciones del personal, motivo por el cual se adjunta la información del involucrado y las capturas correspondientes de la BODYCAM. Se remite la presente comunicación a la Subgerencia de Serenazgo para su conocimiento y fines correspondientes.

Se adjuntan las evidencias:`
        }

        newData.descripcionAdicional = nuevaPlantilla
      }

      return newData
    })
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files: File[] = Array.from(e.target.files ?? [])

    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          imagenes: [...prev.imagenes, {
            name: file.name,
            url: URL.createObjectURL(file),
            base64: event.target?.result as string,
            anexo: '',
            file: file, // Guardar el archivo File para poder subirlo
            isExisting: false // Marcar como imagen nueva
          }]
        }))
      }
      reader.readAsDataURL(file)
    })

    // Limpiar validación al agregar imágenes
    setValidationErrors([])
  }

  function updateImageAnexo(index: number, anexo: string) {
    setFormData(prev => ({
      ...prev,
      imagenes: prev.imagenes.map((img, i) =>
        i === index ? { ...img, anexo } : img
      )
    }))

    // Limpiar errores de validación cuando se agrega descripción
    if (anexo.trim()) {
      setValidationErrors(prev => prev.filter(i => i !== index))
    }
  }

  async function removeImage(index: number) {
    const img = formData.imagenes[index]

    // Si es una imagen existente del backend, eliminarla mediante la API
    if (img.isExisting && img.id) {
      if (!confirm('¿Estás seguro de eliminar esta imagen?')) {
        return
      }

      try {
        await deleteEvidence(img.id)
      } catch (error) {
        toast.error('Error al eliminar la imagen del servidor. Por favor, intente nuevamente.')
        return
      }
    }

    // Remover de la interfaz local
    setFormData(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index)
    }))
  }

  // Función para guardar cambios sin descargar el PDF
  async function guardarCambios() {
    // Validar que todas las imágenes tengan descripción
    const errores: number[] = []
    formData.imagenes.forEach((img, index) => {
      if (!img.anexo || !img.anexo.trim()) {
        errores.push(index)
      }
    })

    if (errores.length > 0) {
      setValidationErrors(errores)
      toast.error(`⚠️ Todas las imágenes requieren una descripción. Por favor, agrega descripciones a las imágenes: ${errores.map(i => i + 1).join(', ')}`)
      return
    }

    setSavingReport(true)
    try {
      // Obtener imágenes nuevas para subir
      const nuevasImagenes = formData.imagenes.filter(img => !img.isExisting)
      const files = nuevasImagenes.map(img => img.file).filter((file): file is File => Boolean(file))
      const descriptions = nuevasImagenes.map(img => img.anexo)

      await updateReportWithEvidences(
        incidencia.id,
        files,
        descriptions,
        formData.descripcionAdicional,
        formData.links
      )

      toast.success('Cambios guardados exitosamente')

      // Notificar al padre para actualizar las acciones
      if (onSave) {
        onSave()
      }

      // Cerrar el modal y volver a la pantalla principal
      onClose()
    } catch (error) {
      const apiError = error as ApiErrorLike
      let errorMessage = 'Error al guardar los cambios'
      if (apiError.response?.data?.message) {
        errorMessage = Array.isArray(apiError.response.data.message)
          ? 'Errores:\n' + apiError.response.data.message.join('\n')
          : apiError.response.data.message
      }

      toast.error(errorMessage)
    } finally {
      setSavingReport(false)
    }
  }

  async function generarPDF() {
    // Validar que todas las imágenes tengan descripción
    const errores: number[] = []
    formData.imagenes.forEach((img, index) => {
      if (!img.anexo || !img.anexo.trim()) {
        errores.push(index)
      }
    })

    if (errores.length > 0) {
      setValidationErrors(errores)
      toast.error(`⚠️ Todas las imágenes requieren una descripción. Por favor, agrega descripciones a las imágenes: ${errores.map(i => i + 1).join(', ')}`)
      return
    }

    // Si hay imágenes nuevas, actualizar el reporte en el backend
    const nuevasImagenes = formData.imagenes.filter(img => !img.isExisting)

    if (nuevasImagenes.length > 0 || formData.descripcionAdicional) {
      setSavingReport(true)
      try {
        const files = nuevasImagenes.map(img => img.file).filter((file): file is File => Boolean(file))
        const descriptions = nuevasImagenes.map(img => img.anexo)

        await updateReportWithEvidences(
          incidencia.id,
          files,
          descriptions,
          formData.descripcionAdicional,
          formData.links
        )

      } catch (error) {

        const apiError = error as ApiErrorLike
        let errorMessage = 'Error al guardar las evidencias en el servidor'
        if (apiError.response?.data?.message) {
          errorMessage = Array.isArray(apiError.response.data.message)
            ? 'Errores:\n' + apiError.response.data.message.join('\n')
            : apiError.response.data.message
        }

        toast.error(errorMessage)
        setSavingReport(false)
        return
      } finally {
        setSavingReport(false)
      }
    }

    // Generar el PDF usando @react-pdf/renderer
    try {
      // Si es un reporte de inasistencias, transformar attendanceData a formato de inasistenciasHistoricas
      let inasistenciasParaPDF: InasistenciaHistorica[] = inasistenciasHistoricas

      if (isAbsenceReport && attendanceData.length > 0) {
        // Transformar attendanceData al formato esperado por PDFHistorialTable
        inasistenciasParaPDF = attendanceData
          .filter(person => {
            const validDates = person.dates?.filter(d => !d.delete_at && d.date)
            return validDates && validDates.length > 0
          })
          .flatMap(person => {
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
              tipoInasistencia: dateObj.mode === 'JUSTIFIED' ? 'JUSTIFICADA' : 'INJUSTIFICADA'
            }))
          })
      }

      const doc = (
        <InformePDFDocument
          formData={formData}
          incidencia={incidencia}
          inasistenciasHistoricas={inasistenciasParaPDF}
          logoBase64={logoBase64}
          formatearFecha={formatearFecha}
          esInasistencia={esInasistencia}
        />
      )

      // Generar el blob del PDF
      const blob = await pdf(doc).toBlob()

      // Crear URL para descarga
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Informe_${incidencia.dni}_${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Registrar la descarga del PDF
      trackPDFDownload(incidencia.id)
    } catch (error) {
      toast.error('Error al generar el PDF. Por favor, intente nuevamente.')
    }
  }

  const esInasistencia = incidencia.falta && incidencia.falta.startsWith('Inasistencia')

  // Estado del informe, mostrado como etiqueta de texto en el encabezado del marco
  const estadoBadge =
    incidencia.status === 'approved' ? <Badge tone="success">Aprobado</Badge>
    : incidencia.status === 'pending' ? <Badge tone="warning">Pendiente de aprobación</Badge>
    : incidencia.status === 'draft' ? <Badge tone="neutral">Borrador</Badge>
    : incidencia.status === 'rejected' ? <Badge tone="danger">Rechazado</Badge>
    : null

  const modalFooter = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={savingReport}>
        Cancelar
      </Button>
      <Button
        variant="secondary"
        onClick={guardarCambios}
        loading={savingReport}
        disabled={savingReport || loadingEvidences}
      >
        {savingReport ? 'Guardando cambios…' : 'Guardar cambios'}
      </Button>
      <Button icon={<FiDownload />} onClick={generarPDF} disabled={savingReport || loadingEvidences}>
        Descargar PDF
      </Button>
    </>
  )

  return (
    <Modal
      title="Vista previa del informe"
      description={
        <span className="inline-flex flex-wrap items-center gap-2">
          Revisa el informe antes de descargarlo. {estadoBadge}
        </span>
      }
      onClose={onClose}
      size="lg"
      footer={modalFooter}
    >
      <div className="flex flex-col gap-6">
        {/* Encabezado del informe */}
        <section className="flex flex-col gap-4">
          <h4 className="m-0 text-[13px] font-semibold text-content">Encabezado</h4>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            {incidencia.status === 'approved' ? (
              <Field label="Informe N°">
                <Input value={formData.numeroInforme} readOnly title="Código generado automáticamente al aprobar" />
              </Field>
            ) : (
              <Field
                label="Informe N°"
                hint="El sistema asigna el número correlativo y el año cuando el informe se aprueba; no hace falta escribirlo."
              >
                <div className={pendingCode}>Se genera al aprobar el informe</div>
              </Field>
            )}
            <Field label="Fecha del informe">
              <Input value={formData.fecha} onChange={e => handleChange('fecha', e.target.value.toUpperCase())} />
            </Field>
            <Field label="Dirigido a (Sr.)">
              <Input
                value={formData.destinatarioNombre}
                onChange={e => handleChange('destinatarioNombre', e.target.value.toUpperCase())}
              />
            </Field>
            <Field label="Cargo del destinatario">
              <Input
                value={formData.destinatarioCargo}
                onChange={e => handleChange('destinatarioCargo', e.target.value.toUpperCase())}
                placeholder="Cargo"
              />
            </Field>
          </div>
          <dl className={readBlock}>
            <ReadOnlyItem label="De">Control y Supervisión</ReadOnlyItem>
            <ReadOnlyItem label="Asunto">{incidencia.asunto}</ReadOnlyItem>
            {incidencia.cc && incidencia.cc.length > 0 && (
              <ReadOnlyItem label="Con copia a">{incidencia.cc.join(', ')}</ReadOnlyItem>
            )}
          </dl>
        </section>

        {/* Reporte de inasistencias: resumen y tabla (modelo del validador) */}
        {esInasistencia && (
          <section className="flex flex-col gap-4">
            <h4 className="m-0 text-[13px] font-semibold text-content">Reporte de inasistencias</h4>
            <p className="m-0 text-sm leading-relaxed text-content-2">
              Tengo el agrado de dirigirme a Ud, con la finalidad de saludarlo, a la vez informarle sobre el reporte de
              inasistencias al centro de labores del personal de la Subgerencia de Serenazgo, correspondiente del turno{' '}
              <strong className="font-semibold text-content">
                {(() => {
                  // Obtener turnos únicos de los datos de inasistencias
                  if (attendanceData && attendanceData.length > 0) {
                    const turnos = [...new Set(attendanceData.map(p => {
                      if (typeof p.shift === 'object') return p.shift?.name || ''
                      return p.shift || ''
                    }).filter(Boolean))]
                    if (turnos.length === 0) return 'MAÑANA / TARDE / NOCHE'
                    return turnos.join(' / ')
                  }
                  return 'MAÑANA / TARDE / NOCHE'
                })()}
              </strong>
              . Durante el período{' '}
              <strong className="font-semibold text-content">
                {incidencia.absenceStart && incidencia.absenceEnd ? (
                  <>
                    {new Date(incidencia.absenceStart).toLocaleDateString('es-PE', { day: '2-digit' })} al{' '}
                    {new Date(incidencia.absenceEnd).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                  </>
                ) : (
                  'PERÍODO NO ESPECIFICADO'
                )}
              </strong>
              , se ha registrado un número significativo de inasistencias{' '}
              <strong className="font-semibold text-content">
                {incidencia.absenceMode === 'JUSTIFIED' || formData.tipoInasistencia === 'Justificada' ? 'justificadas' : 'injustificadas'}
              </strong>{' '}
              por parte del personal mencionado.
            </p>

            {loadingAttendance ? (
              <p className="m-0 flex items-center gap-2 text-sm text-muted" role="status">
                <FiLoader className="animate-spin" aria-hidden /> Cargando inasistencias…
              </p>
            ) : attendanceData.length === 0 ? (
              <p className="m-0 rounded-lg bg-subtle p-5 text-center text-sm text-muted">
                No hay inasistencias registradas en el período seleccionado.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-line">
                <table className="w-full border-separate border-spacing-0 text-[13px]">
                  <thead>
                    <tr>
                      <th className={cn(th, 'text-center')}>N°</th>
                      <th className={cn(th, 'text-left')}>Apellidos y nombres</th>
                      <th className={cn(th, 'text-left')}>Cargo</th>
                      <th className={cn(th, 'text-left')}>Reg. lab.</th>
                      <th className={cn(th, 'text-left')}>Turno</th>
                      <th className={cn(th, 'text-left')}>Fechas</th>
                      <th className={cn(th, 'text-left')}>Tipo</th>
                      <th className={cn(th, 'text-left')}>Jurisdicción</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child_td]:border-b-0">
                    {attendanceData
                      .filter(person => {
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
                        const justificada = incidencia.absenceMode === 'JUSTIFIED' || formData.tipoInasistencia === 'Justificada'

                        return (
                          <tr key={person.id || index}>
                            <td className={cn(td, 'text-center text-muted')}>{index + 1}</td>
                            <td className={cn(td, 'font-medium text-content')}>
                              {person.name && person.lastname
                                ? `${person.lastname} ${person.name}`.toUpperCase()
                                : person.fullname?.toUpperCase() || '-'}
                            </td>
                            <td className={td}>{jobValue}</td>
                            <td className={td}>{regimeValue}</td>
                            <td className={td}>{shiftValue}</td>
                            <td className={td}>{fechas}</td>
                            <td className={td}>
                              <Badge tone={justificada ? 'success' : 'danger'}>{justificada ? 'Justificada' : 'Injustificada'}</Badge>
                            </td>
                            <td className={td}>{jurisdictionValue}</td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Informe de incidencia: el hecho, el lugar, el personal y el medio */}
        {!esInasistencia && (
          <>
            <section className="flex flex-col gap-4">
              <h4 className="m-0 text-[13px] font-semibold text-content">El hecho</h4>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <Field label="Hora del incidente">
                  <Input value={formData.horaIncidente} onChange={e => handleChange('horaIncidente', e.target.value)} />
                </Field>
                <Field label="Fecha del incidente">
                  <Input value={formData.fechaIncidente} onChange={e => handleChange('fechaIncidente', e.target.value)} />
                </Field>
                <Field label="Artículo">
                  <Input value={formData.articulo} onChange={e => handleChange('articulo', e.target.value)} />
                </Field>
              </div>
              <dl className={readBlock}>
                <ReadOnlyItem label="Falta">{formData.falta}</ReadOnlyItem>
              </dl>
            </section>

            <section className="flex flex-col gap-4">
              <h4 className="m-0 text-[13px] font-semibold text-content">Ubicación</h4>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <Field label="Dirección" className="col-span-2 max-md:col-span-1">
                  <Input
                    value={formData.ubicacion}
                    onChange={e => handleChange('ubicacion', e.target.value)}
                    placeholder="Dirección completa del incidente"
                  />
                </Field>
                <Field label="Jurisdicción">
                  <Input value={formData.jurisdiccion} onChange={e => handleChange('jurisdiccion', e.target.value)} />
                </Field>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h4 className="m-0 text-[13px] font-semibold text-content">Personal involucrado</h4>
              <dl className={readBlock}>
                <ReadOnlyItem label="Sereno">{formData.sereno}</ReadOnlyItem>
                <ReadOnlyItem label="DNI">{formData.dni}</ReadOnlyItem>
                <ReadOnlyItem label="Cargo">{formData.cargo}</ReadOnlyItem>
                <ReadOnlyItem label="Régimen laboral">{formData.regLab}</ReadOnlyItem>
              </dl>
            </section>

            <section className="flex flex-col gap-4">
              <h4 className="m-0 text-[13px] font-semibold text-content">Medio</h4>
              {formData.tipoMedio === 'bodycam' && (
                <Field label="Bodycam asignada a">
                  <Input
                    value={formData.bodycamAsignadaA}
                    onChange={e => handleChange('bodycamAsignadaA', e.target.value)}
                  />
                </Field>
              )}
              <dl className={readBlock}>
                {formData.tipoMedio === 'bodycam' ? (
                  <ReadOnlyItem label="N° de bodycam">{formData.bodycam}</ReadOnlyItem>
                ) : (
                  <ReadOnlyItem label="N° de cámara">{formData.numeroCamara}</ReadOnlyItem>
                )}
                <ReadOnlyItem label="Supervisor">{formData.supervisor}</ReadOnlyItem>
              </dl>
            </section>

            <section className="flex flex-col gap-4">
              <h4 className="m-0 text-[13px] font-semibold text-content">Contenido del informe</h4>
              <Field label="Texto del informe">
                <Textarea
                  value={formData.descripcionAdicional}
                  onChange={e => handleChange('descripcionAdicional', e.target.value)}
                  placeholder="Edita el contenido del informe según sea necesario…"
                  rows={16}
                  className="leading-relaxed whitespace-pre-wrap"
                />
              </Field>
              <div className="rounded-lg bg-subtle p-4 text-[13px] text-content-2">
                <p className="m-0 font-medium text-content">Cómo completarlo</p>
                <ul className="m-0 mt-2 flex list-disc flex-col gap-1 pl-5">
                  <li>Completa las secciones marcadas con [INSTRUCCIÓN] con los detalles del incidente.</li>
                  <li>Usa términos objetivos como «presuntamente» o «aparentemente» para describir los hechos.</li>
                  <li>Puedes editar cualquier parte del texto.</li>
                  <li>La plantilla se adapta al tipo de incidente.</li>
                </ul>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h4 className="m-0 text-[13px] font-semibold text-content">Evidencia</h4>
              <label
                className={cn(
                  uploadBox,
                  (loadingEvidences || savingReport) && 'pointer-events-none opacity-50'
                )}
              >
                <FiUpload aria-hidden className="text-lg text-accent" />
                <span>
                  <span className="font-medium text-content">Adjuntar imágenes</span>
                  <span className="block text-xs text-muted">Puedes elegir varias a la vez.</span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={loadingEvidences || savingReport}
                  className="sr-only"
                />
              </label>

              {loadingEvidences && (
                <p className="m-0 flex items-center gap-2 text-sm text-muted" role="status">
                  <FiLoader className="animate-spin" aria-hidden /> Cargando evidencias existentes…
                </p>
              )}

              {formData.imagenes.length > 0 && (
                <div className="flex flex-col gap-3">
                  {formData.imagenes.map((img, index) => (
                    <div key={index} className="flex gap-4 rounded-lg border border-line p-3 max-sm:flex-col">
                      <div className="relative size-24 shrink-0">
                        <img src={img.base64 || img.url} alt={img.name} className="size-full rounded-lg object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          disabled={savingReport}
                          aria-label={`Quitar imagen ${index + 1}`}
                          className={removeImgBtn}
                        >
                          <FiX aria-hidden />
                        </button>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        {img.isExisting && (
                          <span>
                            <Badge tone="neutral">Guardada</Badge>
                          </span>
                        )}
                        <Field
                          label={`Anexo ${index + 1}`}
                          required
                          error={validationErrors.includes(index) ? 'Esta imagen requiere una descripción.' : undefined}
                        >
                          <Textarea
                            value={img.anexo || ''}
                            onChange={e => updateImageAnexo(index, e.target.value)}
                            placeholder="Describe lo que muestra esta imagen"
                            rows={2}
                            disabled={savingReport}
                            invalid={validationErrors.includes(index)}
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Field label="Enlaces de referencia" hint="Uno por línea.">
                <Textarea
                  value={formData.links}
                  onChange={e => handleChange('links', e.target.value)}
                  placeholder="https://ejemplo.com&#10;https://otro-enlace.com"
                  rows={3}
                />
              </Field>
            </section>
          </>
        )}

        <p className="m-0 border-t border-line pt-4 text-center text-xs text-muted">
          Sede CECOM de la Subgerencia de Serenazgo · Av. Sta. Rosa de Lima, San Juan de Lurigancho 15427
        </p>
      </div>
    </Modal>
  )
}