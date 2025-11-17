import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import CalendarioInasistencias from '../../components/CalendarioInasistencias'
import ModalInasistencia from '../../components/ModalInasistencia'
import { createReport, getReports, mapFormDataToAPI } from '../../api/report'
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

  // Cargar inasistencias desde la API
  useEffect(() => {
    async function fetchInasistencias() {
      setLoading(true)
      try {
        // Obtener todos los reportes (aumentar límite para obtener más datos)
        const result = await getReports(1, 1000, {})
        console.log('Reportes obtenidos:', result)

        // Filtrar solo las que son inasistencias
        const inasistenciasData = result.data.filter(item =>
          item.falta && item.falta.toLowerCase().includes('inasistencia')
        )

        console.log('Inasistencias filtradas:', inasistenciasData)
        setInasistencias(inasistenciasData)
      } catch (error) {
        console.error('Error al cargar inasistencias:', error)
        alert('No se pudieron cargar las inasistencias')
      } finally {
        setLoading(false)
      }
    }

    fetchInasistencias()
  }, [refreshTrigger])

  // Crear inasistencia
  async function handleCreate(data, allLeads = []) {
    try {
      // Preparar datos para inasistencia con fecha y hora actuales
      const now = new Date()
      const inasistenciaData = {
        ...data,
        // Para inasistencias, usar fecha y hora actual
        fechaIncidente: now.toISOString().split('T')[0], // YYYY-MM-DD
        horaIncidente: now.toTimeString().slice(0, 5), // HH:mm
        // No necesita ubicación ni bodycam para inasistencias
        ubicacion: null,
        bodycamNumber: '',
        bodycamAsignadaA: '',
        encargadoBodycam: '',
        medio: 'reporte'
      }

      const apiData = mapFormDataToAPI(inasistenciaData, allLeads)
      console.log('📤 Enviando inasistencia a API:', apiData)
      const response = await createReport(apiData)
      console.log('✅ Inasistencia creada:', response)

      alert('Inasistencia creada exitosamente')

      setShowModal(false)
      setRefreshTrigger(prev => prev + 1)
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
    // Guardar las marcas de falta seleccionadas en la API
    console.log('Marcas a guardar:', marks)

    if (!marks || marks.length === 0) {
      alert('No hay marcas para guardar')
      return
    }

    try {
      // Crear una incidencia por cada marca FL
      let successCount = 0
      let errorCount = 0

      for (const mark of marks) {
        try {
          // Buscar información de la persona en las inasistencias
          const personaInfo = inasistencias.find(i => i.dni === mark.dni)

          if (!personaInfo) {
            console.warn(`No se encontró información para DNI: ${mark.dni}`)
            errorCount++
            continue
          }

          // Crear fecha de la falta (día específico del mes/año seleccionado)
          const fechaFalta = new Date(mark.anio, mark.mes - 1, mark.dia)

          // Construir el payload directamente sin usar mapFormDataToAPI
          // para evitar problemas con campos faltantes
          const payload = {
            header: {
              to: {
                name: personaInfo.destinatario || '',
                job: personaInfo.dirigidoA || personaInfo.cargoDestinatario || ''
              },
              cc: (personaInfo.cc || []).map(nombre => ({
                name: nombre,
                job: ''
              }))
            },
            address: '',
            latitude: null,
            longitude: null,
            date: new Date(Date.UTC(
              mark.anio,
              mark.mes - 1,
              mark.dia,
              0,
              0,
              0
            )).toISOString(),
            offender_dni: mark.dni,
            lack_id: personaInfo.lackId || null,
            subject_id: personaInfo.subjectId || null,
            jurisdiction_id: personaInfo.jurisdictionId || null
          }

          console.log(`📤 Guardando falta para DNI ${mark.dni} - Día ${mark.dia}/${mark.mes}/${mark.anio}`)
          console.log('📤 Payload:', JSON.stringify(payload, null, 2))

          await createReport(payload)
          successCount++
        } catch (error) {
          console.error(`❌ Error al guardar falta para DNI ${mark.dni}:`, error)
          console.error('❌ Detalles del error:', error.response?.data)
          errorCount++
        }
      }

      if (successCount > 0) {
        alert(`Se guardaron ${successCount} falta(s) exitosamente${errorCount > 0 ? ` (${errorCount} con errores)` : ''}`)
        setRefreshTrigger(prev => prev + 1)
      } else {
        alert('No se pudo guardar ninguna falta. Verifica los datos.')
      }
    } catch (error) {
      console.error('❌ Error general al guardar marcas:', error)
      alert('Error al guardar las faltas')
    }
  }

  function handleDelete() {
    alert('Selecciona una inasistencia para eliminar')
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
          onSave={handleSaveMarks}
          onDelete={handleDelete}
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
