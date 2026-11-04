import React from 'react'

/** Fecha de hoy en español, en una línea (ej. "miércoles, 4 de noviembre de 2026"). */
export default function DateCard() {
  const fecha = new Date()
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]

  const texto = `${diasSemana[fecha.getDay()]}, ${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`

  return <p className="m-0 text-sm text-muted">{texto}</p>
}
