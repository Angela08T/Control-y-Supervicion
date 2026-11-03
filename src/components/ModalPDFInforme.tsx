import React, { useState, useEffect } from 'react'
import { pdf } from '@react-pdf/renderer'
import { useAppSelector } from '@/store/hooks'
import logoSJL from '../assets/logo-sjl.png'
import { trackPDFDownload } from '../utils/storage'
import { getReportWithEvidences, updateReportWithEvidences, getEvidenceImageUrl, deleteEvidence } from '../api/report'
import { getAttendances } from '../api/offender'
import InformePDFDocument from './PDFDocument'
import { toast } from '../utils/toast'
import { btnPrimary, btnSecondary, cn, modalActions, modalBackdrop, modalClose, modalHeader } from '../utils/classes'
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

/* Clases de la vista previa. Es un documento en papel: fondo blanco y texto negro en ambos temas. */

/** Tarjeta del documento (.modal-pdf) */
const pdfCard =
  'flex max-h-[90vh] w-[750px] max-w-[95%] flex-col rounded-[20px] border border-[#e2e8f0] bg-[#ffffff]! shadow-[0_20px_60px_rgba(0,0,0,0.1)] animate-[modalSlideIn_0.4s_cubic-bezier(0.68,-0.55,0.265,1.55)] max-[900px]:w-[95%]'

/** <h3> del encabezado: el modal PDF fija el color en ambos temas */
const pdfTitle = 'm-[18px] text-[20px] font-bold text-[#1e3a8a]! [text-shadow:none]!'

/** Badge de estado del encabezado (el color se agrega por estado) */
const badgeBase = 'inline-flex items-center gap-[5px] rounded-[12px] border px-3 py-1 text-[0.85rem] font-semibold'

const pdfPreview = 'flex-1 overflow-y-auto bg-[#ffffff]! p-[30px] text-[#000000]!'

const pdfContent =
  "mx-auto max-w-[650px] bg-[#ffffff]! text-[11px] leading-[1.6] text-[#000000]! [font-family:'Times_New_Roman',serif]"

const pdfHeader = 'mb-[25px] border-b-[3px] border-primary bg-[#ffffff]! pb-[15px] text-center'
const pdfHeaderTitle = 'm-0 text-[18px] font-bold text-primary!'
const pdfSubtitle = 'my-1 text-[11px] italic text-[#475569]!'
const pdfYear = 'mx-0 mt-2.5 mb-0 text-[10px] text-[#64748b]!'

const pdfInfo = 'my-[25px] bg-[#ffffff]!'
const infoRow = 'mb-2.5 flex items-start gap-2.5 bg-[#ffffff]!'
/** <strong> de cada fila (.info-row strong), incluido el de la nota de INFORME N° */
const infoLabel = 'min-w-[90px] font-bold text-primary!'
const infoInputGroup = 'flex flex-1 flex-col gap-1.5 bg-[#ffffff]!'
/** Input de una fila de datos (.info-row input) */
const infoInput =
  "flex-1 border-0 border-b border-dotted border-[#cbd5e1] bg-transparent px-1.5 py-1 text-[11px] text-[#000000]! [font-family:'Times_New_Roman',serif] transition-all duration-300 ease-[ease] focus:outline-none focus:bg-[#f8fafc] focus:[border-bottom:2px_solid_var(--primary)] disabled:bg-[#f8fafc] disabled:text-[#64748b]!"
/** Input de INFORME N° aprobado: el color verde va en style inline en el original, por eso no hereda el fondo ni el borde del focus */
const infoInputApproved =
  "flex-1 cursor-not-allowed border-0 border-b border-dotted border-[rgba(34,197,94,0.5)] bg-[rgba(34,197,94,0.1)] px-1.5 py-1 text-[11px] font-bold text-[#000000]! [font-family:'Times_New_Roman',serif] transition-all duration-300 ease-[ease] focus:outline-none focus:[border-bottom:2px_solid_rgba(34,197,94,0.5)]"

const pdfSeparator = 'mx-0 my-5 border-0 border-t-[3px] border-double border-primary'
const pdfBody = 'my-[25px] bg-[#ffffff]!'
const pdfIntro = 'mb-[18px] text-justify font-medium text-[#000000]!'
const editableSection = 'mb-4 bg-[#ffffff]!'
const editLabel = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.5px] text-primary!'
/** Campo editable (.editable-section input / textarea) */
const editField =
  'w-full rounded-[6px] border border-[#cbd5e1] bg-[#f8fafc] px-2.5 py-2 text-[11px] text-[#000000]! transition-all duration-300 ease-[ease] focus:border-primary focus:bg-[#ffffff] focus:shadow-[0_0_0_3px_rgba(30,58,138,0.1)] focus:outline-none'
const editFont = "[font-family:'Times_New_Roman',serif]"
const editInput = `${editField} ${editFont}`
const editInputReadOnly = `${editInput} cursor-not-allowed`

const tableWrap = 'mt-2.5 overflow-x-auto'
const tableStyle = 'w-full border-collapse border border-[#000] text-[8px]'
const tableCell = 'border border-[#000] p-1'

const pdfFooter = 'mt-10 border-t-2 border-[#cbd5e1] bg-[#ffffff]! pt-5 text-center text-[10px] text-[#64748b]!'

const imagesPreview = 'mt-3 flex flex-wrap gap-4'
const imageContainer = 'flex animate-[scaleIn_0.3s_ease-out] flex-col gap-2'
const imageItem = 'group relative inline-block'
const imageImg =
  'h-[110px] w-[110px] rounded-[10px] border-[3px] border-line object-cover transition-all duration-300 ease-[ease] group-hover:border-primary group-hover:shadow-[0_8px_20px_rgba(30,58,138,0.3)] group-hover:[transform:scale(1.05)]'
const btnRemoveImg =
  'absolute -top-2.5 -right-2.5 flex size-7 cursor-pointer items-center justify-center rounded-full border-none bg-[linear-gradient(135deg,#ef4444_0%,#dc2626_100%)] text-[18px] leading-none text-white shadow-[0_4px_12px_rgba(239,68,68,0.4)] transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] hover:bg-[linear-gradient(135deg,#dc2626_0%,#b91c1c_100%)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.6)] hover:[transform:rotate(90deg)_scale(1.2)]'
const fileInput = `w-full rounded-[4px] border border-[#ddd] bg-[#f0f0f0] p-2 text-[11px] text-[#000000]! transition-all duration-300 ease-[ease] focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,58,138,0.1)] ${editFont}`

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

  return (
    <div className={modalBackdrop}>
      <div className={pdfCard}>
        <div className={modalHeader}>
          <div className="flex items-center gap-3">
            <h3 className={pdfTitle}>Vista Previa del Informe</h3>
            {/* Badge de estado */}
            {incidencia.status === 'approved' && (
              <span className={cn(badgeBase, 'border-[rgba(34,197,94,0.5)] bg-[rgba(34,197,94,0.2)] text-[#22c55e]')}>
                ✓ Aprobado
              </span>
            )}
            {incidencia.status === 'pending' && (
              <span className={cn(badgeBase, 'border-[rgba(245,158,11,0.5)] bg-[rgba(245,158,11,0.2)] text-[#f59e0b]')}>
                ⏳ Pendiente de aprobación
              </span>
            )}
            {incidencia.status === 'draft' && (
              <span className={cn(badgeBase, 'border-[rgba(148,163,184,0.5)] bg-[rgba(148,163,184,0.2)] text-[#94a3b8]')}>
                📝 Borrador
              </span>
            )}
            {incidencia.status === 'rejected' && (
              <span className={cn(badgeBase, 'border-[rgba(239,68,68,0.5)] bg-[rgba(239,68,68,0.2)] text-[#ef4444]')}>
                ✗ Rechazado
              </span>
            )}
          </div>
          <button className={modalClose} onClick={onClose}>×</button>
        </div>

        <div className={pdfPreview}>
          <div className={pdfContent}>
            <div className={pdfHeader}>
              <h2 className={pdfHeaderTitle}>SAN JUAN DE LURIGANCHO</h2>
              <p className={pdfSubtitle}>es momento de crecer</p>
              <p className={pdfYear}>"Año de la recuperación y consolidación de la economía peruana"</p>
            </div>

            <div className={pdfInfo}>
              <div className={infoRow}>
                <strong className={infoLabel}>INFORME N°</strong>
                {incidencia.status === 'approved' ? (
                  <input
                    value={formData.numeroInforme}
                    readOnly
                    className={infoInputApproved}
                    title="Código generado automáticamente al aprobar"
                  />
                ) : (
                  <div className="flex-1">
                    <div className="rounded-[4px] border border-[rgba(245,158,11,0.5)] bg-[rgba(245,158,11,0.1)] px-3 py-2 text-[0.9rem] italic text-[#f59e0b]">
                      ⏳ Se generará automáticamente al aprobar el informe
                    </div>
                    <div className="mt-1.5 rounded-[4px] bg-[rgba(59,130,246,0.1)] px-2 py-1.5 text-[0.75rem] leading-[1.4] text-content-2">
                      <strong className={infoLabel}>ℹ️ Nota:</strong> El código del informe será asignado automáticamente por el sistema
                      con el número correlativo y año correspondiente una vez que el informe sea aprobado.
                      Hasta entonces, no es necesario ingresar ningún código manualmente.
                    </div>
                  </div>
                )}
              </div>

              <div className={infoRow}>
                <strong className={infoLabel}>A :</strong>
                <div className={infoInputGroup}>
                  <span>Sr.</span>
                  <input
                    value={formData.destinatarioNombre}
                    onChange={e => handleChange('destinatarioNombre', e.target.value.toUpperCase())}
                    className={cn(infoInput, 'w-full uppercase')}
                  />
                  <input
                    value={formData.destinatarioCargo}
                    onChange={e => handleChange('destinatarioCargo', e.target.value.toUpperCase())}
                    placeholder="Cargo"
                    className={cn(infoInput, 'w-full uppercase')}
                  />
                </div>
              </div>

              {incidencia.cc && incidencia.cc.length > 0 && (
                <div className={infoRow}>
                  <strong className={infoLabel}>CC :</strong>
                  <span>{incidencia.cc.join(', ').toUpperCase()}</span>
                </div>
              )}

              <div className={infoRow}>
                <strong className={infoLabel}>DE :</strong>
                <span>CONTROL Y SUPERVISIÓN</span>
              </div>

              <div className={infoRow}>
                <strong className={infoLabel}>ASUNTO :</strong>
                <input
                  value={incidencia.asunto}
                  disabled
                  className={cn(infoInput, 'uppercase')}
                />
              </div>

              <div className={infoRow}>
                <strong className={infoLabel}>FECHA :</strong>
                <input
                  value={formData.fecha}
                  onChange={e => handleChange('fecha', e.target.value.toUpperCase())}
                  className={cn(infoInput, 'uppercase')}
                />
              </div>
            </div>

            <hr className={pdfSeparator} />

            <div className={pdfBody}>
              {/* Mostrar contenido simplificado para inasistencias (modelo del validador) */}
              {esInasistencia ? (
                <>
                  {/* Párrafo descriptivo del reporte de inasistencias */}
                  <div className="mt-[15px] text-justify text-[10px] leading-[1.6]">
                    <p className="m-0 mb-2.5 indent-[40px]">
                      Tengo el agrado de dirigirme a Ud, con la finalidad de saludarlo, a la vez
                      informarle sobre el reporte de inasistencias al centro de labores del personal
                      de la Subgerencia de Serenazgo, correspondiente del turno{' '}
                      <strong>
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
                      </strong>.
                      Durante el período{' '}
                      <strong>
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
                      <strong>{incidencia.absenceMode === 'JUSTIFIED' || formData.tipoInasistencia === 'Justificada' ? 'justificadas' : 'injustificadas'}</strong>{' '}
                      por parte del personal mencionado.
                    </p>
                  </div>

                  {/* Tabla de inasistencias */}
                  {loadingAttendance ? (
                    <div className="p-5 text-center text-[10px] text-[#666]">
                      Cargando inasistencias...
                    </div>
                  ) : attendanceData.length === 0 ? (
                    <div className="mt-2.5 rounded-[4px] bg-[#f8fafc] p-5 text-center text-[10px] italic text-[#666]">
                      No hay inasistencias registradas en el período seleccionado
                    </div>
                  ) : (
                    <div className={tableWrap}>
                      <table className={tableStyle}>
                        <thead>
                          <tr className="bg-[#f0f0f0]">
                            <th className={cn(tableCell, 'text-center')}>N°</th>
                            <th className={cn(tableCell, 'text-left')}>APELLIDOS Y NOMBRES</th>
                            <th className={cn(tableCell, 'text-center')}>CARGO</th>
                            <th className={cn(tableCell, 'text-center')}>REG. LAB.</th>
                            <th className={cn(tableCell, 'text-center')}>TURNO</th>
                            <th className={cn(tableCell, 'text-center')}>FECHA</th>
                            <th className={cn(tableCell, 'text-center')}>TIPO DE INASISTENCIA</th>
                            <th className={cn(tableCell, 'text-center')}>JURISDICCION</th>
                          </tr>
                        </thead>
                        <tbody>
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

                              return (
                                <tr key={person.id || index}>
                                  <td className={cn(tableCell, 'text-center')}>{index + 1}</td>
                                  <td className={tableCell}>
                                    {person.name && person.lastname
                                      ? `${person.lastname} ${person.name}`.toUpperCase()
                                      : person.fullname?.toUpperCase() || '-'}
                                  </td>
                                  <td className={cn(tableCell, 'text-center')}>
                                    {jobValue}
                                  </td>
                                  <td className={cn(tableCell, 'text-center')}>
                                    {regimeValue}
                                  </td>
                                  <td className={cn(tableCell, 'text-center')}>
                                    {shiftValue}
                                  </td>
                                  <td className={cn(tableCell, 'text-center text-[7px]')}>
                                    {fechas}
                                  </td>
                                  <td className={cn(tableCell, 'text-center')}>
                                    {incidencia.absenceMode === 'JUSTIFIED' || formData.tipoInasistencia === 'Justificada' ? 'JUSTIFICADA' : 'INJUSTIFICADA'}
                                  </td>
                                  <td className={cn(tableCell, 'text-center')}>
                                    {jurisdictionValue}
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className={pdfIntro}>Es grato dirigirme a Ud. con la finalidad de informarle lo siguiente:</p>

                  <div className={editableSection}>
                    <label className={editLabel}>Hora del incidente:</label>
                    <input
                      type="text"
                      value={formData.horaIncidente}
                      onChange={e => handleChange('horaIncidente', e.target.value)}
                      className={editInput}
                    />
                  </div>

                  <div className={editableSection}>
                    <label className={editLabel}>Fecha del incidente:</label>
                    <input
                      type="text"
                      value={formData.fechaIncidente}
                      onChange={e => handleChange('fechaIncidente', e.target.value)}
                      className={editInput}
                    />
                  </div>

                  <div className={editableSection}>
                    <label className={editLabel}>Ubicación (Dirección):</label>
                    <input
                      type="text"
                      value={formData.ubicacion}
                      onChange={e => handleChange('ubicacion', e.target.value)}
                      placeholder="Dirección completa del incidente"
                      className={editInput}
                    />
                  </div>

                  <div className={editableSection}>
                    <label className={editLabel}>Jurisdicción:</label>
                    <input
                      type="text"
                      value={formData.jurisdiccion}
                      onChange={e => handleChange('jurisdiccion', e.target.value)}
                      className={editInput}
                    />
                  </div>

                  <div className={editableSection}>
                    <label className={editLabel}>Sereno:</label>
                    <input
                      type="text"
                      value={formData.sereno}
                      readOnly
                      className={editInputReadOnly}
                    />
                  </div>

                  <div className={editableSection}>
                    <label className={editLabel}>DNI:</label>
                    <input
                      type="text"
                      value={formData.dni}
                      readOnly
                      className={editInputReadOnly}
                    />
                  </div>

                  <div className={editableSection}>
                    <label className={editLabel}>Cargo:</label>
                    <input
                      type="text"
                      value={formData.cargo}
                      readOnly
                      className={editInputReadOnly}
                    />
                  </div>

                  <div className={editableSection}>
                    <label className={editLabel}>Reg. Lab:</label>
                    <input
                      type="text"
                      value={formData.regLab}
                      readOnly
                      className={editInputReadOnly}
                    />
                  </div>

                  <div className={editableSection}>
                    <label className={editLabel}>Falta:</label>
                    <input
                      type="text"
                      value={formData.falta}
                      readOnly
                      className={editInputReadOnly}
                    />
                  </div>
                </>
              )}

              {!esInasistencia && (
                <>
                  <div className={editableSection}>
                    <label className={editLabel}>Artículo:</label>
                    <input
                      type="text"
                      value={formData.articulo}
                      onChange={e => handleChange('articulo', e.target.value)}
                      className={editInput}
                    />
                  </div>

                  {formData.tipoMedio === 'bodycam' ? (
                    <>
                      <div className={editableSection}>
                        <label className={editLabel}>N° Bodycam:</label>
                        <input
                          type="text"
                          value={formData.bodycam}
                          readOnly
                          className={editInputReadOnly}
                        />
                      </div>

                      <div className={editableSection}>
                        <label className={editLabel}>Bodycam asignada a:</label>
                        <input
                          type="text"
                          value={formData.bodycamAsignadaA}
                          onChange={e => handleChange('bodycamAsignadaA', e.target.value)}
                          className={editInput}
                        />
                      </div>
                    </>
                  ) : (
                    <div className={editableSection}>
                      <label className={editLabel}>N° Cámara:</label>
                      <input
                        type="text"
                        value={formData.numeroCamara}
                        readOnly
                        className={editInputReadOnly}
                      />
                    </div>
                  )}
                </>
              )}

              {!esInasistencia && (
                <div className={editableSection}>
                  <label className={editLabel}>Supervisor:</label>
                  <input
                    type="text"
                    value={formData.supervisor}
                    readOnly
                    className={editInputReadOnly}
                  />
                </div>
              )}

              {!esInasistencia && (
                <div className={editableSection}>
                  <label className={editLabel}>CONTENIDO DEL INFORME:</label>
                  <textarea
                    value={formData.descripcionAdicional}
                    onChange={e => handleChange('descripcionAdicional', e.target.value)}
                    placeholder="Edite el contenido del informe según sea necesario..."
                    rows={18}
                    className={cn(editField, 'resize-y min-h-[70px] leading-[1.6] whitespace-pre-wrap [font-family:inherit]')}
                  />
                  <div className="mt-2 rounded-[4px] border border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.1)] p-2 text-[10px] text-content-2">
                    <strong>💡 Instrucciones:</strong>
                    <ul className="mt-1 ml-5 leading-[1.5]">
                      <li>Complete las secciones marcadas con [INSTRUCCIÓN] con los detalles específicos del incidente</li>
                      <li>Use términos objetivos como "presuntamente", "aparentemente" para describir los hechos</li>
                      <li>Puede editar cualquier parte del texto según sea necesario</li>
                      <li>La plantilla se adapta automáticamente según el tipo de incidente</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Historial de inasistencias ya no se muestra porque la tabla principal ya contiene todos los datos */}

              {!esInasistencia && (
                <>
                  <div className={editableSection}>
                    <label className={editLabel}>Adjuntar imágenes:</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={loadingEvidences || savingReport}
                      className={fileInput}
                    />

                    {loadingEvidences && (
                      <div className="p-3 text-center text-[0.9rem] text-primary">
                        ⏳ Cargando evidencias existentes...
                      </div>
                    )}

                    {formData.imagenes.length > 0 && (
                      <div className={imagesPreview}>
                        {formData.imagenes.map((img, index) => (
                          <div key={index} className={imageContainer}>
                            <div className={imageItem}>
                              <img src={img.base64 || img.url} alt={img.name} className={imageImg} />
                              {img.isExisting && (
                                <span className="absolute top-[5px] left-[5px] rounded-[4px] bg-[rgba(59,130,246,0.9)] px-2 py-0.5 text-[10px] font-bold text-white">
                                  GUARDADA
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className={btnRemoveImg}
                                disabled={savingReport}
                              >
                                ×
                              </button>
                            </div>
                            <div className="mt-2">
                              <label className="mb-1 block text-[12px] font-bold uppercase tracking-[0.5px] text-primary!">
                                Anexo {index + 1} (OBLIGATORIO):
                              </label>
                              <textarea
                                value={img.anexo || ''}
                                onChange={(e) => updateImageAnexo(index, e.target.value)}
                                placeholder="⚠️ Descripción OBLIGATORIA para esta imagen..."
                                rows={2}
                                disabled={savingReport}
                                className={cn(
                                  'w-full rounded-[4px] p-1.5 text-[11px] text-[#000000]! min-h-[70px] resize-y [font-family:inherit] transition-all duration-300 ease-[ease] focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,58,138,0.1)]',
                                  validationErrors.includes(index)
                                    ? 'border-2 border-[#dc2626] bg-[#fee2e2]'
                                    : 'border border-[#ddd] bg-white'
                                )}
                              />
                              {validationErrors.includes(index) && (
                                <span className="mt-1 block text-[11px] font-medium text-[#dc2626]">
                                  ⚠️ Esta imagen requiere una descripción
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={editableSection}>
                    <label className={editLabel}>Links de referencia:</label>
                    <textarea
                      value={formData.links}
                      onChange={e => handleChange('links', e.target.value)}
                      placeholder="https://ejemplo.com&#10;https://otro-link.com"
                      rows={3}
                      className={`${editInput} resize-y min-h-[70px]`}
                    />
                  </div>
                </>
              )}
            </div>

            <div className={pdfFooter}>
              <p className="my-[3px]">Sede CECOM de la Sub Gerencia de Serenazgo:</p>
              <p className="my-[3px]">Av. Sta. Rosa de Lima, San Juan de Lurigancho 15427</p>
            </div>
          </div>
        </div>

        <div className={modalActions}>
          <button
            className={btnSecondary}
            onClick={onClose}
            disabled={savingReport}
          >
            Cancelar
          </button>
          <button
            className={cn(btnSecondary, 'ml-2.5')}
            onClick={guardarCambios}
            disabled={savingReport || loadingEvidences}
          >
            {savingReport ? '💾 Guardando...' : 'Guardar'}
          </button>
          <button
            className={btnPrimary}
            onClick={generarPDF}
            disabled={savingReport || loadingEvidences}
          >
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  )
}