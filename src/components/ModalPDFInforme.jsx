import React, { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import { useSelector } from 'react-redux'
import logoSJL from '../assets/logo-sjl.png'
import { trackPDFDownload } from '../utils/storage'
import { getReportWithEvidences, updateReportWithEvidences, getEvidenceImageUrl } from '../api/report'

function formatearFecha(fecha) {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const d = new Date(fecha)
  return `${d.getDate()} de ${meses[d.getMonth()]} del ${d.getFullYear()}`
}

function obtenerHoraFormateada(hora) {
  if (!hora) return ''
  const [h, m] = hora.split(':')
  return `${h}:${m}`
}

const articulosPorFalta = {
  'Dormir en horario laboral': '68.12',
  'Comer en horario laboral': '68.15',
  'Jugar en horario laboral': '68.18',
  'Abandono injustificado del puesto': '70.05',
  'Abandono temporal reiterado': '70.08',
  'Negativa a cumplir funciones asignadas': '70.12',
  'Inasistencia prolongada sin aviso': '72.03',
  'Llegó fuera de horario': '72.06'
}

export default function ModalPDFInforme({ incidencia, inasistenciasHistoricas = [], onClose }) {
  // Obtener usuario logueado de Redux
  const { username } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
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
    supervisor: '',
    descripcionAdicional: '',
    tipoInasistencia: '',
    fechaFalta: '',
    imagenes: [],
    links: ''
  })

  const [loadingEvidences, setLoadingEvidences] = useState(false)
  const [savingReport, setSavingReport] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])

  useEffect(() => {
    if (incidencia) {
      const numeroInforme = `${String(Math.floor(Math.random() * 999)).padStart(3, '0')}-2025-CS-SS-GOP/MDSJL`

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
        console.log('📍 Ubicación completa:', incidencia.ubicacion)

        if (incidencia.ubicacion?.address) {
          console.log('✅ Dirección encontrada:', incidencia.ubicacion.address)
          return incidencia.ubicacion.address
        } else if (incidencia.ubicacion?.coordinates) {
          console.log('⚠️ Solo coordenadas disponibles')
          return 'Dirección no especificada (solo coordenadas)'
        } else if (Array.isArray(incidencia.ubicacion)) {
          console.log('⚠️ Formato antiguo de ubicación')
          return 'Dirección no especificada (solo coordenadas)'
        }
        console.log('❌ Sin ubicación')
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
        supervisor: username ? username.toUpperCase() : 'SUPERVISOR',  // Usuario logueado
        descripcionAdicional: generarContenidoInforme(),  // Generar plantilla para todos los tipos
        tipoInasistencia: incidencia.tipoInasistencia || '',
        fechaFalta: incidencia.fechaFalta || '',
        imagenes: [],
        links: ''
      })
    }
  }, [incidencia])

  // Cargar evidencias existentes del reporte
  useEffect(() => {
    async function loadExistingEvidences() {
      if (!incidencia || !incidencia.id) return

      setLoadingEvidences(true)
      try {
        console.log('📥 Cargando evidencias del reporte:', incidencia.id)
        const reportData = await getReportWithEvidences(incidencia.id)

        if (reportData && reportData.evidences && reportData.evidences.length > 0) {
          console.log('✅ Evidencias cargadas:', reportData.evidences)

          // Cargar las imágenes existentes y convertirlas a base64 para el PDF
          const imagenesExistentes = await Promise.all(
            reportData.evidences.map(async (ev) => {
              try {
                console.log('🖼️ Intentando cargar imagen:', ev.imageUrl)

                // Obtener el token de localStorage
                const getToken = () => {
                  try {
                    const persistRoot = localStorage.getItem('persist:root')
                    if (persistRoot) {
                      const parsed = JSON.parse(persistRoot)
                      if (parsed.auth) {
                        const authState = JSON.parse(parsed.auth)
                        return authState.token
                      }
                    }
                  } catch (error) {
                    console.error('Error al obtener token:', error)
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
                console.log('✅ Imagen cargada, tamaño:', blob.size, 'bytes')

                // Convertir blob a base64
                const base64 = await new Promise((resolve) => {
                  const reader = new FileReader()
                  reader.onloadend = () => resolve(reader.result)
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
                console.error('❌ Error al cargar imagen:', ev.imageUrl, error)
                return null
              }
            })
          )

          // Filtrar imágenes que se cargaron exitosamente
          const imagenesValidas = imagenesExistentes.filter(img => img !== null)

          console.log(`✅ ${imagenesValidas.length} de ${reportData.evidences.length} imágenes cargadas exitosamente`)

          setFormData(prev => ({
            ...prev,
            imagenes: imagenesValidas,
            descripcionAdicional: reportData.message || prev.descripcionAdicional
          }))
        }
      } catch (error) {
        console.error('❌ Error al cargar evidencias:', error)
      } finally {
        setLoadingEvidences(false)
      }
    }

    loadExistingEvidences()
  }, [incidencia])

  function handleChange(field, value) {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }

      // Si cambia el número de bodycam, actualizar la plantilla automáticamente
      if (field === 'bodycam' && !(incidencia.falta && incidencia.falta.startsWith('Inasistencia'))) {
        const hora = obtenerHoraFormateada(incidencia.horaIncidente)
        const fecha = formatearFecha(incidencia.fechaIncidente)
        const direccion = prev.ubicacion
        const nombreCompleto = incidencia.nombreCompleto || 'NOMBRE NO DISPONIBLE'
        const cargoPersona = incidencia.cargo || 'Inspector Comercial'
        const regLab = incidencia.regLab || 'N/A'
        const turno = incidencia.turno || 'N/A'
        const falta = incidencia.falta || 'Falta no especificada'
        const bodycamNum = value || 'N/A'  // Usar el nuevo valor

        const nuevaPlantilla = `Es grato dirigirme a Ud. con la finalidad de informarle lo siguiente:

Para conocimiento, informo que el personal ${nombreCompleto}, con régimen ${regLab}, ${cargoPersona} del turno ${turno}, donde presuntamente...

[INSTRUCCIÓN: Describa aquí de manera objetiva lo ocurrido, utilizando términos como "presuntamente", "aparentemente", u otros similares que denoten objetividad y eviten afirmaciones categóricas. Detalle la situación observada de forma clara y precisa.]

...incurriendo presuntamente en la falta disciplinaria establecida como "${falta}", registrada a través de la BODYCAM ${bodycamNum}, en el lugar ubicado en ${direccion}, el día ${fecha} a las ${hora}.

[INSTRUCCIÓN: Si desea agregar observaciones adicionales sobre el contexto o circunstancias del incidente, puede incluirlas aquí.]

Como medida inmediata, se realizó el registro documental del incidente y se adjuntó evidencia fotográfica y audiovisual obtenida por la BODYCAM ${bodycamNum}, con la finalidad de que sea evaluada conforme al proceso administrativo correspondiente.

Finalmente, se deja constancia de que la situación descrita constituye un incumplimiento de las obligaciones del personal, motivo por el cual se adjunta la información del involucrado y las capturas correspondientes de la BODYCAM. Se remite la presente comunicación a la Subgerencia de Serenazgo para su conocimiento y fines correspondientes.

Se adjuntan las evidencias:`

        newData.descripcionAdicional = nuevaPlantilla
      }

      return newData
    })
  }

  function handleImageUpload(e) {
    const files = Array.from(e.target.files)

    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          imagenes: [...prev.imagenes, {
            name: file.name,
            url: URL.createObjectURL(file),
            base64: event.target.result,
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

  function updateImageAnexo(index, anexo) {
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

  function removeImage(index) {
    setFormData(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index)
    }))
  }

  async function generarPDF() {
    // Validar que todas las imágenes tengan descripción
    const errores = []
    formData.imagenes.forEach((img, index) => {
      if (!img.anexo || !img.anexo.trim()) {
        errores.push(index)
      }
    })

    if (errores.length > 0) {
      setValidationErrors(errores)
      alert(`⚠️ Todas las imágenes requieren una descripción. Por favor, agrega descripciones a las imágenes: ${errores.map(i => i + 1).join(', ')}`)
      return
    }

    // Si hay imágenes nuevas, actualizar el reporte en el backend
    const nuevasImagenes = formData.imagenes.filter(img => !img.isExisting)

    if (nuevasImagenes.length > 0 || formData.descripcionAdicional) {
      setSavingReport(true)
      try {
        console.log('💾 Guardando evidencias en el backend...')

        const files = nuevasImagenes.map(img => img.file).filter(Boolean)
        const descriptions = nuevasImagenes.map(img => img.anexo)

        await updateReportWithEvidences(
          incidencia.id,
          files,
          descriptions,
          formData.descripcionAdicional
        )

        console.log('✅ Evidencias guardadas exitosamente')
      } catch (error) {
        console.error('❌ Error al guardar evidencias:', error)

        let errorMessage = 'Error al guardar las evidencias en el servidor'
        if (error.response?.data?.message) {
          errorMessage = Array.isArray(error.response.data.message)
            ? 'Errores:\n' + error.response.data.message.join('\n')
            : error.response.data.message
        }

        alert(errorMessage)
        setSavingReport(false)
        return
      } finally {
        setSavingReport(false)
      }
    }

    // Generar el PDF
    const doc = new jsPDF()

    // Agregar logo de la municipalidad centrado
    try {
      // Crear una nueva imagen y esperar a que se cargue
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.src = logoSJL

      // Logo más ancho y centrado (105 es el centro - 25 para centrar logo de 50x30)
      doc.addImage(logoSJL, 'PNG', 80, 10, 50, 30)
    } catch (error) {
      console.error('Error al cargar logo:', error)
    }

    // Encabezado
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('"Año de la recuperación y consolidación de la economía peruana"', 105, 45, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)

    const startY = 55
    let currentLine = startY

    doc.text(`INFORME N° ${formData.numeroInforme}`, 20, currentLine)
    currentLine += 9

    doc.text(`A       :    Sr. ${formData.destinatarioNombre.toUpperCase()}`, 20, currentLine)
    currentLine += 6

    doc.text(`             ${formData.destinatarioCargo}`, 20, currentLine)
    currentLine += 8

    if (incidencia.cc && incidencia.cc.length > 0) {
      doc.text(`CC      :    ${incidencia.cc.join(', ')}`, 20, currentLine)
      currentLine += 8
    }

    doc.text(`DE      :    CONTROL Y SUPERVISIÓN`, 20, currentLine)
    currentLine += 8

    doc.text(`ASUNTO  :    ${incidencia.asunto.toUpperCase()}`, 20, currentLine)
    currentLine += 8

    // Agregar tipo de falta debajo del asunto
    doc.text(`FALTA   :    ${formData.falta.toUpperCase()}`, 20, currentLine)
    currentLine += 8

    // Si es inasistencia, mostrar el tipo (Justificada/Injustificada)
    if (formData.falta && formData.falta.startsWith('Inasistencia') && formData.tipoInasistencia) {
      doc.text(`TIPO    :    ${formData.tipoInasistencia.toUpperCase()}`, 20, currentLine)
      currentLine += 8
    }

    doc.text(`FECHA   :    San Juan de Lurigancho, ${formData.fecha}`, 20, currentLine)
    currentLine += 7
    
    doc.line(20, currentLine, 190, currentLine)
    currentLine += 10

    doc.setFontSize(11)

    // Si hay contenido del informe, usarlo (para todos los tipos de incidencias)
    if (formData.descripcionAdicional) {
      doc.setFont('helvetica', 'normal')
      const lineasDescripcion = doc.splitTextToSize(formData.descripcionAdicional, 170)
      doc.text(lineasDescripcion, 20, currentLine, { align: 'justify', maxWidth: 170 })
      currentLine += (lineasDescripcion.length * 5) + 8
    } else if (incidencia.falta && incidencia.falta.startsWith('Inasistencia')) {
      // Fallback para inasistencias sin contenido personalizado
      doc.text('Es grato dirigirme a Ud. con la finalidad de informarle lo siguiente:', 20, currentLine, { align: 'justify', maxWidth: 170 })
      currentLine += 10

      const textoIncidente = `Mediante el presente se informa que el día ${formData.fechaFalta}, el sereno ${formData.nombreCompleto ? formData.nombreCompleto.toUpperCase() : formData.sereno} (DNI: ${formData.dni}), con cargo de ${formData.cargo}, Reg. Lab ${formData.regLab} y turno ${formData.turno}, incurrió en la falta de ${formData.falta.toUpperCase()}, la cual ha sido clasificada como ${formData.tipoInasistencia.toLowerCase()}. Dicha incidencia fue registrada el ${formData.fechaIncidente} a las ${formData.horaIncidente} en la jurisdicción de ${formData.jurisdiccion}.`

      const lineasIncidente = doc.splitTextToSize(textoIncidente, 170)
      doc.text(lineasIncidente, 20, currentLine, { align: 'justify', maxWidth: 170 })
      currentLine += (lineasIncidente.length * 6) + 5

      const nombreParaPDF = formData.nombreCompleto ? formData.nombreCompleto.toUpperCase() : formData.sereno
      const infoAdicional = `Se adjunta al presente, la información del señor ${nombreParaPDF} y el historial de inasistencias correspondiente.`

      const lineasInfo = doc.splitTextToSize(infoAdicional, 170)
      doc.text(lineasInfo, 20, currentLine, { align: 'justify', maxWidth: 170 })
      currentLine += (lineasInfo.length * 6) + 8
    }

    if (incidencia.falta && incidencia.falta.startsWith('Inasistencia') && inasistenciasHistoricas.length > 0) {
      if (currentLine > 200) {
        doc.addPage()
        currentLine = 20
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('HISTORIAL DE INASISTENCIAS DEL PERSONAL:', 20, currentLine)
      currentLine += 10

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)

      doc.text('Fecha', 20, currentLine)
      doc.text('Falta', 60, currentLine)
      doc.text('Tipo', 120, currentLine)
      doc.text('Fecha Falta', 150, currentLine)
      currentLine += 5
      doc.line(20, currentLine, 190, currentLine)
      currentLine += 8

      inasistenciasHistoricas.forEach((inasistencia) => {
        if (currentLine > 270) {
          doc.addPage()
          currentLine = 20
        }

        doc.text(formatearFecha(inasistencia.fechaIncidente), 20, currentLine)
        doc.text(inasistencia.falta, 60, currentLine)
        doc.text(inasistencia.tipoInasistencia || 'No especificado', 120, currentLine)
        doc.text(inasistencia.fechaFalta || inasistencia.fechaIncidente, 150, currentLine)
        currentLine += 7
      })

      currentLine += 12
    }
    
    if (formData.imagenes.length > 0) {
      formData.imagenes.forEach((img, imgIndex) => {
        // Verificar si hay espacio suficiente para imagen + anexo
        const espacioNecesario = img.anexo ? 100 : 85
        if (currentLine > (280 - espacioNecesario)) {
          doc.addPage()
          currentLine = 20
        }

        try {
          // Configuración de imagen - más grande para que llene mejor la página
          const pageWidth = doc.internal.pageSize.getWidth()
          const imageWidth = 120  // Ancho de la imagen en mm (aumentado)
          const imageHeight = 90  // Alto de la imagen en mm (aumentado)
          const imageX = (pageWidth - imageWidth) / 2  // Centrar horizontalmente

          // Agregar imagen centrada
          doc.addImage(img.base64, 'JPEG', imageX, currentLine, imageWidth, imageHeight)
          currentLine += imageHeight + 8

          // Agregar anexo si existe
          if (img.anexo) {
            doc.setFont('helvetica', 'italic')
            doc.setFontSize(10)
            const lineasAnexo = doc.splitTextToSize(`Anexo ${imgIndex + 1}: ${img.anexo}`, 170)
            // Centrar el texto usando pageWidth / 2
            doc.text(lineasAnexo, pageWidth / 2, currentLine, { align: 'center', maxWidth: 170 })
            currentLine += (lineasAnexo.length * 5) + 12
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(11)
          } else {
            currentLine += 8
          }
        } catch (error) {
          console.error('Error al agregar imagen:', error)
        }
      })
    }
    
    if (formData.links) {
      if (currentLine > 240) {
        doc.addPage()
        currentLine = 20
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('Links de referencia:', 20, currentLine)
      currentLine += 7
      doc.setFont('helvetica', 'normal')
      const lineasLinks = doc.splitTextToSize(formData.links, 170)
      doc.text(lineasLinks, 20, currentLine)
      currentLine += (lineasLinks.length * 6) + 10
    }

    const pageCount = doc.internal.getNumberOfPages()
    doc.setPage(pageCount)
    doc.setFontSize(9)
    doc.text('Sede CECOM de la Sub Gerencia de Serenazgo:', 20, 280)
    doc.text('Av. Sta. Rosa de Lima, San Juan de Lurigancho 15427', 20, 285)

    doc.save(`Informe_${incidencia.dni}_${Date.now()}.pdf`)

    // Registrar la descarga del PDF
    trackPDFDownload(incidencia.id)
  }

  const esInasistencia = incidencia.falta && incidencia.falta.startsWith('Inasistencia')

  return (
    <div className="modal-backdrop">
      <div className="modal-pdf">
        <div className="modal-header">
          <h3>Vista Previa del Informe</h3>
          <button className="close" onClick={onClose}>×</button>
        </div>
        
        <div className="pdf-preview">
          <div className="pdf-content">
            <div className="pdf-header">
              <h2>SAN JUAN DE LURIGANCHO</h2>
              <p className="subtitle">es momento de crecer</p>
              <p className="year">"Año de la recuperación y consolidación de la economía peruana"</p>
            </div>

            <div className="pdf-info">
              <div className="info-row">
                <strong>INFORME N°</strong>
                <input 
                  value={formData.numeroInforme}
                  onChange={e => handleChange('numeroInforme', e.target.value)}
                />
              </div>
              
              <div className="info-row">
                <strong>A :</strong>
                <div className="info-input-group">
                  <span>Sr.</span>
                  <input 
                    value={formData.destinatarioNombre}
                    onChange={e => handleChange('destinatarioNombre', e.target.value)}
                  />
                  <input 
                    value={formData.destinatarioCargo}
                    onChange={e => handleChange('destinatarioCargo', e.target.value)}
                    placeholder="Cargo"
                  />
                </div>
              </div>

              {incidencia.cc && incidencia.cc.length > 0 && (
                <div className="info-row">
                  <strong>CC :</strong>
                  <span>{incidencia.cc.join(', ')}</span>
                </div>
              )}

              <div className="info-row">
                <strong>DE :</strong>
                <span>CONTROL Y SUPERVISIÓN</span>
              </div>

              <div className="info-row">
                <strong>ASUNTO :</strong>
                <input 
                  value={incidencia.asunto}
                  disabled
                  style={{textTransform: 'uppercase'}}
                />
              </div>

              <div className="info-row">
                <strong>FECHA :</strong>
                <input 
                  value={formData.fecha}
                  onChange={e => handleChange('fecha', e.target.value)}
                />
              </div>
            </div>

            <hr className="separator" />

            <div className="pdf-body">
              <p className="intro">Es grato dirigirme a Ud. con la finalidad de informarle lo siguiente:</p>
              
              <div className="editable-section">
                <label>Hora del incidente:</label>
                <input 
                  type="text"
                  value={formData.horaIncidente}
                  onChange={e => handleChange('horaIncidente', e.target.value)}
                />
              </div>

              <div className="editable-section">
                <label>Fecha del incidente:</label>
                <input 
                  type="text"
                  value={formData.fechaIncidente}
                  onChange={e => handleChange('fechaIncidente', e.target.value)}
                />
              </div>

              <div className="editable-section">
                <label>Ubicación (Dirección):</label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={e => handleChange('ubicacion', e.target.value)}
                  placeholder="Dirección completa del incidente"
                />
              </div>

              <div className="editable-section">
                <label>Jurisdicción:</label>
                <input 
                  type="text"
                  value={formData.jurisdiccion}
                  onChange={e => handleChange('jurisdiccion', e.target.value)}
                />
              </div>

              <div className="editable-section">
                <label>Sereno:</label>
                <input
                  type="text"
                  value={formData.sereno}
                  readOnly
                  style={{ cursor: 'not-allowed' }}
                />
              </div>

              <div className="editable-section">
                <label>DNI:</label>
                <input
                  type="text"
                  value={formData.dni}
                  readOnly
                  style={{ cursor: 'not-allowed' }}
                />
              </div>

              <div className="editable-section">
                <label>Cargo:</label>
                <input
                  type="text"
                  value={formData.cargo}
                  readOnly
                  style={{ cursor: 'not-allowed' }}
                />
              </div>

              <div className="editable-section">
                <label>Reg. Lab:</label>
                <input
                  type="text"
                  value={formData.regLab}
                  readOnly
                  style={{ cursor: 'not-allowed' }}
                />
              </div>

              <div className="editable-section">
                <label>Falta:</label>
                <input
                  type="text"
                  value={formData.falta}
                  readOnly
                  style={{ cursor: 'not-allowed' }}
                />
              </div>

              {esInasistencia && (
                <>
                  <div className="editable-section">
                    <label>Tipo de Inasistencia:</label>
                    <input 
                      type="text"
                      value={formData.tipoInasistencia}
                      onChange={e => handleChange('tipoInasistencia', e.target.value)}
                    />
                  </div>

                  <div className="editable-section">
                    <label>Fecha de Falta:</label>
                    <input 
                      type="text"
                      value={formData.fechaFalta}
                      onChange={e => handleChange('fechaFalta', e.target.value)}
                    />
                  </div>
                </>
              )}

              {!esInasistencia && (
                <>
                  <div className="editable-section">
                    <label>Artículo:</label>
                    <input 
                      type="text"
                      value={formData.articulo}
                      onChange={e => handleChange('articulo', e.target.value)}
                    />
                  </div>

                  <div className="editable-section">
                    <label>N° Bodycam:</label>
                    <input
                      type="text"
                      value={formData.bodycam}
                      readOnly
                      style={{ cursor: 'not-allowed' }}
                    />
                  </div>

                  <div className="editable-section">
                    <label>Bodycam asignada a:</label>
                    <input
                      type="text"
                      value={formData.bodycamAsignadaA}
                      onChange={e => handleChange('bodycamAsignadaA', e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="editable-section">
                <label>Supervisor:</label>
                <input
                  type="text"
                  value={formData.supervisor}
                  readOnly
                  style={{ cursor: 'not-allowed' }}
                />
              </div>

              <div className="editable-section">
                <label>CONTENIDO DEL INFORME:</label>
                <textarea
                  value={formData.descripcionAdicional}
                  onChange={e => handleChange('descripcionAdicional', e.target.value)}
                  placeholder="Edite el contenido del informe según sea necesario..."
                  rows={18}
                  style={{
                    fontSize: '11px',
                    lineHeight: '1.6',
                    fontFamily: 'inherit',
                    whiteSpace: 'pre-wrap'
                  }}
                />
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-secondary)',
                  marginTop: '8px',
                  padding: '8px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '4px',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  <strong>💡 Instrucciones:</strong>
                  <ul style={{marginTop: '4px', marginLeft: '20px', lineHeight: '1.5'}}>
                    <li>Complete las secciones marcadas con [INSTRUCCIÓN] con los detalles específicos del incidente</li>
                    <li>Use términos objetivos como "presuntamente", "aparentemente" para describir los hechos</li>
                    <li>Puede editar cualquier parte del texto según sea necesario</li>
                    <li>La plantilla se adapta automáticamente según el tipo de incidente</li>
                  </ul>
                </div>
              </div>

              {esInasistencia && inasistenciasHistoricas.length > 0 && (
                <div className="editable-section">
                  <label>Historial de Inasistencias del Personal:</label>
                  <div style={{marginTop: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden'}}>
                    <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '10px'}}>
                      <thead>
                        <tr style={{background: '#f1f5f9'}}>
                          <th style={{padding: '6px', border: '1px solid #e2e8f0', textAlign: 'left'}}>Fecha</th>
                          <th style={{padding: '6px', border: '1px solid #e2e8f0', textAlign: 'left'}}>Falta</th>
                          <th style={{padding: '6px', border: '1px solid #e2e8f0', textAlign: 'left'}}>Tipo</th>
                          <th style={{padding: '6px', border: '1px solid #e2e8f0', textAlign: 'left'}}>Fecha Falta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inasistenciasHistoricas.map((inasistencia, index) => (
                          <tr key={index}>
                            <td style={{padding: '6px', border: '1px solid #e2e8f0'}}>
                              {formatearFecha(inasistencia.fechaIncidente)}
                            </td>
                            <td style={{padding: '6px', border: '1px solid #e2e8f0'}}>
                              {inasistencia.falta}
                            </td>
                            <td style={{padding: '6px', border: '1px solid #e2e8f0'}}>
                              {inasistencia.tipoInasistencia || 'No especificado'}
                            </td>
                            <td style={{padding: '6px', border: '1px solid #e2e8f0'}}>
                              {inasistencia.fechaFalta || inasistencia.fechaIncidente}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="editable-section">
                <label>Adjuntar imágenes:</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={loadingEvidences || savingReport}
                  style={{padding: '8px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px'}}
                />

                {loadingEvidences && (
                  <div style={{
                    padding: '12px',
                    textAlign: 'center',
                    color: 'var(--primary)',
                    fontSize: '0.9rem'
                  }}>
                    ⏳ Cargando evidencias existentes...
                  </div>
                )}

                {formData.imagenes.length > 0 && (
                  <div className="images-preview">
                    {formData.imagenes.map((img, index) => (
                      <div key={index} className="image-item-container">
                        <div className="image-item">
                          <img src={img.base64 || img.url} alt={img.name} />
                          {img.isExisting && (
                            <span style={{
                              position: 'absolute',
                              top: '5px',
                              left: '5px',
                              background: 'rgba(59, 130, 246, 0.9)',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              GUARDADA
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="btn-remove-img"
                            disabled={savingReport}
                          >
                            ×
                          </button>
                        </div>
                        <div style={{marginTop: '8px'}}>
                          <label style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'block',
                            marginBottom: '4px',
                            color: validationErrors.includes(index) ? '#dc2626' : 'inherit'
                          }}>
                            Anexo {index + 1} (OBLIGATORIO):
                          </label>
                          <textarea
                            value={img.anexo || ''}
                            onChange={(e) => updateImageAnexo(index, e.target.value)}
                            placeholder="⚠️ Descripción OBLIGATORIA para esta imagen..."
                            rows={2}
                            disabled={savingReport}
                            style={{
                              width: '100%',
                              padding: '6px',
                              fontSize: '11px',
                              border: validationErrors.includes(index) ? '2px solid #dc2626' : '1px solid #ddd',
                              borderRadius: '4px',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              background: validationErrors.includes(index) ? '#fee2e2' : 'white'
                            }}
                          />
                          {validationErrors.includes(index) && (
                            <span style={{
                              fontSize: '11px',
                              color: '#dc2626',
                              display: 'block',
                              marginTop: '4px',
                              fontWeight: '500'
                            }}>
                              ⚠️ Esta imagen requiere una descripción
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="editable-section">
                <label>Links de referencia:</label>
                <textarea
                  value={formData.links}
                  onChange={e => handleChange('links', e.target.value)}
                  placeholder="https://ejemplo.com&#10;https://otro-link.com"
                  rows={3}
                />
              </div>
            </div>

            <div className="pdf-footer">
              <p>Sede CECOM de la Sub Gerencia de Serenazgo:</p>
              <p>Av. Sta. Rosa de Lima, San Juan de Lurigancho 15427</p>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={savingReport}
          >
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={generarPDF}
            disabled={savingReport || loadingEvidences}
          >
            {savingReport ? '💾 Guardando evidencias...' : 'Descargar PDF'}
          </button>
        </div>

        {formData.imagenes.length > 0 && (
          <div style={{
            padding: '12px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px',
            marginTop: '10px',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)'
          }}>
            <strong>ℹ️ Información:</strong> Al hacer clic en "Descargar PDF", las imágenes nuevas y la descripción adicional se guardarán automáticamente en el servidor.
          </div>
        )}
      </div>
    </div>
  )
}