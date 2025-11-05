import React, { useState, useEffect } from 'react'
import { FaCircle } from 'react-icons/fa'
import { getAllOffenders } from '../../../api/statistics'

export default function PersonalTable() {
  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPersonal()
  }, [])

  const fetchPersonal = async () => {
    try {
      const response = await getAllOffenders()

      // Transformar datos de la API al formato de la tabla
      const personalData = (response.data || []).map(offender => {
        const initials = offender.name
          ? offender.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
          : '??'

        return {
          nombre: offender.name || 'Sin nombre',
          turno: offender.shift || 'No asignado',
          activo: offender.status === 'active',
          avatar: initials,
          dni: offender.dni
        }
      })

      setPersonal(personalData)
    } catch (error) {
      console.warn('No se pudo cargar el personal desde la API, usando datos de ejemplo:', error)
      // Fallback a datos de ejemplo si la API falla
      setPersonal([
        { nombre: 'Carmen Rodríguez', turno: 'Noche', activo: true, avatar: 'CR' },
        { nombre: 'José Martinez', turno: 'Mañana', activo: false, avatar: 'JM' },
        { nombre: 'Ana Torres', turno: 'Tarde', activo: true, avatar: 'AT' },
        { nombre: 'Carlos Vega', turno: 'Noche', activo: true, avatar: 'CV' },
        { nombre: 'María Sánchez', turno: 'Mañana', activo: false, avatar: 'MS' }
      ])
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
              <th>Turno</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {personal.length === 0 && (
              <tr>
                <td colSpan={4} style={{textAlign: 'center', padding: '20px', color: 'var(--text-muted)'}}>
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