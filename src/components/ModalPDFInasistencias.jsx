import React, { useState, useEffect, useMemo } from 'react'
import { pdf } from '@react-pdf/renderer'
import { useSelector } from 'react-redux'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import logoSJL from '../assets/logo-sjl.png'
import { getLeads } from '../api/lead'
import { getSubjects } from '../api/subject'
import { getLacks } from '../api/lack'
import { createAbsenceReport, getAttendances } from '../api/offender'

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottom: '2px solid #1e3a5f',
    paddingBottom: 10
  },
  logo: {
    width: 120,
    height: 50,
    objectFit: 'contain'
  },
  headerText: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a5f'
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
    marginTop: 2
  },
  dateRange: {
    fontSize: 9,
    marginTop: 4,
    color: '#333'
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e3a5f',
    borderBottom: '1px solid #ddd',
    paddingBottom: 4
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  tableHeader: {
    backgroundColor: '#f0f4f8'
  },
  tableCell: {
    padding: 6,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#ddd'
  },
  tableCellHeader: {
    fontWeight: 'bold',
    fontSize: 8
  },
  colNum: { width: '5%' },
  colNombre: { width: '25%' },
  colDNI: { width: '12%' },
  colTurno: { width: '10%' },
  colCargo: { width: '15%' },
  colRegimen: { width: '10%' },
  colTotal: { width: '8%' },
  colFechas: { width: '15%' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTop: '1px solid #ddd',
    paddingTop: 10
  },
  summary: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4
  },
  summaryText: {
    fontSize: 9,
    marginBottom: 4
  },
  noData: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    fontStyle: 'italic'
  }
})

// Componente del documento PDF
function InasistenciasPDFDocument({ data, dateRange, logoBase64, username }) {
  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatDateRange = () => {
    if (!dateRange?.start || !dateRange?.end) return ''
    const options = { day: '2-digit', month: 'short', year: 'numeric' }
    const startStr = dateRange.start.toLocaleDateString('es-PE', options)
    const endStr = dateRange.end.toLocaleDateString('es-PE', options)
    return `${startStr} - ${endStr}`
  }

  // Calcular totales
  const totalInasistencias = data.reduce((sum, person) => sum + (person.totalFaltas || 0), 0)
  const totalJustificadas = data.reduce((sum, person) => sum + (person.justificadas || 0), 0)
  const totalInjustificadas = data.reduce((sum, person) => sum + (person.injustificadas || 0), 0)

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {logoBase64 && (
            <Image style={styles.logo} src={logoBase64} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>REPORTE DE INASISTENCIAS DE SERVICIO</Text>
            <Text style={styles.subtitle}>Sistema Centinela - Control y Supervisión</Text>
            <Text style={styles.dateRange}>Período: {formatDateRange()}</Text>
          </View>
        </View>

        {/* Tabla de inasistencias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle de Inasistencias por Personal</Text>

          {data.length === 0 ? (
            <Text style={styles.noData}>No hay inasistencias registradas en el período seleccionado</Text>
          ) : (
            <View style={styles.table}>
              {/* Header de la tabla */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableCellHeader, styles.colNum]}>#</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, styles.colNombre]}>Apellidos y Nombres</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, styles.colDNI]}>DNI</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, styles.colTurno]}>Turno</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, styles.colCargo]}>Cargo</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, styles.colRegimen]}>Régimen</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, styles.colTotal]}>Total</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, styles.colFechas]}>Fechas</Text>
              </View>

              {/* Filas de datos */}
              {data.map((person, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colNum]}>{index + 1}</Text>
                  <Text style={[styles.tableCell, styles.colNombre]}>{person.nombreCompleto || '-'}</Text>
                  <Text style={[styles.tableCell, styles.colDNI]}>{person.dni || '-'}</Text>
                  <Text style={[styles.tableCell, styles.colTurno]}>{person.turno || '-'}</Text>
                  <Text style={[styles.tableCell, styles.colCargo]}>{person.cargo || '-'}</Text>
                  <Text style={[styles.tableCell, styles.colRegimen]}>{person.regimen || '-'}</Text>
                  <Text style={[styles.tableCell, styles.colTotal]}>{person.totalFaltas || 0}</Text>
                  <Text style={[styles.tableCell, styles.colFechas]}>{person.fechas || '-'}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Resumen */}
        {data.length > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryText}>Total de personal con inasistencias: {data.length}</Text>
            <Text style={styles.summaryText}>Total de inasistencias: {totalInasistencias}</Text>
            <Text style={styles.summaryText}>Justificadas: {totalJustificadas} | Injustificadas: {totalInjustificadas}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generado por: {username || 'Sistema'} | Fecha: {new Date().toLocaleDateString('es-PE')}</Text>
          <Text>Sede CECOM - Sub Gerencia de Serenazgo - Av. Sta. Rosa de Lima, San Juan de Lurigancho</Text>
        </View>
      </Page>
    </Document>
  )
}

export default function ModalPDFInasistencias({ onClose, inasistencias, savedAttendances, dateRange: initialDateRange, onReportCreated }) {
  const { username } = useSelector((state) => state.auth)
  const [logoBase64, setLogoBase64] = useState('')
  const [generating, setGenerating] = useState(false)

  // Estados para el formulario del reporte
  const [leads, setLeads] = useState([])
  const [subjects, setSubjects] = useState([])
  const [lacks, setLacks] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Estados del formulario
  const [selectedTo, setSelectedTo] = useState('')
  const [selectedCc, setSelectedCc] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedLack, setSelectedLack] = useState('')
  const [selectedMode, setSelectedMode] = useState('UNJUSTIFIED')

  // Estado para el rango de fechas (editable en el modal)
  const [dateRange, setDateRange] = useState(() => {
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
  const [reportResult, setReportResult] = useState(null)

  // Estado para los datos de inasistencias filtrados
  const [filteredAttendances, setFilteredAttendances] = useState([])
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
        const leadsData = leadsRes.data?.data || leadsRes.data || []
        const subjectsData = subjectsRes.data?.data || subjectsRes.data || []
        const lacksData = lacksRes.data?.data || lacksRes.data || []

        setLeads(Array.isArray(leadsData) ? leadsData : [])
        setSubjects(Array.isArray(subjectsData) ? subjectsData : [])
        setLacks(Array.isArray(lacksData) ? lacksData : [])

        // Buscar y preseleccionar el asunto de "conductas relacionadas con el cumplimiento del horario y asistencia"
        const subjectsArray = Array.isArray(subjectsData) ? subjectsData : []
        const defaultSubject = subjectsArray.find(s => {
          const name = typeof s.name === 'string' ? s.name.toLowerCase() : (s.description || '').toLowerCase()
          return name.includes('conductas') && name.includes('horario') && name.includes('asistencia')
        })
        if (defaultSubject) {
          setSelectedSubject(defaultSubject.id)
        }

        // Buscar y preseleccionar la falta de "inasistencia"
        const lacksArray = Array.isArray(lacksData) ? lacksData : []
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
          setLogoBase64(reader.result)
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
  const handleToChange = (leadId) => {
    setSelectedTo(leadId)
    // Si el lead seleccionado estaba en CC, quitarlo
    if (selectedCc.includes(leadId)) {
      setSelectedCc(prev => prev.filter(id => id !== leadId))
    }
  }

  // Manejar selección de CC (múltiple)
  const handleCcChange = (leadId) => {
    setSelectedCc(prev => {
      if (prev.includes(leadId)) {
        return prev.filter(id => id !== leadId)
      } else {
        return [...prev, leadId]
      }
    })
  }

  // Procesar datos para el PDF
  const pdfData = useMemo(() => {
    const personasMap = {}

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
            const date = new Date(dateObj.date)
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

  async function handleGeneratePDF() {
    // Validar campos requeridos
    if (!selectedTo) {
      alert('Debe seleccionar un destinatario principal')
      return
    }
    if (!selectedSubject) {
      alert('Debe seleccionar un asunto')
      return
    }
    if (!selectedLack) {
      alert('Debe seleccionar una falta')
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
      const ccLeads = selectedCc.map(ccId => {
        const lead = leads.find(l => l.id === ccId)
        if (!lead) return null
        // Asegurar que job sea string
        const jobValue = typeof lead.job === 'object' ? (lead.job?.name || '') : (lead.job || '')
        return {
          name: `${lead.title || ''} ${lead.name || ''} ${lead.lastname || ''}`.trim(),
          job: jobValue
        }
      }).filter(Boolean)

      // Formatear fechas para la API
      if (!dateRange?.start || !dateRange?.end) {
        throw new Error('El rango de fechas no está definido')
      }
      const startStr = `${dateRange.start.getFullYear()}-${String(dateRange.start.getMonth() + 1).padStart(2, '0')}-${String(dateRange.start.getDate()).padStart(2, '0')}`
      const endStr = `${dateRange.end.getFullYear()}-${String(dateRange.end.getMonth() + 1).padStart(2, '0')}-${String(dateRange.end.getDate()).padStart(2, '0')}`

      // Asegurar que toLead.job sea string
      const toLeadJobValue = typeof toLead.job === 'object' ? (toLead.job?.name || '') : (toLead.job || '')

      // Construir payload para la API
      const reportData = {
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
      const response = await createAbsenceReport(reportData)

      // Obtener el report_id de la respuesta
      const reportId = response.data?.report_id || response.data?.id || '---'

      // Preparar datos para el PDF
      const pdfAttendances = filteredAttendances.map(person => {
        const fechas = person.dates?.filter(d => !d.delete_at).map(d => {
          const date = new Date(d.date)
          return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
        }).join(', ') || '-'

        return {
          name: person.name && person.lastname
            ? `${person.lastname} ${person.name}`.toUpperCase()
            : person.fullname?.toUpperCase() || '-',
          job: typeof person.job === 'object' ? (person.job?.name || '-') : (person.job || '-'),
          regime: typeof person.regime === 'object' ? (person.regime?.name || '-') : (person.regime || '-'),
          shift: typeof person.shift === 'object' ? (person.shift?.name || '-') : (person.shift || '-'),
          jurisdiction: typeof person.jurisdiction === 'object' ? (person.jurisdiction?.name || '-') : (person.jurisdiction || '-'),
          fechas
        }
      })

      // Obtener turnos únicos
      const turnos = [...new Set(filteredAttendances.map(p => {
        if (typeof p.shift === 'object') return p.shift?.name || ''
        return p.shift || ''
      }).filter(Boolean))]
      const turnosStr = turnos.length > 0 ? turnos.join(' / ') : 'MAÑANA / TARDE / NOCHE'

      // Crear el documento PDF
      const doc = (
        <Document>
          <Page size="A4" style={styles.page}>
            {/* Header - Centrado con logo más grande */}
            <View style={{ alignItems: 'center', marginBottom: 15 }}>
              {logoBase64 && (
                <Image style={styles.logo} src={logoBase64} />
              )}
              <Text style={{ fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: 5 }}>es momento de crecer</Text>
            </View>

            {/* Año - Con tamaño de fuente más grande */}
            <Text style={{ textAlign: 'center', fontSize: 10, fontStyle: 'italic', marginBottom: 20 }}>
              "Año de la recuperación y consolidación de la economía peruana"
            </Text>

            {/* Datos del informe - Sin cuadro, solo campos */}
            <View style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Text style={{ width: 90, fontWeight: 'bold', fontSize: 11 }}>INFORME N°</Text>
                <Text style={{ fontSize: 11, flex: 1 }}>{reportId}</Text>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Text style={{ width: 90, fontWeight: 'bold', fontSize: 11 }}>A :</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11 }}>
                    {`${toLead.title || ''} ${toLead.name || ''} ${toLead.lastname || ''}`.trim()}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#333', marginTop: 2 }}>{toLeadJobValue}</Text>
                </View>
              </View>

              {ccLeads.length > 0 && (
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <Text style={{ width: 90, fontWeight: 'bold', fontSize: 11 }}>CC :</Text>
                  <Text style={{ fontSize: 11, flex: 1 }}>{ccLeads.map(c => c.name).join(', ')}</Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Text style={{ width: 90, fontWeight: 'bold', fontSize: 11 }}>DE :</Text>
                <Text style={{ fontSize: 11 }}>CONTROL Y SUPERVISIÓN</Text>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Text style={{ width: 90, fontWeight: 'bold', fontSize: 11 }}>ASUNTO :</Text>
                <Text style={{ fontSize: 11, flex: 1, textTransform: 'uppercase' }}>
                  {subjects.find(s => s.id === selectedSubject)?.name || 'CONDUCTAS RELACIONADAS CON EL USO DE RECURSOS O BIENES MUNICIPALES'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Text style={{ width: 90, fontWeight: 'bold', fontSize: 11 }}>FALTA :</Text>
                <Text style={{ fontSize: 11, flex: 1, textTransform: 'uppercase' }}>
                  {lacks.find(l => l.id === selectedLack)?.name || 'USO INDEBIDO O NO AUTORIZADO DE BIENES, MATERIALES O VEHÍCULOS INSTITUCIONALES'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 0 }}>
                <Text style={{ width: 90, fontWeight: 'bold', fontSize: 11 }}>FECHA :</Text>
                <Text style={{ fontSize: 11 }}>
                  {new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>
            </View>

            {/* Separador horizontal */}
            <View style={{ borderBottom: '2px solid #000', marginVertical: 15 }} />

            {/* Párrafo descriptivo */}
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 9, lineHeight: 1.5, textAlign: 'justify' }}>
                {'        '}Tengo el agrado de dirigirme a Ud, con la finalidad de saludarlo, a la vez informarle sobre el reporte de inasistencias al centro de labores del personal de la Subgerencia de Serenazgo, correspondiente del turno {turnosStr}. Durante el período {dateRange.start.toLocaleDateString('es-PE', { day: '2-digit' })} al {dateRange.end.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}, se ha registrado un número significativo de inasistencias {selectedMode === 'UNJUSTIFIED' ? 'injustificadas' : 'justificadas'} por parte del personal mencionado.
              </Text>
            </View>

            {/* Tabla de inasistencias */}
            <View style={styles.table}>
              {/* Header de la tabla */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableCellHeader, { width: '5%' }]}>N°</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, { width: '25%' }]}>APELLIDOS Y NOMBRES</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, { width: '12%' }]}>CARGO</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, { width: '10%' }]}>REG.</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, { width: '8%' }]}>TURNO</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, { width: '15%' }]}>FECHA</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, { width: '12%' }]}>TIPO</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, { width: '13%' }]}>JURISD.</Text>
              </View>

              {/* Filas de datos */}
              {pdfAttendances.map((person, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '5%' }]}>{index + 1}</Text>
                  <Text style={[styles.tableCell, { width: '25%' }]}>{person.name}</Text>
                  <Text style={[styles.tableCell, { width: '12%' }]}>{person.job}</Text>
                  <Text style={[styles.tableCell, { width: '10%' }]}>{person.regime}</Text>
                  <Text style={[styles.tableCell, { width: '8%' }]}>{person.shift}</Text>
                  <Text style={[styles.tableCell, { width: '15%', fontSize: 6 }]}>{person.fechas}</Text>
                  <Text style={[styles.tableCell, { width: '12%' }]}>{selectedMode === 'UNJUSTIFIED' ? 'INJUST.' : 'JUST.'}</Text>
                  <Text style={[styles.tableCell, { width: '13%' }]}>{person.jurisdiction}</Text>
                </View>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text>Central de Emergencia y Videovigilancia del Bicentenario de San Juan de Lurigancho</Text>
            </View>
          </Page>
        </Document>
      )

      // Generar el blob del PDF
      const pdfBlob = await pdf(doc).toBlob()

      // Crear URL para descarga
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Reporte_Inasistencias_${reportId}_${Date.now()}.pdf`
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
      let errorMessage = 'Error al crear el reporte'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      alert(errorMessage)
    } finally {
      setGenerating(false)
    }
  }

  const formatDateRange = () => {
    if (!dateRange?.start || !dateRange?.end) return ''
    const options = { day: '2-digit', month: 'short', year: 'numeric' }
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
    <div className="modal-backdrop">
      <div className="modal-pdf" style={{ maxWidth: '750px' }}>
        <div className="modal-header">
          <h3>Crear Reporte de Inasistencias</h3>
          <button className="close" onClick={onClose}>×</button>
        </div>

        <div className="pdf-preview" style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
          {loadingData ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Cargando datos...
            </div>
          ) : loadError ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
              {loadError}
            </div>
          ) : (
            <>
              {/* Topbar de configuración */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px'
              }}>
                {/* Fila 1: Dirigido a y Con copia */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                    Dirigido a:
                  </label>
                  <select
                    value={selectedTo}
                    onChange={(e) => handleToChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem'
                    }}
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
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                    Con copia a:
                  </label>
                  <div style={{
                    maxHeight: '60px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    background: 'var(--bg-primary)',
                    fontSize: '0.75rem'
                  }}>
                    {leads.filter(l => l.id !== selectedTo).map(lead => {
                      const leadName = `${lead.title || ''} ${lead.name || ''} ${lead.lastname || ''}`.trim()
                      return (
                        <label key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedCc.includes(lead.id)}
                            onChange={() => handleCcChange(lead.id)}
                            style={{ width: '12px', height: '12px' }}
                          />
                          {leadName}
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Fila 2: Asunto y Falta (valores fijos) */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                    Asunto:
                  </label>
                  <div
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem'
                    }}
                  >
                    Conductas relacionadas con el cumplimiento del horario y asistencia
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                    Falta:
                  </label>
                  <div
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem'
                    }}
                  >
                    Inasistencia
                  </div>
                </div>

                {/* Fila 3: Tipo de inasistencia y Rango de fechas */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                    Tipo:
                  </label>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                      <input
                        type="radio"
                        name="mode"
                        value="UNJUSTIFIED"
                        checked={selectedMode === 'UNJUSTIFIED'}
                        onChange={(e) => setSelectedMode(e.target.value)}
                      />
                      Injustificada
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                      <input
                        type="radio"
                        name="mode"
                        value="JUSTIFIED"
                        checked={selectedMode === 'JUSTIFIED'}
                        onChange={(e) => setSelectedMode(e.target.value)}
                      />
                      Justificada
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                    Rango de fechas:
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="date"
                      value={dateRange?.start ? `${dateRange.start.getFullYear()}-${String(dateRange.start.getMonth() + 1).padStart(2, '0')}-${String(dateRange.start.getDate()).padStart(2, '0')}` : ''}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value + 'T00:00:00')
                        setDateRange(prev => ({ ...prev, start: newDate }))
                      }}
                      style={{
                        padding: '4px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.75rem',
                        width: '120px'
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>a</span>
                    <input
                      type="date"
                      value={dateRange?.end ? `${dateRange.end.getFullYear()}-${String(dateRange.end.getMonth() + 1).padStart(2, '0')}-${String(dateRange.end.getDate()).padStart(2, '0')}` : ''}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value + 'T00:00:00')
                        setDateRange(prev => ({ ...prev, end: newDate }))
                      }}
                      style={{
                        padding: '4px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.75rem',
                        width: '120px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Plantilla del informe */}
              <div style={{
                background: 'white',
                color: '#000',
                padding: '30px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontFamily: 'Times New Roman, serif'
              }}>
                {/* Encabezado con logo */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '20px',
                  borderBottom: '2px solid #1e3a5f',
                  paddingBottom: '15px'
                }}>
                  {logoBase64 && (
                    <img
                      src={logoBase64}
                      alt="Logo SJL"
                      style={{ width: '60px', height: '60px', marginRight: '15px' }}
                    />
                  )}
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <h3 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#1e3a5f' }}>
                      SAN JUAN DE LURIGANCHO
                    </h3>
                    <p style={{ margin: '2px 0', fontSize: '10px', fontStyle: 'italic', color: '#666' }}>
                      es momento de crecer
                    </p>
                  </div>
                </div>

                {/* Año */}
                <p style={{
                  textAlign: 'center',
                  fontSize: '10px',
                  fontStyle: 'italic',
                  margin: '0 0 20px 0',
                  color: '#333'
                }}>
                  "Año de la recuperación y consolidación de la economía peruana"
                </p>

                {/* Número de informe */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '20px',
                  padding: '10px',
                  background: '#f8fafc',
                  borderRadius: '4px'
                }}>
                  <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold' }}>
                    INFORME N°
                  </p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#666' }}>
                    {reportResult?.data?.report_id || '---'}
                  </p>
                </div>

                {/* Datos del informe */}
                <table style={{
                  width: '100%',
                  fontSize: '11px',
                  borderCollapse: 'collapse',
                  marginBottom: '15px'
                }}>
                  <tbody>
                    <tr>
                      <td style={{
                        width: '80px',
                        fontWeight: 'bold',
                        padding: '8px 10px 8px 0',
                        verticalAlign: 'top',
                        borderBottom: '1px solid #eee'
                      }}>
                        A :
                      </td>
                      <td style={{
                        padding: '8px 0',
                        borderBottom: '1px solid #eee'
                      }}>
                        {selectedLeadData ? (
                          <>
                            <strong>
                              {`${selectedLeadData.title || ''} ${selectedLeadData.name || ''} ${selectedLeadData.lastname || ''}`.trim()}
                            </strong>
                            <br />
                            <span style={{ fontSize: '10px', color: '#666' }}>
                              {typeof selectedLeadData.job === 'string' ? selectedLeadData.job : ''}
                            </span>
                          </>
                        ) : (
                          <span style={{ color: '#999', fontStyle: 'italic' }}>Seleccione un destinatario</span>
                        )}
                      </td>
                    </tr>

                    {selectedCcData.length > 0 && (
                      <tr>
                        <td style={{
                          fontWeight: 'bold',
                          padding: '8px 10px 8px 0',
                          verticalAlign: 'top',
                          borderBottom: '1px solid #eee'
                        }}>
                          CC :
                        </td>
                        <td style={{
                          padding: '8px 0',
                          borderBottom: '1px solid #eee'
                        }}>
                          {selectedCcData.join(', ')}
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td style={{
                        fontWeight: 'bold',
                        padding: '8px 10px 8px 0',
                        verticalAlign: 'top',
                        borderBottom: '1px solid #eee'
                      }}>
                        DE :
                      </td>
                      <td style={{
                        padding: '8px 0',
                        borderBottom: '1px solid #eee',
                        fontWeight: 'bold'
                      }}>
                        CONTROL Y SUPERVISIÓN
                      </td>
                    </tr>

                    <tr>
                      <td style={{
                        fontWeight: 'bold',
                        padding: '8px 10px 8px 0',
                        verticalAlign: 'top',
                        borderBottom: '1px solid #eee'
                      }}>
                        ASUNTO :
                      </td>
                      <td style={{
                        padding: '8px 0',
                        borderBottom: '1px solid #eee'
                      }}>
                        {subjectName || <span style={{ color: '#999', fontStyle: 'italic' }}>Seleccione un asunto</span>}
                      </td>
                    </tr>

                    <tr>
                      <td style={{
                        fontWeight: 'bold',
                        padding: '8px 10px 8px 0',
                        verticalAlign: 'top'
                      }}>
                        FECHA :
                      </td>
                      <td style={{ padding: '8px 0' }}>
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
                <div style={{
                  fontSize: '10px',
                  lineHeight: '1.6',
                  marginTop: '15px',
                  textAlign: 'justify'
                }}>
                  <p style={{ margin: '0 0 10px 0', textIndent: '40px' }}>
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
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '10px' }}>
                    Cargando inasistencias...
                  </div>
                ) : filteredAttendances.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#666',
                    fontSize: '10px',
                    fontStyle: 'italic',
                    background: '#f8fafc',
                    borderRadius: '4px',
                    marginTop: '10px'
                  }}>
                    No hay inasistencias registradas en el período seleccionado
                  </div>
                ) : (
                  <div style={{ marginTop: '10px', overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '8px',
                      border: '1px solid #000'
                    }}>
                      <thead>
                        <tr style={{ background: '#f0f0f0' }}>
                          <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>N°</th>
                          <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>APELLIDOS Y NOMBRES</th>
                          <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>CARGO</th>
                          <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>REG. LAB.</th>
                          <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>TURNO</th>
                          <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>FECHA</th>
                          <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>TIPO DE INASISTENCIA</th>
                          <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>JURISDICCION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAttendances.map((person, index) => {
                          // Obtener las fechas de inasistencia
                          const fechas = person.dates?.filter(d => !d.delete_at).map(d => {
                            const date = new Date(d.date)
                            return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          }).join(', ') || '-'

                          // Manejar campos que pueden ser objetos
                          const jobValue = typeof person.job === 'object' ? (person.job?.name || '-') : (person.job || '-')
                          const regimeValue = typeof person.regime === 'object' ? (person.regime?.name || '-') : (person.regime || '-')
                          const shiftValue = typeof person.shift === 'object' ? (person.shift?.name || '-') : (person.shift || '-')
                          const jurisdictionValue = typeof person.jurisdiction === 'object' ? (person.jurisdiction?.name || '-') : (person.jurisdiction || '-')

                          return (
                            <tr key={person.id || index}>
                              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{index + 1}</td>
                              <td style={{ border: '1px solid #000', padding: '4px' }}>
                                {person.name && person.lastname
                                  ? `${person.lastname} ${person.name}`.toUpperCase()
                                  : person.fullname?.toUpperCase() || '-'}
                              </td>
                              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                                {jobValue}
                              </td>
                              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                                {regimeValue}
                              </td>
                              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                                {shiftValue}
                              </td>
                              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '7px' }}>
                                {fechas}
                              </td>
                              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                                {selectedMode === 'UNJUSTIFIED' ? 'INJUSTIFICADA' : 'JUSTIFICADA'}
                              </td>
                              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
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
                  <div style={{
                    marginTop: '15px',
                    padding: '10px',
                    background: '#d1fae5',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontSize: '11px',
                    color: '#059669'
                  }}>
                    ✓ {reportResult.message}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-actions">
          {reportResult ? (
            <button className="btn-primary" onClick={onClose}>
              Cerrar
            </button>
          ) : (
            <>
              <button className="btn-secondary" onClick={onClose} disabled={generating}>
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleGeneratePDF}
                disabled={generating || loadingData || loadError || !selectedTo || !selectedSubject || !selectedLack}
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
