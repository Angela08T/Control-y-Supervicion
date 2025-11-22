import React, { useState, useEffect } from 'react'
import { FaCircle } from 'react-icons/fa'
import api from '../../../api/config'

export default function PersonalTable() {
  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPersonal()
  }, [])

  const fetchPersonal = async () => {
    try {
      // Obtener usuarios con rol SENTINEL
      console.log('📡 PersonalTable: Obteniendo centinelas...')
      const response = await api.get('/user', {
        params: { rol: 'SENTINEL' }
      })

      console.log('✅ Centinelas obtenidos:', response.data)

      // Extraer datos de la respuesta
      const usersData = response.data?.data?.data || response.data?.data || []

      console.log('📊 Datos de usuarios extraídos:', usersData)

      // Si no hay datos, mostrar lista vacía
      if (!usersData || usersData.length === 0) {
        console.log('⚠️ No hay centinelas registrados en la API')
        setPersonal([])
        setLoading(false)
        return
      }

      // Transformar datos de la API al formato de la tabla
      const personalData = usersData.map(user => {
        // Construir nombre completo
        const nombreCompleto = `${user.name || ''} ${user.lastname || ''}`.trim() || 'Sin nombre'

        // Generar iniciales
        const initials = nombreCompleto
          .split(' ')
          .map(n => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase() || '??'

        // Mapear turno de inicial a nombre completo
        let turnoCompleto = 'No asignado'
        if (user.shift === 'M') turnoCompleto = 'Mañana'
        else if (user.shift === 'T') turnoCompleto = 'Tarde'
        else if (user.shift === 'N') turnoCompleto = 'Noche'

        return {
          nombre: nombreCompleto,
          rol: user.rol || 'Centinela',
          turno: turnoCompleto,
          activo: user.status === 'active' || user.status === true,
          avatar: initials,
          dni: user.dni
        }
      })

      setPersonal(personalData)
    } catch (error) {
      console.error('❌ Error al cargar centinelas:', error)
      console.error('❌ Error response:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)

      // No usar fallback, mostrar lista vacía para indicar que hubo un problema
      setPersonal([])
    } finally {
      setLoading(false)
    }
  }
  
  const turnoActual = () => {
    const hora = new Date().getHours()
    if (hora >= 6 && hora < 14) return 'Mañana'
    if (hora >= 14 && hora < 22) return 'Tarde'
    return 'Noche'
  }
  
  const enTurno = turnoActual()
  
  if (loading) {
    return (
      <div className="personal-table-card">
        <div className="personal-header">
          <h3 className="personal-title">Centinelas</h3>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Cargando personal...
        </div>
      </div>
    )
  }

  return (
    <div className="personal-table-card">
      <div className="personal-header">
        <div>
          <h3 className="personal-title">Centinelas</h3>
          <p className="personal-subtitle">
            <FaCircle className="status-dot active" />
            {personal.filter(p => p.activo).length} en turno
          </p>
        </div>
        <button className="personal-menu">⋮</button>
      </div>

      <div className="personal-table-container">
        <table className="personal-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Personal</th>
              <th>Rol</th>
              <th>Turno</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {personal.length === 0 && (
              <tr>
                <td colSpan={5} style={{textAlign: 'center', padding: '20px', color: 'var(--text-muted)'}}>
                  No hay personal registrado
                </td>
              </tr>
            )}
            {personal.map((persona, index) => {
              const esSuTurno = persona.turno === enTurno
              const estado = esSuTurno ? 'En turno' : 'Fuera de turno'
              
              return (
                <tr key={index}>
                  <td style={{textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)', width: '40px'}}>
                    {index + 1}
                  </td>
                  <td>
                    <div className="personal-info">
                      <div className="personal-avatar">{persona.avatar}</div>
                      <span>{persona.nombre}</span>
                    </div>
                  </td>
                  <td>
                    <span className="personal-rol">{persona.rol}</span>
                  </td>
                  <td>
                    <span className="personal-turno">{persona.turno}</span>
                  </td>
                  <td>
                    <span className={`personal-status ${esSuTurno ? 'active' : 'inactive'}`}>
                      <FaCircle className="status-icon" />
                      {estado}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}