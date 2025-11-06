import React from 'react'
import { FaCalendarDay } from 'react-icons/fa'

export default function DateCard() {
  const obtenerFechaFormateada = () => {
    const fecha = new Date()
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    const diaSemana = diasSemana[fecha.getDay()]
    const dia = fecha.getDate()
    const mes = meses[fecha.getMonth()]
    const año = fecha.getFullYear()

    return {
      diaSemana,
      fecha: `${dia} de ${mes} del ${año}`
    }
  }

  const { diaSemana, fecha } = obtenerFechaFormateada()

  return (
    <div className="date-card">
      <div className="date-card-content">
        <div className="date-icon-container">
          <FaCalendarDay />
        </div>
        <div className="date-info">
          <p className="date-day">{diaSemana}</p>
          <p className="date-full">{fecha}</p>
        </div>
      </div>
    </div>
  )
}
