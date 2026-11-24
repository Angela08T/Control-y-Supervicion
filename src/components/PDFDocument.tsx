import { assignmentFields, isOptionalAssignmentField } from '../utils/serviceAssignment'
import type { Opening } from '../utils/reportOpening'
import { formatReportMedia } from '../utils/incidenciaFormat'
import type { ReportMedium, Recipient } from '../types/report.types'
import type { ServiceAssignment } from '../types/report.types'
import React from 'react'
import type { ReportWithEvidences } from '../types/report.types'
import { firmanteInforme } from './FirmaInforme'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

// Registrar fuente (opcional - @react-pdf/renderer viene con Helvetica por defecto)
// Font.register({
//   family: 'Helvetica',
//   fonts: [
//     { src: 'Helvetica' },
//     { src: 'Helvetica-Bold', fontWeight: 'bold' }
//   ]
// })

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    paddingTop: 91,        // Margen superior aumentado para evitar solapamiento con header
    paddingBottom: 60,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.5
  },
  // Header
  header: {
    position: 'absolute',
    top: 15,
    left: 50,
    right: 50,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 0
  },
  logo: {
    width: 178,
    height: 56,
    objectFit: 'contain',
    marginBottom: 5
  },
  headerText: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  // Info section
  infoSection: {
    marginBottom: 20,
    marginTop: 10
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10
  },
  infoLabel: {
    width: 90,
    fontSize: 11,
    fontWeight: 'bold'
  },
  infoValue: {
    flex: 1,
    fontSize: 11
  },
  infoValueUpper: {
    flex: 1,
    fontSize: 11,
    textTransform: 'uppercase'
  },
  separator: {
    borderBottom: '2px solid #000',
    marginVertical: 15
  },
  // Body
  bodyText: {
    fontSize: 11,
    textAlign: 'justify',
    marginBottom: 8,
    lineHeight: 1.65
  },
  introText: {
    fontSize: 11,
    textAlign: 'justify',
    marginBottom: 18,
    lineHeight: 1.8
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15
  },
  // Table
  table: {
    // react-pdf no tipa 'table' (se conserva el valor original)
    display: 'table' as unknown as 'flex',
    width: '100%',
    marginVertical: 20,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#333'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
    borderBottomStyle: 'solid',
    minHeight: 28,
    alignItems: 'center'
  },
  tableHeader: {
    backgroundColor: '#e8e8e8',
    fontWeight: 'bold'
  },
  tableCol: {
    width: '25%',
    padding: 10,
    fontSize: 10
  },
  tableCell: {
    fontSize: 10
  },
  // Image
  imagePairContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginVertical: 5
  },
  imageContainer: {
    marginVertical: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  imageWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 250,
    backgroundColor: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: 4
  },
  evidenceImage: {
    maxWidth: '95%',
    maxHeight: '95%',
    objectFit: 'contain'
  },
  imageCaption: {
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    width: '100%',
    lineHeight: 1.4,
    marginTop: 8
  },
  // Signature section
  signatureSection: {
    marginTop: 40,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    width: '100%'
  },
  signatureLine: {
    width: 250,
    borderTop: '1px solid #000',
    marginBottom: 8
  },
  signatureName: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 50,
    right: 50,
    fontSize: 8,
    color: '#555',
    borderTop: '1px solid #ccc',
    paddingTop: 5,
    lineHeight: 1.3
  }
})

/** Imagen de evidencia (base64) con su anexo opcional */
interface ImagenInforme {
  base64: string | Blob | null
  anexo?: string | null
}

/** Datos del formulario del informe que el PDF lee */
interface InformeFormData extends ServiceAssignment {
  horaIncidente?: string
  fechaIncidente?: string
  ubicacion?: string
  dni?: string | null
  cargo?: string | null
  regLab?: string | null
  numeroInforme?: string | null
  destinatarioNombre?: string | null
  destinatarioCargo?: string | null
  areaEmisora?: string | null
  falta?: string | null
  tipoInasistencia?: string | null
  fecha?: string | null
  descripcionAdicional?: string | null
  nombreCompleto?: string | null
  sereno?: string | null
  supervisor?: string | null
  imagenes?: ImagenInforme[] | null
  links?: string | null
}

/** Incidencia que el PDF lee (solo los campos usados aqui) */
interface IncidenciaInforme {
  media?: ReportMedium[] | null
  asunto: string
  falta: string
  copias?: Recipient[]
  cc?: string[] | null
}

/** Fila del historial de inasistencias incluida en el PDF */
interface InasistenciaHistorica {
  nombreCompleto?: string | null
  sereno?: string | null
  cargo?: string | null
  regLab?: string | null
  turno?: string | null
  fechaFalta?: string | null
  fechaIncidente?: string | null
  tipoInasistencia?: string | null
  jurisdiccion?: string | null
}

type FormatearFecha = (fecha: string) => string

export interface PDFHeaderProps {
  logoBase64?: string | null
}

export interface PDFInfoSectionProps {
  formData: InformeFormData
  incidencia: IncidenciaInforme
}

export interface PDFBodyProps {
  formData: InformeFormData
  incidencia: IncidenciaInforme
}

export interface PDFHistorialTableProps {
  inasistenciasHistoricas?: InasistenciaHistorica[] | null
  formatearFecha?: FormatearFecha
}

export interface PDFImagesProps {
  imagenes?: ImagenInforme[] | null
}

export interface PDFLinksProps {
  links?: string | null
}

export interface InformePDFDocumentProps {
  signature?: string
  approvedReport?: ReportWithEvidences
  formData: InformeFormData
  incidencia: IncidenciaInforme
  inasistenciasHistoricas?: InasistenciaHistorica[]
  logoBase64?: string | null
  formatearFecha?: FormatearFecha
  esInasistencia?: boolean | ''
}

// Componente para el header
const PDFHeader = ({ logoBase64 }: PDFHeaderProps) => {
  return (
    <View style={styles.header} fixed>
      {/* Logo */}
      <View style={styles.logoContainer}>
        {logoBase64 && <Image src={logoBase64} style={styles.logo} />}
      </View>

      {/* Año */}
      <Text style={[styles.headerText, {
        fontSize: 9,
        fontWeight: 'normal',
        marginTop: -3,
        color: '#444'
      }]}>"Año de la Esperanza y el Fortalecimiento de la Democracia"
      </Text>
    </View>
  )
}

// Componente para la sección de info
const PDFInfoSection = ({ formData, incidencia }: PDFInfoSectionProps) => (
  <View style={styles.infoSection}>
    {/* Solo mostrar INFORME N° si el informe está aprobado y tiene código */}
    {formData.numeroInforme && (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>INFORME N°</Text>
        <Text style={styles.infoValue}>{formData.numeroInforme}</Text>
      </View>
    )}

    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>A :</Text>
      <Text style={styles.infoValue}>
        Sr. {formData.destinatarioNombre?.toUpperCase()}{'\n'}
        {formData.destinatarioCargo?.toUpperCase()}
      </Text>
    </View>

    {incidencia.cc && incidencia.cc.length > 0 && (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>CC :</Text>
        <Text style={[styles.infoValue, { textTransform: 'uppercase' }]}>{incidencia.cc.join(', ')}</Text>
      </View>
    )}

    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>DE :</Text>
      <Text style={[styles.infoValue, {
        fontWeight: 'bold'
      }]}>{formData.areaEmisora || 'CONTROL Y SUPERVISIÓN'} </Text>
    </View>

    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>ASUNTO :</Text>
      <Text style={styles.infoValueUpper}>{incidencia.asunto}</Text>
    </View>

    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>FALTA :</Text>
      <Text style={styles.infoValueUpper}>{formData.falta}</Text>
    </View>

    {formData.falta && formData.falta.startsWith('Inasistencia') && formData.tipoInasistencia && (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>TIPO :</Text>
        <Text style={styles.infoValueUpper}>{formData.tipoInasistencia}</Text>
      </View>
    )}

    {!!incidencia.media?.length && (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>MEDIOS :</Text>
        <Text style={styles.infoValue}>{formatReportMedia(incidencia.media)}</Text>
      </View>
    )}

    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>FECHA :</Text>
      <Text style={styles.infoValue}>
        {`SAN JUAN DE LURIGANCHO, ${formData.fecha}`.toUpperCase()}
      </Text>
    </View>

    <View style={styles.separator} />
  </View>
)

type IdentifiedPerson = ServiceAssignment & {
  name?: string | null
  dni?: string | null
  job?: string | null
  regime?: string | null
}

function PersonReportBody({ person, message, date, time, place }: {
  person: IdentifiedPerson; message: string; date?: string | null; time?: string; place?: string | null
}) {
  const reportedName = [person.reported_name, person.reported_lastname].filter(Boolean).join(' ')
  const lines = message.trim().split(/\r?\n/)
  const header = /^\s*(?:I[.)]?\s+)?IDENTIFICACI[ÓO]N DEL SERENO\s*:?\s*$/i
  const description = /^\s*(?:II[.)]?\s+)?DESCRIPCI[ÓO]N DE LOS HECHOS\s*:?\s*$/i
  const start = lines.findIndex(line => header.test(line))
  const intro = start >= 0 ? lines.slice(0, start) : []
  const body = start >= 0 ? lines.slice(start + 1) : [...lines]
  if (start < 0 && /^Es grato dirigirme/i.test(body[0]?.trim())) intro.push(body.shift()!)
  const greeting = /^Es grato dirigirme/i.test(intro[0]?.trim())
    ? intro.shift()!.trim() : 'Es grato dirigirme a Ud. con la finalidad de informarle lo siguiente:'
  const startDate = person.service_start
    ? new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(person.service_start + 'T00:00:00Z')) : ''
  const fields = [
    ['Nombres y apellidos', reportedName || person.name], ['DNI', person.reported_dni || person.dni], ['Fecha de inicio', startDate],
    ['Cargo', person.reported_job || person.job], ['Régimen laboral', person.reported_regime || person.regime], ['Zona', person.assigned_zone],
    ['Sector', person.assigned_sector], ['Radio', person.assigned_radio],
  ]
  const omittedLabels = new Set<string>(assignmentFields.filter(([key]) =>
    isOptionalAssignmentField(key) && person.omitted_assignment_fields?.includes(key)).map(([, label]) => label))
  // Recuperar valores de los informes antiguos que guardaban la ficha dentro del texto.
  if (start >= 0) {
    while (body.length) {
      const line = body[0].trim().replace(/^[•*-]\s*/, '')
      if (!line) { body.shift(); continue }
      const colon = line.indexOf(':')
      const field = fields.find(([label]) => label?.toLowerCase() === line.slice(0, colon).trim().toLowerCase())
      if (colon < 0 || !field) break
      field[1] ||= line.slice(colon + 1).trim()
      body.shift()
    }
  }
  while (body.length && !body[0].trim()) body.shift()
  if (body.length && description.test(body[0])) body.shift()
  return <View>
    <Text style={{ textAlign: 'center', marginBottom: 12 }}>
      {greeting}
    </Text>
    {intro.join('\n').trim() ? <Text style={styles.bodyText}>{intro.join('\n').trim()}</Text> :
      <Text style={styles.bodyText}>
        {time && date ? `Siendo alrededor de las ${time} del día ${date}` : 'Durante las labores de supervisión'}
        {place && <Text>, en <Text style={{ fontWeight: 'bold' }}>{place}</Text></Text>}
        {'. Se identificó al siguiente personal durante las labores de monitoreo efectuadas por el Área de Supervisión y Control:'}
      </Text>}

    <View wrap={false} style={{ marginVertical: 8 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>I.       IDENTIFICACIÓN DEL SERENO</Text>
      {fields.filter(([label]) => !omittedLabels.has(label!)).map(([label, value]) => <Text key={label} style={{ marginBottom: 5 }}>
        {'•  '}<Text style={{ fontWeight: 'bold' }}>{label}: </Text>{value?.trim() || 'No consignado'}
      </Text>)}
    </View>
    {body.join('\n').trim() && <Text style={styles.bodyText} orphans={3}>
      <Text style={{ fontWeight: 'bold' }}>II. DESCRIPCIÓN DE LOS HECHOS</Text>{'\n'}
      {body.join('\n').trim()}
    </Text>}
  </View>
}

// Componente para el cuerpo del informe
const PDFBody = ({ formData, incidencia }: PDFBodyProps) => {
  const esInasistencia = incidencia.asunto === 'Conductas relacionadas con el Cumplimiento del Horario y Asistencia' &&
    incidencia.falta && incidencia.falta.startsWith('Inasistencia')

  if (formData.dni || formData.sereno) {
    return <PersonReportBody person={{ ...formData, name: formData.sereno || formData.nombreCompleto,
      job: formData.cargo, regime: formData.regLab }} date={formData.fechaIncidente} time={formData.horaIncidente} place={formData.ubicacion} message={formData.descripcionAdicional || ''} />
  }

  return (
    <View>
      {formData.descripcionAdicional ? (
        <Text style={styles.bodyText}>{formData.descripcionAdicional}</Text>
      ) : esInasistencia ? (
        <>
          <Text style={styles.bodyText}>
            Tengo el agrado de dirigirme a usted para poner en su conocimiento el detalle del registro correspondiente al personal {formData.nombreCompleto?.toUpperCase() || formData.sereno} bajo su jurisdicción, en relación a las asistencias e inasistencias con los días indicados.
          </Text>
          <Text style={styles.bodyText}>
            Se adjunta el presente reporte con la información consolidada, a fin de su conocimiento y las acciones administrativas que correspondan.
          </Text>
          <Text style={styles.bodyText}>
            Sin otro particular, hago propicia la ocasión para expresarle mis saludos más distinguidos.
          </Text>
        </>
      ) : null}
    </View>
  )
}

// Componente para tabla de historial de inasistencias
const PDFHistorialTable = ({ inasistenciasHistoricas, formatearFecha }: PDFHistorialTableProps) => {
  if (!inasistenciasHistoricas || inasistenciasHistoricas.length === 0) return null

  return (
    <View style={{ marginTop: 20 }}>
      <View style={styles.table}>
        {/* Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={{ width: '5%', padding: 5, borderRightWidth: 1, borderRightColor: '#333' }}>
            <Text style={[styles.tableCell, { fontWeight: 'bold', textAlign: 'center' }]}>N°</Text>
          </View>
          <View style={{ width: '18%', padding: 5, borderRightWidth: 1, borderRightColor: '#333' }}>
            <Text style={[styles.tableCell, { fontWeight: 'bold', textAlign: 'center' }]}>APELLIDOS Y{'\n'}NOMBRES</Text>
          </View>
          <View style={{ width: '13%', padding: 5, borderRightWidth: 1, borderRightColor: '#333' }}>
            <Text style={[styles.tableCell, { fontWeight: 'bold', textAlign: 'center' }]}>CARGO</Text>
          </View>
          <View style={{ width: '10%', padding: 5, borderRightWidth: 1, borderRightColor: '#333' }}>
            <Text style={[styles.tableCell, { fontWeight: 'bold', textAlign: 'center' }]}>REG.{'\n'}LAB.</Text>
          </View>
          <View style={{ width: '10%', padding: 5, borderRightWidth: 1, borderRightColor: '#333' }}>
            <Text style={[styles.tableCell, { fontWeight: 'bold', textAlign: 'center' }]}>TURNO</Text>
          </View>
          <View style={{ width: '14%', padding: 5, borderRightWidth: 1, borderRightColor: '#333' }}>
            <Text style={[styles.tableCell, { fontWeight: 'bold', textAlign: 'center' }]}>FECHA</Text>
          </View>
          <View style={{ width: '15%', padding: 5, borderRightWidth: 1, borderRightColor: '#333' }}>
            <Text style={[styles.tableCell, { fontWeight: 'bold', textAlign: 'center' }]}>TIPO DE{'\n'}INASISTENCIA</Text>
          </View>
          <View style={{ width: '15%', padding: 5 }}>
            <Text style={[styles.tableCell, { fontWeight: 'bold', textAlign: 'center' }]}>JURISDICCIÓN</Text>
          </View>
        </View>

        {/* Rows */}
        {inasistenciasHistoricas.map((inasistencia, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={{ width: '5%', padding: 3, borderRightWidth: 1, borderRightColor: '#bfbfbf' }}>
              <Text style={[styles.tableCell, { textAlign: 'center', fontSize: 8 }]}>{index + 1}</Text>
            </View>
            <View style={{ width: '18%', padding: 3, borderRightWidth: 1, borderRightColor: '#bfbfbf' }}>
              <Text style={[styles.tableCell, { fontSize: 7, lineHeight: 1.2 }]}>
                {inasistencia.nombreCompleto?.toUpperCase() || inasistencia.sereno?.toUpperCase() || ''}
              </Text>
            </View>
            <View style={{ width: '13%', padding: 3, borderRightWidth: 1, borderRightColor: '#bfbfbf' }}>
              <Text style={[styles.tableCell, { fontSize: 7, lineHeight: 1.2 }]}>{inasistencia.cargo || ''}</Text>
            </View>
            <View style={{ width: '10%', padding: 3, borderRightWidth: 1, borderRightColor: '#bfbfbf' }}>
              <Text style={[styles.tableCell, { textAlign: 'center', fontSize: 7 }]}>{inasistencia.regLab || ''}</Text>
            </View>
            <View style={{ width: '10%', padding: 3, borderRightWidth: 1, borderRightColor: '#bfbfbf' }}>
              <Text style={[styles.tableCell, { textAlign: 'center', fontSize: 7 }]}>{inasistencia.turno || ''}</Text>
            </View>
            <View style={{ width: '14%', padding: 3, borderRightWidth: 1, borderRightColor: '#bfbfbf' }}>
              <Text style={[styles.tableCell, { fontSize: 7, textAlign: 'center', lineHeight: 1.2 }]}>
                {inasistencia.fechaFalta || inasistencia.fechaIncidente || ''}
              </Text>
            </View>
            <View style={{ width: '15%', padding: 3, borderRightWidth: 1, borderRightColor: '#bfbfbf' }}>
              <Text style={[styles.tableCell, { textAlign: 'center', fontSize: 7 }]}>
                {inasistencia.tipoInasistencia || ''}
              </Text>
            </View>
            <View style={{ width: '15%', padding: 3 }}>
              <Text style={[styles.tableCell, { fontSize: 7, textAlign: 'center', lineHeight: 1.2 }]}>
                {inasistencia.jurisdiccion || ''}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

// Componente para imágenes (agrupa de 2 en 2 por página)
const PDFImages = ({ imagenes }: PDFImagesProps) => {
  if (!imagenes || imagenes.length === 0) return null

  // Agrupar imágenes de 2 en 2
  const imagePairs: ImagenInforme[][] = []
  for (let i = 0; i < imagenes.length; i += 2) {
    imagePairs.push(imagenes.slice(i, i + 2))
  }

  return imagePairs.map((pair, pairIndex) => (
    <View key={pairIndex} style={styles.imagePairContainer} break>
      {pair.map((img, imgIndex) => {
        const globalIndex = pairIndex * 2 + imgIndex
        return (
          <View key={imgIndex} style={styles.imageContainer}>
            <View style={styles.imageWrapper}>
              {img.base64 ? <Image src={img.base64} style={styles.evidenceImage} />
                : <Text>Archivo de evidencia no disponible.</Text>}
            </View>
            <Text style={styles.imageCaption}>
              <Text style={{ fontWeight: 'bold' }}>ANEXO N°{String(globalIndex + 1).padStart(2, '0')}</Text>
              {img.anexo ? `: ${img.anexo}` : ''}
            </Text>
          </View>
        )
      })}
    </View>
  ))
}

// Componente para links
const PDFLinks = ({ links }: PDFLinksProps) => {
  if (!links) return null

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.sectionTitle}>Links de referencia:</Text>
      <Text style={styles.bodyText}>{links}</Text>
    </View>
  )
}

// Componente para la firma
function ApprovedReportContent({ report, fecha, opening }: { report: ReportWithEvidences; fecha?: string | null; opening: Partial<Opening> }) {
  const person = report.offender
  return <>
    <ReportHeading code={report.code} to={report.header?.to} cc={report.header?.cc || []}
      subject={[report.subject?.name, report.lack?.name].filter(Boolean).join(', ')} fecha={fecha} />
    {person
      ? <PersonReportBody person={{ ...report, ...person, name: [person.name, person.lastname].filter(Boolean).join(' ') }}
          date={opening.fechaIncidente ?? fecha} time={opening.horaIncidente ?? report.date.slice(11, 16)} place={opening.ubicacion ?? report.address} message={report.message || ''} />
      : <Text style={styles.bodyText}>{report.message}</Text>}
    {!!report.media?.length && <Text style={styles.bodyText}>Medios: {formatReportMedia(report.media)}</Text>}
  </>
}

function ReportHeading({ code, to, cc, subject, fecha }: {
  code?: string | null; to?: Recipient; cc: Recipient[]; subject: string; fecha?: string | null
}) {
  const bold = { fontWeight: 'bold' } as const
  function row(label: string, name?: string, job?: string | null, emphasized = true) {
    return (
      <View style={{ flexDirection: 'row', marginBottom: 5, lineHeight: 1.15 }} wrap={false}>
        <Text style={{ width: 70, ...bold }}>{label}</Text>
        <View style={{ flex: 1, lineHeight: 1.15 }}>
          <Text style={emphasized ? bold : undefined}>{name?.toUpperCase()}</Text>
          {job && <Text>{job.toUpperCase()}</Text>}
        </View>
      </View>
    )
  }
  return (
    <View>
      <Text style={{ ...bold, fontSize: 12, textAlign: 'center', textDecoration: 'underline', marginTop: 8, marginBottom: 14 }}>
        INFORME{code ? ` N°${code}-CS-SS-GOP-MDSJL` : ''}
      </Text>
      {row('A:', to?.name, to?.job)}
      {cc.map((recipient, i) => <React.Fragment key={i}>{row(i === 0 ? 'CC:' : '', recipient.name, recipient.job)}</React.Fragment>)}
      {row('DE:', firmanteInforme.nombre, firmanteInforme.cargo)}
      {row('ASUNTO:', subject)}
      {row('FECHA:', 'San Juan de Lurigancho, ' + fecha, null, false)}
      <View style={{ borderBottomWidth: 1, marginBottom: 16 }} />

    </View>
  )
}

const PDFSignature = ({ signature }: { signature?: string }) => (
  <View style={styles.signatureSection} wrap={false}>
    {signature && <Image src={signature} style={{ width: 110, height: 87, objectFit: 'contain' }} />}
    <View style={styles.signatureLine} />
    <Text style={styles.signatureName}>{firmanteInforme.nombre}</Text>
    <Text style={{ fontSize: 10 }}>{firmanteInforme.cargo}</Text>
  </View>
)

// Componente para footer
const PDFFooter = () => (
  <View style={styles.footer} fixed>
    <Text>Sede Siglo XXI de la Sub Gerencia de Serenazgo</Text>
    <Text>Av. Próceres de la Independencia 1568 SJL</Text>
  </View>
)

// Componente principal del documento
const InformePDFDocument = ({
  formData,
  incidencia,
  approvedReport,
  signature,
  inasistenciasHistoricas = [],
  logoBase64,
  formatearFecha,
  esInasistencia // Recibir prop directa
}: InformePDFDocumentProps) => {
  // Usar la prop o fallback a la lógica anterior si no se pasa (para retrocompatibilidad)
  const isAbsence = esInasistencia !== undefined
    ? esInasistencia
    : (incidencia.asunto === 'Conductas relacionadas con el Cumplimiento del Horario y Asistencia' &&
      incidencia.falta && incidencia.falta.startsWith('Inasistencia'))

  return (
    <Document>
      <Page size="A4" style={isAbsence ? styles.page : [styles.page, { paddingLeft: 100, paddingRight: 55 }]}>
        <PDFHeader logoBase64={logoBase64} />
        {approvedReport
          ? <ApprovedReportContent report={approvedReport} fecha={formData.fecha} opening={formData} />
          : <>
              {isAbsence ? <PDFInfoSection formData={formData} incidencia={incidencia} /> :
                <ReportHeading code={formData.numeroInforme} to={{ name: formData.destinatarioNombre || '', job: formData.destinatarioCargo || '' }}
                  cc={incidencia.copias || (incidencia.cc || []).map(name => ({ name, job: '' }))}
                  subject={[incidencia.asunto, incidencia.falta].filter(Boolean).join(', ')} fecha={formData.fecha} />}
              <PDFBody formData={formData} incidencia={incidencia} />
              {!isAbsence && !!incidencia.media?.length && <Text style={styles.bodyText}>Medios: {formatReportMedia(incidencia.media)}</Text>}
            </>}

        {isAbsence && inasistenciasHistoricas.length > 0 && (
          <PDFHistorialTable
            inasistenciasHistoricas={inasistenciasHistoricas}
            formatearFecha={formatearFecha}
          />
        )}

        {(!isAbsence || approvedReport) && (
          <>
            <PDFImages imagenes={formData.imagenes} />
            <PDFLinks links={formData.links} />
          </>
        )}

        {!isAbsence && <View wrap={false} minPresenceAhead={75}>
          <Text style={styles.bodyText}>Sin otro en particular, es todo lo que informo a usted, para los fines que estima determinar.</Text>
          <Text style={{ textAlign: 'right', marginVertical: 5 }}>Atentamente.</Text>
        </View>}
        <PDFSignature signature={signature} />
        <PDFFooter />
      </Page>
    </Document>
  )
}

export default InformePDFDocument
