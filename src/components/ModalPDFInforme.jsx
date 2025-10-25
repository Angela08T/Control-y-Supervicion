import React, { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'

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
    caseta: '',
    falta: '',
    articulo: '',
    bodycam: '',
    bodycamAsignadaA: '',
    encargadoBodycam: '',
    supervisor: '',
    descripcionAdicional: '',
    tipoInasistencia: '',
    fechaFalta: '',
    imagenes: [],
    links: '',
    firma: null
  })

  useEffect(() => {
    if (incidencia) {
      const numeroInforme = `${String(Math.floor(Math.random() * 999)).padStart(3, '0')}-2025-CS-SS-GOP/MDSJL`
      
      let cargo = ''
      if (incidencia.dirigidoA === 'Jefe de operaciones') cargo = 'Jefe de Operaciones'
      else if (incidencia.dirigidoA === 'Coordinadores') cargo = 'Coordinador'
      else if (incidencia.dirigidoA === 'Subgerente') cargo = 'Subgerente'

      const articulo = articulosPorFalta[incidencia.falta] || ''

      // OBTENER SOLO LA DIRECCIÓN, NO LAS COORDENADAS
      const obtenerDireccion = () => {
        if (incidencia.ubicacion?.address) {
          return incidencia.ubicacion.address
        } else if (incidencia.ubicacion?.coordinates) {
          // Si no hay dirección pero sí coordenadas, mostrar un mensaje
          return 'Dirección no especificada (solo coordenadas)'
        } else if (Array.isArray(incidencia.ubicacion)) {
          // Para ubicaciones antiguas (solo array de coordenadas)
          return 'Dirección no especificada (solo coordenadas)'
        }
        return 'No especificada'
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
        sereno: 'PILLACA HUARHUACHI PAUL KING',
        dni: incidencia.dni || '',
        cargo: incidencia.cargo || '',
        regLab: incidencia.regLab || '',
        caseta: 'Caseta 1057',
        falta: incidencia.falta || '',
        articulo,
        bodycam: incidencia.bodycamNumber || '',
        bodycamAsignadaA: incidencia.bodycamAsignadaA || '',
        encargadoBodycam: incidencia.encargadoBodycam || '',
        supervisor: 'CENTINELA ALVARADO LAUREANO FRANCO HECTOR',
        descripcionAdicional: '',
        tipoInasistencia: incidencia.tipoInasistencia || '',
        fechaFalta: incidencia.fechaFalta || '',
        imagenes: [],
        links: '',
        firma: null
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
            base64: event.target.result
          }]
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  function removeImage(index) {
    setFormData(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index)
    }))
  }

  function handleFirmaUpload(e) {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          firma: {
            name: file.name,
            base64: event.target.result
          }
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  function removeFirma() {
    setFormData(prev => ({
      ...prev,
      firma: null
    }))
  }

  function generarPDF() {
    const doc = new jsPDF()
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    
    doc.text('SAN JUAN DE LURIGANCHO', 105, 20, { align: 'center' })
    doc.setFontSize(10)
    doc.text('es momento de crecer', 105, 26, { align: 'center' })
    
    doc.setFontSize(9)
    doc.text('"Año de la recuperación y consolidación de la economía peruana"', 105, 35, { align: 'center' })
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    const startY = 45
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
    
    doc.text(`FECHA   :    San Juan de Lurigancho, ${formData.fecha}`, 20, currentLine)
    currentLine += 6
    
    doc.line(20, currentLine, 190, currentLine)
    currentLine += 8
    
    doc.setFontSize(9)
    
    doc.text('Es grato dirigirme a Ud. con la finalidad de informarle lo siguiente:', 20, currentLine)
    currentLine += 8
    
    let textoIncidente = ''
    
    if (incidencia.asunto === 'Inasistencia') {
      textoIncidente = `Mediante el presente se informa que el día ${formData.fechaFalta}, el sereno ${formData.sereno}, (${formData.caseta}), con cargo de ${formData.cargo} y Reg. Lab ${formData.regLab}, incurrió en la falta de ${formData.falta.toUpperCase()}, la cual ha sido clasificada como ${formData.tipoInasistencia.toLowerCase()}. Dicha incidencia fue registrada el ${formData.fechaIncidente} a las ${formData.horaIncidente} en la jurisdicción de ${formData.jurisdiccion}.`
    } else {
      // USAR SOLO LA DIRECCIÓN EN EL TEXTO DEL PDF
      textoIncidente = `Siendo las ${formData.horaIncidente} pm, del día ${formData.fechaIncidente}, en ${formData.ubicacion}, jurisdicción de ${formData.jurisdiccion}, el sereno, ${formData.sereno}, (${formData.caseta}), con cargo de ${formData.cargo} y Reg. Lab ${formData.regLab}, fue encontrado incurriendo en la presente falta disciplinaria de ${formData.falta.toUpperCase()}, durante el monitoreo de Control y Supervisión por el ${formData.supervisor} a través de la BODYCAM (${formData.bodycam}).`
    }
    
    const lineasIncidente = doc.splitTextToSize(textoIncidente, 170)
    doc.text(lineasIncidente, 20, currentLine)
    currentLine += (lineasIncidente.length * 5) + 5
    
    if (incidencia.asunto !== 'Inasistencia') {
      const textoBodycam = `La BODYCAM (${formData.bodycam}) asignada a ${formData.bodycamAsignadaA}, bajo responsabilidad de ${formData.encargadoBodycam}, fue la que enfocó al Sereno Conductor infringiendo el Artículo ${formData.articulo}.`
      const lineasBodycam = doc.splitTextToSize(textoBodycam, 170)
      doc.text(lineasBodycam, 20, currentLine)
      currentLine += (lineasBodycam.length * 5) + 5
    }
    
    doc.setFont('helvetica', 'italic')
    const cita = `Que cita: "${formData.falta} en las instalaciones del centro de labores, sin importar si dicha acción se realiza o no en jornada laboral, la cual conlleva a la aplicación de la sanción de la amonestación escrita", ya que el personal operativo debe estar en cumplimiento de sus funciones y deberes durante su jornada laboral, por lo tanto, deberían estar atentos y alertas al punto asignado por si ocurriese alguna emergencia o algún tipo de apoyo.`
    
    const lineasCita = doc.splitTextToSize(cita, 170)
    doc.text(lineasCita, 20, currentLine)
    currentLine += (lineasCita.length * 5) + 5
    
    doc.setFont('helvetica', 'normal')
    const infoAdicional = incidencia.asunto === 'Inasistencia' 
      ? `Se adjunta al presente, la información del señor ${formData.sereno} y el historial de inasistencias correspondiente.`
      : `Se adjunta al presente, la información del señor ${formData.sereno}, las tomas fotográficas de la BODYCAM (${formData.bodycam}) dentro del módulo Santa Rosa.`
    
    const lineasInfo = doc.splitTextToSize(infoAdicional, 170)
    doc.text(lineasInfo, 20, currentLine)
    currentLine += (lineasInfo.length * 5) + 5
    
    if (formData.descripcionAdicional) {
      const lineasAdicional = doc.splitTextToSize(formData.descripcionAdicional, 170)
      doc.text(lineasAdicional, 20, currentLine)
      currentLine += (lineasAdicional.length * 5) + 10
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
      formData.imagenes.forEach((img) => {
        if (currentLine > 250) {
          doc.addPage()
          currentLine = 20
        }
        
        try {
          doc.addImage(img.base64, 'JPEG', 20, currentLine, 80, 60)
          currentLine += 70
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
    
    if (formData.firma) {
      if (currentLine > 200) {
        doc.addPage()
        currentLine = 20
      }
      
      try {
        doc.addImage(formData.firma.base64, 'JPEG', 20, currentLine, 60, 30)
        currentLine += 35
        
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.text('Firma Digital', 20, currentLine)
        currentLine += 5
        doc.setFont('helvetica', 'normal')
        doc.text('Control y Supervisión', 20, currentLine)
      } catch (error) {
        console.error('Error al agregar firma:', error)
      }
    }
    
    const pageCount = doc.internal.getNumberOfPages()
    doc.setPage(pageCount)
    doc.setFontSize(8)
    doc.text('Sede CECOM de la Sub Gerencia de Serenazgo:', 20, 280)
    doc.text('Av. Sta. Rosa de Lima, San Juan de Lurigancho 15427', 20, 285)
    
    doc.save(`Informe_${incidencia.dni}_${Date.now()}.pdf`)
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
                  onChange={e => handleChange('sereno', e.target.value)}
                />
              </div>

              <div className="editable-section">
                <label>DNI:</label>
                <input 
                  type="text"
                  value={formData.dni}
                  onChange={e => handleChange('dni', e.target.value)}
                />
              </div>

              <div className="editable-section">
                <label>Cargo:</label>
                <input 
                  type="text"
                  value={formData.cargo}
                  onChange={e => handleChange('cargo', e.target.value)}
                />
              </div>

              <div className="editable-section">
                <label>Reg. Lab:</label>
                <input 
                  type="text"
                  value={formData.regLab}
                  onChange={e => handleChange('regLab', e.target.value)}
                />
              </div>

              <div className="editable-section">
                <label>Caseta:</label>
                <input 
                  type="text"
                  value={formData.caseta}
                  onChange={e => handleChange('caseta', e.target.value)}
                />
              </div>

              <div className="editable-section">
                <label>Falta:</label>
                <input 
                  type="text"
                  value={formData.falta}
                  onChange={e => handleChange('falta', e.target.value)}
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
                      onChange={e => handleChange('bodycam', e.target.value)}
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

                  <div className="editable-section">
                    <label>Encargado de bodycam:</label>
                    <input 
                      type="text"
                      value={formData.encargadoBodycam}
                      onChange={e => handleChange('encargadoBodycam', e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="editable-section">
                <label>Supervisor:</label>
                <input 
                  type="text"
                  value={formData.supervisor}
                  onChange={e => handleChange('supervisor', e.target.value)}
                />
              </div>

              <div className="editable-section">
                <label>Descripción adicional (opcional):</label>
                <textarea 
                  value={formData.descripcionAdicional}
                  onChange={e => handleChange('descripcionAdicional', e.target.value)}
                  placeholder="Agregar información adicional..."
                  rows={4}
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
                      <div key={index} className="image-item">
                        <img src={img.url} alt={img.name} />
                        <button 
                          type="button"
                          onClick={() => removeImage(index)}
                          className="btn-remove-img"
                        >
                          ×
                        </button>
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

              <div className="editable-section">
                <label>Firma digital (imagen):</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleFirmaUpload}
                  style={{padding: '8px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px'}}
                />
                {formData.firma && (
                  <div style={{marginTop: '10px', padding: '8px', background: '#f0f8f0', border: '1px solid #90EE90', borderRadius: '4px'}}>
                    <p style={{fontSize: '12px', color: '#006400', margin: '0'}}>
                      ✓ Firma cargada correctamente. Se incluirá en el PDF con fondo blanco.
                    </p>
                    <button 
                      type="button"
                      onClick={removeFirma}
                      style={{
                        marginTop: '5px',
                        background: '#ff4444',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Eliminar firma
                    </button>
                  </div>
                )}
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