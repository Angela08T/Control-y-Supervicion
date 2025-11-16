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
    paddingTop: 95,        // Margen superior amplio para el header fijo
    paddingBottom: 90,     // Margen inferior para el footer fijo
    paddingLeft: 50,       // Margen izquierdo (1.8cm)
    paddingRight: 50,      // Margen derecho (1.8cm)
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
    marginBottom: 8
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
    marginVertical: 10
  },
  imageContainer: {
    marginVertical: 15,
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
    height: 280,
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
  // Debug: verificar si llega el logo
  if (logoBase64) {
    console.log('✅ PDFHeader recibió logoBase64, longitud:', logoBase64.length)
  } else {
    console.warn('⚠️ PDFHeader NO recibió logoBase64')
  }

  return (
    <View style={styles.header} fixed>
      <View style={styles.logoContainer}>
        {logoBase64 && <Image src={logoBase64} style={styles.logo} />}
      </View>
      <Text style={styles.headerText}>
        "Año de la recuperación y consolidación de la economía peruana"
      </Text>
    </View>
  )
}

// Componente para la sección de info
const PDFInfoSection = ({ formData, incidencia }) => (
  <View style={styles.infoSection}>
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>INFORME N°</Text>
      <Text style={styles.infoValue}>{formData.numeroInforme}</Text>
    </View>

    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>A :</Text>
      <Text style={styles.infoValue}>
        Sr. {formData.destinatarioNombre?.toUpperCase()}{'\n'}
        {formData.destinatarioCargo}
      </Text>
    </View>

    {incidencia.cc && incidencia.cc.length > 0 && (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>CC :</Text>
        <Text style={styles.infoValue}>{incidencia.cc.join(', ')}</Text>
      </View>
    )}

    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>DE :</Text>
      <Text style={styles.infoValue}>CONTROL Y SUPERVISIÓN</Text>
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
      <Text style={styles.infoValue}>San Juan de Lurigancho, {formData.fecha}</Text>
    </View>

    <View style={styles.separator} />
  </View>
)

// Componente para el cuerpo del informe
const PDFBody = ({ formData, incidencia }) => {
  const esInasistencia = incidencia.falta && incidencia.falta.startsWith('Inasistencia')

  return (
    <View>
      {formData.descripcionAdicional ? (
        <Text style={styles.bodyText}>{formData.descripcionAdicional}</Text>
      ) : esInasistencia ? (
        <>
          <Text style={styles.introText}>
            Es grato dirigirme a Ud. con la finalidad de informarle lo siguiente:
          </Text>
          <Text style={styles.bodyText}>
            Mediante el presente se informa que el día {formData.fechaFalta}, el sereno{' '}
            {formData.nombreCompleto?.toUpperCase() || formData.sereno} (DNI: {formData.dni}),
            con cargo de {formData.cargo}, Reg. Lab {formData.regLab} y turno {formData.turno},
            incurrió en la falta de {formData.falta.toUpperCase()}, la cual ha sido clasificada como{' '}
            {formData.tipoInasistencia?.toLowerCase()}. Dicha incidencia fue registrada el{' '}
            {formData.fechaIncidente} a las {formData.horaIncidente} en la jurisdicción de{' '}
            {formData.jurisdiccion}.
          </Text>
          <Text style={styles.bodyText}>
            Se adjunta al presente, la información del señor{' '}
            {formData.nombreCompleto?.toUpperCase() || formData.sereno} y el historial de
            inasistencias correspondiente.
          </Text>
        </>
      ) : null}
    </View>
  )
}

// Componente para tabla de historial
const PDFHistorialTable = ({ inasistenciasHistoricas, formatearFecha }) => {
  if (!inasistenciasHistoricas || inasistenciasHistoricas.length === 0) return null

  return (
    <View>
      <Text style={styles.sectionTitle}>HISTORIAL DE INASISTENCIAS DEL PERSONAL:</Text>
      <View style={styles.table}>
        {/* Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Fecha</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Falta</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Tipo</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Fecha Falta</Text>
          </View>
        </View>

        {/* Rows */}
        {inasistenciasHistoricas.map((inasistencia, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{formatearFecha(inasistencia.fechaIncidente)}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{inasistencia.falta}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{inasistencia.tipoInasistencia || 'No especificado'}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {inasistencia.fechaFalta || inasistencia.fechaIncidente}
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
  formatearFecha
}) => {
  const esInasistencia = incidencia.falta && incidencia.falta.startsWith('Inasistencia')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader logoBase64={logoBase64} />
        <PDFInfoSection formData={formData} incidencia={incidencia} />
        <PDFBody formData={formData} incidencia={incidencia} />

        {esInasistencia && inasistenciasHistoricas.length > 0 && (
          <PDFHistorialTable
            inasistenciasHistoricas={inasistenciasHistoricas}
            formatearFecha={formatearFecha}
          />
        )}

        <PDFImages imagenes={formData.imagenes} />
        <PDFLinks links={formData.links} />

        <PDFFooter />
      </Page>
    </Document>
  )
}

export default InformePDFDocument
