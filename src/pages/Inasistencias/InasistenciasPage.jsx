import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import CalendarioInasistencias from '../../components/CalendarioInasistencias'
import ModalInasistencia from '../../components/ModalInasistencia'
import { createReport, getReports, mapFormDataToAPI } from '../../api/report'
import { createOffender, mapFormDataToOffenderAPI, getOffenders, createAttendances, getAttendances, deleteAttendance } from '../../api/offender'
import { getModulePermissions } from '../../utils/permissions'
import { FaPlus } from 'react-icons/fa'
import { initSocket, onReportStatusChanged, disconnectSocket } from '../../services/websocket'

export default function InasistenciasPage() {
  const { role: userRole } = useSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'incidencias')

  const [inasistencias, setInasistencias] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [savedAttendances, setSavedAttendances] = useState([]) // Inasistencias guardadas desde la API
  const [currentMonth, setCurrentMonth] = useState(new Date()) // Mes actual del calendario

  // WebSocket: Escuchar cambios de estado de reportes en tiempo real
  useEffect(() => {
    initSocket()

    const unsubscribe = onReportStatusChanged((data) => {
      console.log('Cambio de estado recibido:', data)
      setRefreshTrigger(prev => prev + 1)
    })

    return () => {
      unsubscribe()
      disconnectSocket()
    }
  }, [])

  // Cargar inasistencias desde la API de offenders
  useEffect(() => {
    console.log('🔄 useEffect ejecutándose - refreshTrigger:', refreshTrigger)
    async function fetchInasistencias() {
      setLoading(true)
      try {
        // 🔹 NUEVO: Obtener offenders (inasistencias) desde el endpoint de offender
        const result = await getOffenders(1, 1000)
        console.log('📡 Respuesta completa de API:', result)
        console.log('📡 result:', JSON.stringify(result, null, 2))

        // La API devuelve: { message: "...", data: { data: [...], pagination... } }
        // Intentar extraer el array de datos
        let offendersData = []

        if (Array.isArray(result)) {
          // Si result es directamente un array
          offendersData = result
        } else if (result.data?.data && Array.isArray(result.data.data)) {
          // Si está anidado en result.data.data (PRIORIDAD)
          offendersData = result.data.data
        } else if (Array.isArray(result.data)) {
          // Si result.data es un array
          offendersData = result.data
        } else if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
          // Si result.data es un objeto individual (solo 1 registro)
          offendersData = [result.data]
        } else if (result.rows && Array.isArray(result.rows)) {
          // Algunas APIs usan "rows"
          offendersData = result.rows
        }

        console.log('📊 Offenders extraídos (array):', offendersData)
        console.log('📊 Cantidad de offenders:', offendersData.length)

        // Mapear los datos de offenders al formato esperado por la tabla
        const inasistenciasData = offendersData.map(offender => ({
          id: offender.id || offender.gestionate_id,
          dni: offender.dni,
          nombreCompleto: `${offender.name || ''} ${offender.lastname || ''}`.trim(),
          turno: offender.shift, // Puede venir "Mañana", "M", etc.
          cargo: offender.job,
          regLab: offender.regime,
          subgerencia: offender.subgerencia,
          asunto: 'Inasistencia', // Asumimos que todos los offenders son inasistencias
          falta: 'Inasistencia', // Tipo genérico
          fechaIncidente: offender.created_at ? new Date(offender.created_at).toLocaleDateString('es-PE') : '',
          createdAt: offender.created_at,
          updatedAt: offender.updated_at
        }))

        console.log('✅ Inasistencias mapeadas:', inasistenciasData)
        setInasistencias(inasistenciasData)
      } catch (error) {
        console.error('❌ Error al cargar inasistencias:', error)
        console.error('❌ Error completo:', error.response || error)

        // Mostrar mensaje de error más específico
        let errorMessage = 'No se pudieron cargar las inasistencias'
        if (error.response?.status === 404) {
          errorMessage = 'No hay inasistencias registradas aún'
          setInasistencias([]) // Lista vacía
        } else if (error.message) {
          errorMessage += ': ' + error.message
        }

        console.warn('⚠️ ', errorMessage)
        // No mostrar alert si es 404 (no hay datos)
        if (error.response?.status !== 404) {
          alert(errorMessage)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchInasistencias()
  }, [refreshTrigger])

  // Cargar inasistencias guardadas (attendances) del mes actual
  useEffect(() => {
    async function fetchSavedAttendances() {
      try {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()

        // Calcular primer y último día del mes
        const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
        const lastDay = new Date(year, month + 1, 0).getDate()
        const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

        console.log(`📅 Cargando attendances del mes: ${start} a ${end}`)
        const result = await getAttendances(start, end)

        console.log('📊 Attendances del mes obtenidas:', result)

        // Extraer los datos del response
        const attendancesData = result.data || []

        setSavedAttendances(attendancesData)
      } catch (error) {
        console.error('❌ Error al cargar attendances guardadas:', error)
        // Si es 404, simplemente no hay attendances guardadas aún
        if (error.response?.status !== 404) {
          console.warn('⚠️ No se pudieron cargar las inasistencias guardadas')
        }
        setSavedAttendances([])
      }
    }

    fetchSavedAttendances()
  }, [currentMonth, refreshTrigger])

  // Crear inasistencia
  async function handleCreate(data, allLeads = []) {
    try {
      // 🔹 NUEVO: Usar endpoint de offender para inasistencias
      const offenderData = mapFormDataToOffenderAPI(data)
      console.log('📤 Enviando inasistencia a API de offender:', offenderData)
      const response = await createOffender(offenderData)
      console.log('✅ Inasistencia creada en API de offender:', response)

      alert('Inasistencia creada exitosamente')

      setShowModal(false)

      // Esperar un momento antes de recargar para asegurar que la API procesó el cambio
      setTimeout(() => {
        console.log('🔄 Activando recarga de la tabla...')
        setRefreshTrigger(prev => {
          console.log('🔄 refreshTrigger anterior:', prev, '→ nuevo:', prev + 1)
          return prev + 1
        })
      }, 500)
    } catch (error) {
      console.error('❌ Error al crear inasistencia:', error)

      let errorMessage = 'Error al crear la inasistencia'

      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = 'Errores de validación:\n' + error.response.data.message.join('\n')
        } else {
          errorMessage = error.response.data.message
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      alert(errorMessage)
    }
  }

  async function handleSaveMarks(marks) {
    // Guardar las marcas de falta seleccionadas en la API usando /api/attendance
    console.log('📋 Marcas a guardar:', marks)

    if (!marks || marks.length === 0) {
      alert('No hay marcas para guardar')
      return
    }

    try {
      // Agrupar marcas por offender_id (DNI)
      const groupedByOffender = {}

      for (const mark of marks) {
        // Buscar información del offender en las inasistencias
        const offenderInfo = inasistencias.find(i => i.dni === mark.dni)

        if (!offenderInfo) {
          console.warn(`⚠️ No se encontró información para DNI: ${mark.dni}`)
          continue
        }

        // Usar el ID del offender (puede ser id o gestionate_id)
        const offenderId = offenderInfo.id

        if (!offenderId) {
          console.warn(`⚠️ No se encontró ID para offender con DNI: ${mark.dni}`)
          continue
        }

        // Formatear la fecha en formato YYYY-MM-DD
        const date = `${mark.anio}-${String(mark.mes).padStart(2, '0')}-${String(mark.dia).padStart(2, '0')}`

        // Determinar el modo (JUSTIFIED o UNJUSTIFIED)
        const mode = mark.tipo === 'justificada' ? 'JUSTIFIED' : 'UNJUSTIFIED'

        // Agrupar por offender_id
        if (!groupedByOffender[offenderId]) {
          groupedByOffender[offenderId] = []
        }

        groupedByOffender[offenderId].push({ date, mode })
      }

      // Construir el payload para la API
      const items = Object.keys(groupedByOffender).map(offenderId => ({
        offender_id: offenderId,
        attendances: groupedByOffender[offenderId]
      }))

      const payload = { items }

      console.log('📤 Payload para /api/attendance:', JSON.stringify(payload, null, 2))

      // Enviar a la API
      const response = await createAttendances(payload)

      console.log('✅ Respuesta de API:', response)

      // Verificar la respuesta
      const count = response.data?.count || 0

      if (count > 0 || response.message?.includes('exitosa')) {
        alert(`Se guardaron ${count} inasistencia(s) exitosamente`)
        setRefreshTrigger(prev => prev + 1)
      } else {
        alert('No se pudieron guardar las inasistencias. Verifica los datos.')
      }
    } catch (error) {
      console.error('❌ Error al guardar inasistencias:', error)
      console.error('❌ Detalles del error:', error.response?.data)

      let errorMessage = 'Error al guardar las inasistencias'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      alert(errorMessage)
    }
  }

  function handleDelete() {
    alert('Selecciona una inasistencia para eliminar')
  }

  // Manejar cambio de mes en el calendario
  function handleMonthChange(newMonth) {
    console.log('📅 Cambiando a mes:', newMonth)
    setCurrentMonth(newMonth)
  }

  // Eliminar marcas (attendances) en modo edición
  async function handleDeleteMarks(marksToDelete) {
    console.log('🗑️ Marcas a eliminar:', marksToDelete)

    if (!marksToDelete || marksToDelete.length === 0) {
      alert('No hay marcas para eliminar')
      return
    }

    try {
      // Eliminar cada marca
      for (const markId of marksToDelete) {
        await deleteAttendance(markId)
      }

      alert(`Se eliminaron ${marksToDelete.length} marca(s) exitosamente`)
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('❌ Error al eliminar marcas:', error)

      let errorMessage = 'Error al eliminar las marcas'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      alert(errorMessage)
    }
  }

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
          <h2>CONTROL Y SUPERVISIÓN</h2>
          <div className="controls">
            {permissions.canCreate && (
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                <FaPlus style={{ marginRight: '8px' }} />
                Agregar
              </button>
            )}
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-muted)',
          fontSize: '1.1rem'
        }}>
          Cargando inasistencias...
        </div>
      ) : (
        <CalendarioInasistencias
          inasistencias={inasistencias}
          savedAttendances={savedAttendances}
          onSave={handleSaveMarks}
          onDelete={handleDelete}
          onDeleteMarks={handleDeleteMarks}
          onMonthChange={handleMonthChange}
        />
      )}

      {showModal && (
        <ModalInasistencia
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  )
}
