import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import CalendarioInasistencias from '../../components/CalendarioInasistencias'
import ModalInasistencia from '../../components/ModalInasistencia'
import CalendarModal from '../Dashboard/components/CalendarModal'
import { createReport, getReports, mapFormDataToAPI } from '../../api/report'
import { createOffender, mapFormDataToOffenderAPI, getOffenders, createAttendances, getAttendances, deleteAttendance } from '../../api/offender'
import { getModulePermissions } from '../../utils/permissions'
import { FaPlus, FaCalendarAlt, FaFilePdf } from 'react-icons/fa'
import { initSocket, onReportStatusChanged, disconnectSocket } from '../../services/websocket'
import ModalPDFInasistencias from '../../components/ModalPDFInasistencias'

export default function InasistenciasPage() {
  const { role: userRole } = useSelector((state) => state.auth)
  const permissions = getModulePermissions(userRole, 'incidencias')

  const [inasistencias, setInasistencias] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [savedAttendances, setSavedAttendances] = useState([]) // Inasistencias guardadas desde la API
  const [currentMonth, setCurrentMonth] = useState(new Date()) // Mes actual del calendario

  // Estado para el rango de fechas (por defecto: mes actual)
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    return { start, end }
  })

  // WebSocket: Escuchar cambios de estado de reportes en tiempo real
  useEffect(() => {
    initSocket()

    const unsubscribe = onReportStatusChanged((data) => {
      setRefreshTrigger(prev => prev + 1)
    })

    return () => {
      unsubscribe()
      disconnectSocket()
    }
  }, [])

  // Cargar inasistencias desde la API de attendance con rango de fechas
  useEffect(() => {
    async function fetchInasistencias() {
      setLoading(true)
      try {
        // Formatear fechas para la API
        const startStr = `${dateRange.start.getFullYear()}-${String(dateRange.start.getMonth() + 1).padStart(2, '0')}-${String(dateRange.start.getDate()).padStart(2, '0')}`
        const endStr = `${dateRange.end.getFullYear()}-${String(dateRange.end.getMonth() + 1).padStart(2, '0')}-${String(dateRange.end.getDate()).padStart(2, '0')}`

        const result = await getAttendances(startStr, endStr)

        // Extraer los datos del response
        const attendancesData = result.data || []

        // Mapear los datos de attendances al formato esperado por la tabla
        const inasistenciasData = attendancesData.map(person => ({
          id: person.id || person.offender_id,
          dni: person.dni,
          nombreCompleto: person.name && person.lastname
            ? `${person.name} ${person.lastname}`.trim()
            : person.fullname || null,
          turno: person.shift || null,
          cargo: person.job || null,
          regLab: person.regime || null,
          subgerencia: person.subgerencia || person.jurisdiction || null,
          asunto: 'Inasistencia',
          falta: 'Inasistencia',
          fechaIncidente: null,
          createdAt: person.created_at,
          updatedAt: person.updated_at
        }))

        setInasistencias(inasistenciasData)

        // También actualizar savedAttendances con los mismos datos
        setSavedAttendances(attendancesData)
      } catch (error) {
        // Mostrar mensaje de error más específico
        let errorMessage = 'No se pudieron cargar las inasistencias'
        if (error.response?.status === 404) {
          errorMessage = 'No hay inasistencias registradas aún'
          setInasistencias([])
          setSavedAttendances([])
        } else if (error.message) {
          errorMessage += ': ' + error.message
        }

        // No mostrar alert si es 404 (no hay datos)
        if (error.response?.status !== 404) {
          alert(errorMessage)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchInasistencias()
  }, [refreshTrigger, dateRange])

  // Función para manejar la selección de rango de fechas desde el modal
  function handleDateRangeSelect(start, end) {
    setDateRange({ start, end })
    setShowCalendarModal(false)
  }

  // Formatear rango de fechas para mostrar
  function formatDateRange() {
    const options = { day: '2-digit', month: 'short', year: 'numeric' }
    const startStr = dateRange.start.toLocaleDateString('es-PE', options)
    const endStr = dateRange.end.toLocaleDateString('es-PE', options)
    return `${startStr} - ${endStr}`
  }

  // Crear inasistencia
  async function handleCreate(data, allLeads = []) {
    try {
      // 🔹 NUEVO: Usar endpoint de offender para inasistencias
      const offenderData = mapFormDataToOffenderAPI(data)
      const response = await createOffender(offenderData)

      alert('Inasistencia creada exitosamente')

      setShowModal(false)

      // Esperar un momento antes de recargar para asegurar que la API procesó el cambio
      setTimeout(() => {
        setRefreshTrigger(prev => {
          return prev + 1
        })
      }, 500)
    } catch (error) {

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
          continue
        }

        // Usar el ID del offender (puede ser id o gestionate_id)
        const offenderId = offenderInfo.id

        if (!offenderId) {
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

      // Enviar a la API
      const response = await createAttendances(payload)

      // Verificar la respuesta
      const count = response.data?.count || 0

      if (count > 0 || response.message?.includes('exitosa')) {
        alert(`Se guardaron ${count} inasistencia(s) exitosamente`)
        setRefreshTrigger(prev => prev + 1)
      } else {
        alert('No se pudieron guardar las inasistencias. Verifica los datos.')
      }
    } catch (error) {
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
    setCurrentMonth(newMonth)
  }

  // Eliminar marcas (attendances) en modo edición
  async function handleDeleteMarks(marksToDelete) {
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
          <div className="controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Botón de calendario para seleccionar rango de fechas */}
            <button
              className="btn-secondary"
              onClick={() => setShowCalendarModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px'
              }}
            >
              <FaCalendarAlt />
              <span style={{ fontSize: '0.85rem' }}>{formatDateRange()}</span>
            </button>

            {/* Botón +PDF para validadores */}
            {userRole === 'validator' && (
              <button
                className="btn-primary"
                onClick={() => setShowPDFModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FaFilePdf />
                PDF
              </button>
            )}

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
          dateRange={dateRange}
          isReadOnly={userRole === 'validator'}
        />
      )}

      {showModal && (
        <ModalInasistencia
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
        />
      )}

      {showCalendarModal && (
        <CalendarModal
          onClose={() => setShowCalendarModal(false)}
          onApply={handleDateRangeSelect}
        />
      )}

      {showPDFModal && (
        <ModalPDFInasistencias
          onClose={() => setShowPDFModal(false)}
          inasistencias={inasistencias}
          savedAttendances={savedAttendances}
          dateRange={dateRange}
          onReportCreated={() => {
            // Forzar recarga de datos cuando se crea un reporte
            setRefreshTrigger(prev => prev + 1)
          }}
        />
      )}
    </div>
  )
}
