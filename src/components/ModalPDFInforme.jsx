import React, { useState, useEffect } from 'react'
import { pdf } from '@react-pdf/renderer'
import { useSelector } from 'react-redux'
import logoSJL from '../assets/logo-sjl.png'
import { trackPDFDownload } from '../utils/storage'
import { getReportWithEvidences, updateReportWithEvidences, getEvidenceImageUrl, deleteEvidence } from '../api/report'
import { getAttendances } from '../api/offender'
import InformePDFDocument from './PDFDocument'
import { toast } from '../utils/toast'

function formatearFecha(fecha) {
  if (!fecha) return 'Fecha no disponible'

  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

  let d

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

export default function ModalPDFInforme({ incidencia, inasistenciasHistoricas = [], onClose, onSave }) {
  // Obtener usuario logueado de Redux
  const { username, nombre, apellido } = useSelector((state) => state.auth)

  const nombreFirmante = (nombre && apellido) ? `${nombre} ${apellido}`.toUpperCase() : (username ? username.toUpperCase() : 'SUPERVISOR')

  // Detectar si es un reporte de inasistencias
  const isAbsenceReport = incidencia?.isAbsenceReport || false

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
  const [validationErrors, setValidationErrors] = useState([])
  const [logoBase64, setLogoBase64] = useState('')
  const [attendanceData, setAttendanceData] = useState([]) // Datos de attendance para reportes de inasistencias
  const [loadingAttendance, setLoadingAttendance] = useState(false)

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
        const reportData = await getReportWithEvidences(incidencia.id)

        if (reportData && reportData.evidences && reportData.evidences.length > 0) {

          // Cargar las imágenes existentes y convertirlas a base64 para el PDF
          const imagenesExistentes = await Promise.all(
            reportData.evidences.map(async (ev) => {
              try {

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
                return null
              }
            })
          )

          // Filtrar imágenes que se cargaron exitosamente
          const imagenesValidas = imagenesExistentes.filter(img => img !== null)

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

  function handleChange(field, value) {
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

  async function removeImage(index) {
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
    const errores = []
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
      const files = nuevasImagenes.map(img => img.file).filter(Boolean)
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
      let errorMessage = 'Error al guardar los cambios'
      if (error.response?.data?.message) {
        errorMessage = Array.isArray(error.response.data.message)
          ? 'Errores:\n' + error.response.data.message.join('\n')
          : error.response.data.message
      }

      toast.error(errorMessage)
    } finally {
      setSavingReport(false)
    }
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
      toast.error(`⚠️ Todas las imágenes requieren una descripción. Por favor, agrega descripciones a las imágenes: ${errores.map(i => i + 1).join(', ')}`)
      return
    }

    // Si hay imágenes nuevas, actualizar el reporte en el backend
    const nuevasImagenes = formData.imagenes.filter(img => !img.isExisting)

    if (nuevasImagenes.length > 0 || formData.descripcionAdicional) {
      setSavingReport(true)
      try {
        const files = nuevasImagenes.map(img => img.file).filter(Boolean)
        const descriptions = nuevasImagenes.map(img => img.anexo)

        await updateReportWithEvidences(
          incidencia.id,
          files,
          descriptions,
          formData.descripcionAdicional,
          formData.links
        )

      } catch (error) {

        let errorMessage = 'Error al guardar las evidencias en el servidor'
        if (error.response?.data?.message) {
          errorMessage = Array.isArray(error.response.data.message)
            ? 'Errores:\n' + error.response.data.message.join('\n')
            : error.response.data.message
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
      let inasistenciasParaPDF = inasistenciasHistoricas

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
    <div className="modal-backdrop">
      <div className="modal-pdf">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3>Vista Previa del Informe</h3>
            {/* Badge de estado */}
            {incidencia.status === 'approved' && (
              <span style={{
                padding: '4px 12px',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.5)',
                borderRadius: '12px',
                color: '#22c55e',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                ✓ Aprobado
              </span>
            )}
            {incidencia.status === 'pending' && (
              <span style={{
                padding: '4px 12px',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                borderRadius: '12px',
                color: '#f59e0b',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                ⏳ Pendiente de aprobación
              </span>
            )}
            {incidencia.status === 'draft' && (
              <span style={{
                padding: '4px 12px',
                backgroundColor: 'rgba(148, 163, 184, 0.2)',
                border: '1px solid rgba(148, 163, 184, 0.5)',
                borderRadius: '12px',
                color: '#94a3b8',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                📝 Borrador
              </span>
            )}
            {incidencia.status === 'rejected' && (
              <span style={{
                padding: '4px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '12px',
                color: '#ef4444',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                ✗ Rechazado
              </span>
            )}
          </div>
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
                {incidencia.status === 'approved' ? (
                  <input
                    value={formData.numeroInforme}
                    readOnly
                    style={{
                      cursor: 'not-allowed',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      borderColor: 'rgba(34, 197, 94, 0.5)',
                      fontWeight: 'bold'
                    }}
                    title="Código generado automáticamente al aprobar"
                  />
                ) : (
                  <div style={{ flex: 1 }}>
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.5)',
                      borderRadius: '4px',
                      color: '#f59e0b',
                      fontSize: '0.9rem',
                      fontStyle: 'italic'
                    }}>
                      ⏳ Se generará automáticamente al aprobar el informe
                    </div>
                    <div style={{
                      marginTop: '6px',
                      padding: '6px 8px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.4'
                    }}>
                      <strong>ℹ️ Nota:</strong> El código del informe será asignado automáticamente por el sistema
                      con el número correlativo y año correspondiente una vez que el informe sea aprobado.
                      Hasta entonces, no es necesario ingresar ningún código manualmente.
                    </div>
                  </div>
                )}
              </div>

              <div className="info-row">
                <strong>A :</strong>
                <div className="info-input-group">
                  <span>Sr.</span>
                  <input
                    value={formData.destinatarioNombre}
                    onChange={e => handleChange('destinatarioNombre', e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase' }}
                  />
                  <input
                    value={formData.destinatarioCargo}
                    onChange={e => handleChange('destinatarioCargo', e.target.value.toUpperCase())}
                    placeholder="Cargo"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>

              {incidencia.cc && incidencia.cc.length > 0 && (
                <div className="info-row">
                  <strong>CC :</strong>
                  <span>{incidencia.cc.join(', ').toUpperCase()}</span>
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
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div className="info-row">
                <strong>FECHA :</strong>
                <input
                  value={formData.fecha}
                  onChange={e => handleChange('fecha', e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>

            <hr className="separator" />

            <div className="pdf-body">
              {/* Mostrar contenido simplificado para inasistencias (modelo del validador) */}
              {esInasistencia ? (
                <>
                  {/* Párrafo descriptivo del reporte de inasistencias */}
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
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '10px' }}>
                      Cargando inasistencias...
                    </div>
                  ) : attendanceData.length === 0 ? (
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
                          {attendanceData
                            .filter(person => {
                              const validDates = person.dates?.filter(d => !d.delete_at && d.date)
                              return validDates && validDates.length > 0
                            })
                            .map((person, index) => {
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
                                    {incidencia.absenceMode === 'JUSTIFIED' || formData.tipoInasistencia === 'Justificada' ? 'JUSTIFICADA' : 'INJUSTIFICADA'}
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
                </>
              ) : (
                <>
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

                  {formData.tipoMedio === 'bodycam' ? (
                    <>
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
                  ) : (
                    <div className="editable-section">
                      <label>N° Cámara:</label>
                      <input
                        type="text"
                        value={formData.numeroCamara}
                        readOnly
                        style={{ cursor: 'not-allowed' }}
                      />
                    </div>
                  )}
                </>
              )}

              {!esInasistencia && (
                <div className="editable-section">
                  <label>Supervisor:</label>
                  <input
                    type="text"
                    value={formData.supervisor}
                    readOnly
                    style={{ cursor: 'not-allowed' }}
                  />
                </div>
              )}

              {!esInasistencia && (
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
                    <ul style={{ marginTop: '4px', marginLeft: '20px', lineHeight: '1.5' }}>
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
                  <div className="editable-section">
                    <label>Adjuntar imágenes:</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={loadingEvidences || savingReport}
                      style={{ padding: '8px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px' }}
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
                            <div style={{ marginTop: '8px' }}>
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
                </>
              )}
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
            className="btn-secondary"
            onClick={guardarCambios}
            disabled={savingReport || loadingEvidences}
            style={{ marginLeft: '10px' }}
          >
            {savingReport ? '💾 Guardando...' : 'Guardar'}
          </button>
          <button
            className="btn-primary"
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