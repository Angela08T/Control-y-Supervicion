import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'

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
    paddingTop: 80,        // Margen superior aumentado para evitar solapamiento con header
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
    width: 150,
    height: 50,
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
    marginBottom: 15,
    lineHeight: 1.8
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
    display: 'table',
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
    width: 450,
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

// Componente para el header
const PDFHeader = ({ logoBase64 }) => {
  return (
    <View style={styles.header} fixed>
      {/* Logo */}
      <View style={styles.logoContainer}>
        {logoBase64 && <Image src={logoBase64} style={styles.logo} />}
      </View>

      {/* Año */}
      <Text style={[styles.headerText, {
        fontSize: 9,
        fontStyle: 'italic',
        marginTop: -5,
        color: '#444'
      }]}>"Año de la Esperanza y el Fortalecimiento de la Democracia"
      </Text>
    </View>
  )
}

// Componente para la sección de info
const PDFInfoSection = ({ formData, incidencia }) => (
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

    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>FECHA :</Text>
      <Text style={styles.infoValue}>
        {`SAN JUAN DE LURIGANCHO, ${formData.fecha}`.toUpperCase()}
      </Text>
    </View>

    <View style={styles.separator} />
  </View>
)

// Componente para el cuerpo del informe
const PDFBody = ({ formData, incidencia }) => {
  const esInasistencia = incidencia.asunto === 'Conductas relacionadas con el Cumplimiento del Horario y Asistencia' &&
    incidencia.falta && incidencia.falta.startsWith('Inasistencia')

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
const PDFHistorialTable = ({ inasistenciasHistoricas, formatearFecha }) => {
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
const PDFImages = ({ imagenes }) => {
  if (!imagenes || imagenes.length === 0) return null

  // Agrupar imágenes de 2 en 2
  const imagePairs = []
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
              <Image src={img.base64} style={styles.evidenceImage} />
            </View>
            {img.anexo && (
              <Text style={styles.imageCaption}>
                Anexo {globalIndex + 1}: {img.anexo}
              </Text>
            )}
          </View>
        )
      })}
    </View>
  ))
}

// Componente para links
const PDFLinks = ({ links }) => {
  if (!links) return null

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.sectionTitle}>Links de referencia:</Text>
      <Text style={styles.bodyText}>{links}</Text>
    </View>
  )
}

// Componente para la firma
const PDFSignature = () => (
  <View style={styles.signatureSection}>
    <View style={styles.signatureLine} />
    <Text style={styles.signatureName}>[NOMBRE DEL FIRMANTE]</Text>
  </View>
)

// Componente para footer
const PDFFooter = () => (
  <View style={styles.footer} fixed>
    <Text>Sede CECOM de la Sub Gerencia de Serenazgo:</Text>
    <Text>Av. Sta. Rosa de Lima, San Juan de Lurigancho 15427</Text>
  </View>
)

// Componente principal del documento
const InformePDFDocument = ({
  formData,
  incidencia,
  inasistenciasHistoricas = [],
  logoBase64,
  formatearFecha,
  esInasistencia // Recibir prop directa
}) => {
  // Usar la prop o fallback a la lógica anterior si no se pasa (para retrocompatibilidad)
  const isAbsence = esInasistencia !== undefined
    ? esInasistencia
    : (incidencia.asunto === 'Conductas relacionadas con el Cumplimiento del Horario y Asistencia' &&
      incidencia.falta && incidencia.falta.startsWith('Inasistencia'))

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader logoBase64={logoBase64} />
        <PDFInfoSection formData={formData} incidencia={incidencia} />
        <PDFBody formData={formData} incidencia={incidencia} />

        {isAbsence && inasistenciasHistoricas.length > 0 && (
          <PDFHistorialTable
            inasistenciasHistoricas={inasistenciasHistoricas}
            formatearFecha={formatearFecha}
          />
        )}

        {isAbsence && <PDFSignature />}

        {!isAbsence && (
          <>
            <PDFImages imagenes={formData.imagenes} />
            <PDFLinks links={formData.links} />
            <PDFSignature />
          </>
        )}

        <PDFFooter />
      </Page>
    </Document>
  )
}

export default InformePDFDocument
