import React, { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import { useSelector } from 'react-redux'
import logoSJL from '../assets/logo-sjl.png'
import { trackPDFDownload } from '../utils/storage'

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

      // Generar descripción adicional predeterminada
      const generarDescripcionAdicional = () => {
        const hora = obtenerHoraFormateada(incidencia.horaIncidente)
        const fecha = formatearFecha(incidencia.fechaIncidente)
        const direccion = obtenerDireccion()
        const nombreInfractor = incidencia.nombreCompleto || 'NOMBRE NO DISPONIBLE'
        const cargoPersona = incidencia.cargo || 'GIR'
        const falta = incidencia.falta || 'Falta no especificada'
        const supervisorNombre = username ? username.toUpperCase() : 'SUPERVISOR'
        const bodycamNum = incidencia.bodycamNumber || 'N/A'
        const bodycamAsignada = incidencia.bodycamAsignadaA || 'persona no especificada'
        const articuloNum = articulo || 'N/A'

        // Texto de la cita del artículo
        const citaArticulo = `"${falta} en las instalaciones del centro de labores, sin importar si dicha acción se realiza o no en la jornada laboral, la cual conlleva a la aplicación de la sanción de la amonestación escrita"`

        return `Siendo las ${hora}, del día ${fecha}, en la dirección ${direccion}, la persona ${bodycamAsignada}, con cargo ${cargoPersona}, fue encontrada incurriendo en la presunta falta disciplinaria de ${falta}, durante el monitoreo de Control y Supervisión por el CENTINELA ${supervisorNombre} a través de la BODYCAM ${bodycamNum}.

La BODYCAM ${bodycamNum}, asignada a ${bodycamAsignada} según el KARDEX, fue la que enfocó al ${cargoPersona} infringiendo el Artículo ${articuloNum}.

Que cita: ${citaArticulo}, ya que el personal operativo debe estar en cumplimiento de sus funciones y deberes durante su jornada laboral, por lo tanto, deberían estar atentos y alertas al punto asignado por si ocurriese alguna emergencia o algún tipo de apoyo.

Se adjunta al presente la información de la persona ${bodycamAsignada}, así como las tomas fotográficas de la BODYCAM ${bodycamNum}.`
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
        descripcionAdicional: incidencia.asunto === 'Inasistencia' ? '' : generarDescripcionAdicional(),
        tipoInasistencia: incidencia.tipoInasistencia || '',
        fechaFalta: incidencia.fechaFalta || '',
        imagenes: [],
        links: ''
      })
    }
  }, [incidencia])

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
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
            anexo: ''
          }]
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  function updateImageAnexo(index, anexo) {
    setFormData(prev => ({
      ...prev,
      imagenes: prev.imagenes.map((img, i) =>
        i === index ? { ...img, anexo } : img
      )
    }))
  }

  function removeImage(index) {
    setFormData(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index)
    }))
  }

  function generarPDF() {
    const doc = new jsPDF()

    // Agregar logo de la municipalidad centrado
    try {
      const img = new Image()
      img.src = logoSJL
      // Logo más ancho y centrado (105 es el centro - 25 para centrar logo de 50x30)
      doc.addImage(img, 'PNG', 80, 10, 50, 30)
    } catch (error) {
      console.error('Error al cargar logo:', error)
    }

    // Encabezado
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('"Año de la recuperación y consolidación de la economía peruana"', 105, 45, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    const startY = 55
    let currentLine = startY
    
    doc.text(`INFORME N° ${formData.numeroInforme}`, 20, currentLine)
    currentLine += 8
    
    doc.text(`A       :    Sr. ${formData.destinatarioNombre.toUpperCase()}`, 20, currentLine)
    currentLine += 5
    
    doc.text(`             ${formData.destinatarioCargo}`, 20, currentLine)
    currentLine += 7
    
    if (incidencia.cc && incidencia.cc.length > 0) {
      doc.text(`CC      :    ${incidencia.cc.join(', ')}`, 20, currentLine)
      currentLine += 7
    }
    
    doc.text(`DE      :    CONTROL Y SUPERVISIÓN`, 20, currentLine)
    currentLine += 7
    
    doc.text(`ASUNTO  :    ${incidencia.asunto.toUpperCase()}`, 20, currentLine)
    currentLine += 7

    // Agregar tipo de falta debajo del asunto
    doc.text(`FALTA   :    ${formData.falta.toUpperCase()}`, 20, currentLine)
    currentLine += 7
    
    doc.text(`FECHA   :    San Juan de Lurigancho, ${formData.fecha}`, 20, currentLine)
    currentLine += 6
    
    doc.line(20, currentLine, 190, currentLine)
    currentLine += 8
    
    doc.setFontSize(9)

    doc.text('Es grato dirigirme a Ud. con la finalidad de informarle lo siguiente:', 20, currentLine, { align: 'justify', maxWidth: 170 })
    currentLine += 8

    // Para incidencias que NO son inasistencias, usar la descripción adicional personalizada
    if (incidencia.asunto !== 'Inasistencia' && formData.descripcionAdicional) {
      doc.setFont('helvetica', 'normal')
      const lineasDescripcion = doc.splitTextToSize(formData.descripcionAdicional, 170)
      doc.text(lineasDescripcion, 20, currentLine, { align: 'justify', maxWidth: 170 })
      currentLine += (lineasDescripcion.length * 5) + 5
    } else if (incidencia.asunto === 'Inasistencia') {
      // Para inasistencias, mantener el texto original
      const textoIncidente = `Mediante el presente se informa que el día ${formData.fechaFalta}, el sereno ${formData.nombreCompleto ? formData.nombreCompleto.toUpperCase() : formData.sereno} (DNI: ${formData.dni}), con cargo de ${formData.cargo}, Reg. Lab ${formData.regLab} y turno ${formData.turno}, incurrió en la falta de ${formData.falta.toUpperCase()}, la cual ha sido clasificada como ${formData.tipoInasistencia.toLowerCase()}. Dicha incidencia fue registrada el ${formData.fechaIncidente} a las ${formData.horaIncidente} en la jurisdicción de ${formData.jurisdiccion}.`

      const lineasIncidente = doc.splitTextToSize(textoIncidente, 170)
      doc.text(lineasIncidente, 20, currentLine, { align: 'justify', maxWidth: 170 })
      currentLine += (lineasIncidente.length * 5) + 3

      const nombreParaPDF = formData.nombreCompleto ? formData.nombreCompleto.toUpperCase() : formData.sereno
      const infoAdicional = `Se adjunta al presente, la información del señor ${nombreParaPDF} y el historial de inasistencias correspondiente.`

      const lineasInfo = doc.splitTextToSize(infoAdicional, 170)
      doc.text(lineasInfo, 20, currentLine, { align: 'justify', maxWidth: 170 })
      currentLine += (lineasInfo.length * 5) + 3

      if (formData.descripcionAdicional) {
        const lineasAdicional = doc.splitTextToSize(formData.descripcionAdicional, 170)
        doc.text(lineasAdicional, 20, currentLine, { align: 'justify', maxWidth: 170 })
        currentLine += (lineasAdicional.length * 5) + 5
      }
    }
    
    if (incidencia.asunto === 'Inasistencia' && inasistenciasHistoricas.length > 0) {
      if (currentLine > 200) {
        doc.addPage()
        currentLine = 20
      }
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('HISTORIAL DE INASISTENCIAS DEL PERSONAL:', 20, currentLine)
      currentLine += 8
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      
      doc.text('Fecha', 20, currentLine)
      doc.text('Falta', 60, currentLine)
      doc.text('Tipo', 120, currentLine)
      doc.text('Fecha Falta', 150, currentLine)
      currentLine += 4
      doc.line(20, currentLine, 190, currentLine)
      currentLine += 6
      
      inasistenciasHistoricas.forEach((inasistencia, index) => {
        if (currentLine > 270) {
          doc.addPage()
          currentLine = 20
        }
        
        doc.text(formatearFecha(inasistencia.fechaIncidente), 20, currentLine)
        doc.text(inasistencia.falta, 60, currentLine)
        doc.text(inasistencia.tipoInasistencia || 'No especificado', 120, currentLine)
        doc.text(inasistencia.fechaFalta || inasistencia.fechaIncidente, 150, currentLine)
        currentLine += 6
      })
      
      currentLine += 10
    }
    
    if (formData.imagenes.length > 0) {
      formData.imagenes.forEach((img, index) => {
        // Verificar si hay espacio suficiente para imagen + anexo
        const espacioNecesario = img.anexo ? 85 : 70
        if (currentLine > (280 - espacioNecesario)) {
          doc.addPage()
          currentLine = 20
        }

        try {
          // Configuración de imagen
          const pageWidth = doc.internal.pageSize.getWidth()
          const imageWidth = 100  // Ancho de la imagen en mm
          const imageHeight = 75  // Alto de la imagen en mm
          const imageX = (pageWidth - imageWidth) / 2  // Centrar horizontalmente

          // Agregar imagen centrada
          doc.addImage(img.base64, 'JPEG', imageX, currentLine, imageWidth, imageHeight)
          currentLine += imageHeight + 5

          // Agregar anexo si existe
          if (img.anexo) {
            doc.setFont('helvetica', 'italic')
            doc.setFontSize(8)
            const lineasAnexo = doc.splitTextToSize(`Anexo ${index + 1}: ${img.anexo}`, 170)
            // Centrar el texto usando pageWidth / 2
            doc.text(lineasAnexo, pageWidth / 2, currentLine, { align: 'center', maxWidth: 170 })
            currentLine += (lineasAnexo.length * 4) + 10
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
          } else {
            currentLine += 5
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
      doc.setFontSize(9)
      doc.text('Links de referencia:', 20, currentLine)
      currentLine += 5
      doc.setFont('helvetica', 'normal')
      const lineasLinks = doc.splitTextToSize(formData.links, 170)
      doc.text(lineasLinks, 20, currentLine)
      currentLine += (lineasLinks.length * 5) + 10
    }
    
    const pageCount = doc.internal.getNumberOfPages()
    doc.setPage(pageCount)
    doc.setFontSize(8)
    doc.text('Sede CECOM de la Sub Gerencia de Serenazgo:', 20, 280)
    doc.text('Av. Sta. Rosa de Lima, San Juan de Lurigancho 15427', 20, 285)

    doc.save(`Informe_${incidencia.dni}_${Date.now()}.pdf`)

    // Registrar la descarga del PDF
    trackPDFDownload(incidencia.id)
  }

  const esInasistencia = incidencia.asunto === 'Inasistencia'

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
                <label>Descripción adicional (opcional):</label>
                <textarea
                  value={formData.descripcionAdicional}
                  onChange={e => handleChange('descripcionAdicional', e.target.value)}
                  placeholder="Agregar información adicional..."
                  rows={12}
                  style={{
                    fontSize: '12px',
                    lineHeight: '1.6',
                    fontFamily: 'inherit'
                  }}
                />
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
                  style={{padding: '8px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px'}}
                />
                {formData.imagenes.length > 0 && (
                  <div className="images-preview">
                    {formData.imagenes.map((img, index) => (
                      <div key={index} className="image-item-container">
                        <div className="image-item">
                          <img src={img.url} alt={img.name} />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="btn-remove-img"
                          >
                            ×
                          </button>
                        </div>
                        <div style={{marginTop: '8px'}}>
                          <label style={{fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px'}}>
                            Anexo {index + 1} (opcional):
                          </label>
                          <textarea
                            value={img.anexo || ''}
                            onChange={(e) => updateImageAnexo(index, e.target.value)}
                            placeholder="Descripción o nota para esta imagen..."
                            rows={2}
                            style={{
                              width: '100%',
                              padding: '6px',
                              fontSize: '11px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontFamily: 'inherit',
                              resize: 'vertical'
                            }}
                          />
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
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={generarPDF}>Descargar PDF</button>
        </div>
      </div>
    </div>
  )
}