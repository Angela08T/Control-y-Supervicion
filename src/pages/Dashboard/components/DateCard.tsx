import React from 'react'
import { FaCalendarDay } from 'react-icons/fa'

export default function DateCard() {
  const obtenerFechaFormateada = (): { diaSemana: string; fecha: string } => {
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
    <div className="rounded-[16px] border border-[rgba(255,255,255,0.2)] bg-[linear-gradient(135deg,#0c4a6e_0%,#075985_50%,#0369a1_100%)] px-6 py-7 shadow-[0_4px_20px_rgba(7,89,133,0.3)] [backdrop-filter:blur(10px)] [transition:transform_0.3s_ease,box-shadow_0.3s_ease]! flex items-center hover:[transform:translateY(-4px)] hover:shadow-[0_8px_30px_rgba(7,89,133,0.4)] dark:bg-[linear-gradient(135deg,#1e40af_0%,#2563eb_50%,#3b82f6_100%)] dark:shadow-[0_4px_20px_rgba(37,99,235,0.4)] dark:hover:shadow-[0_8px_30px_rgba(37,99,235,0.5)]">
      <div className="flex w-full items-center gap-5">
        <div className="flex size-15 items-center justify-center rounded-[12px] bg-[rgba(255,255,255,0.2)] text-[28px] text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] [backdrop-filter:blur(10px)]">
          <FaCalendarDay />
        </div>
        <div className="flex-1">
          <p className="m-0 mb-1 text-[26px] font-extrabold uppercase tracking-[0.5px] text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.2)]">{diaSemana}</p>
          <p className="m-0 text-[16px] font-semibold text-[rgba(255,255,255,0.95)] [text-shadow:0_1px_3px_rgba(0,0,0,0.2)]">{fecha}</p>
        </div>
      </div>
    </div>
  )
}
