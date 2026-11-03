import React from 'react'
import { FaSun, FaCloudSun, FaMoon } from 'react-icons/fa'

export interface TurnoListProps {
  /** Conteo por turno: claves 'Mañana', 'Tarde' y 'Noche'. */
  data: Record<string, number>
}

export default function TurnoList({ data }: TurnoListProps) {
  const turnos = [
    {
      nombre: 'Mañana',
      icon: <FaSun />,
      color: '#4a6cf7',
      cantidad: data['Mañana'] || 0,
      descripcion: 'Incidencias registradas'
    },
    {
      nombre: 'Tarde',
      icon: <FaCloudSun />,
      color: '#8a4af3',
      cantidad: data['Tarde'] || 0,
      descripcion: 'Incidencias registradas'
    },
    {
      nombre: 'Noche',
      icon: <FaMoon />,
      color: '#4caf50',
      cantidad: data['Noche'] || 0,
      descripcion: 'Incidencias registradas'
    }
  ]

  const total = Object.values(data).reduce((a, b) => a + b, 0)

  return (
    <div className="rounded-[16px] border border-line bg-transparent! p-6 shadow-[0_4px_20px_var(--shadow)] [backdrop-filter:blur(10px)]">
      <div className="mb-6">
        <div>
          <h3 className="mb-1 text-[18px] font-semibold text-content! dark:text-[#f8fafc]!">Incidencias por Turno</h3>
          <p className="flex items-center gap-1.5 text-[12px] text-content-2">
            <span className="font-semibold text-success">+30%</span> este mes
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {turnos.map((turno, index) => {
          const porcentaje = total > 0 ? Math.round((turno.cantidad / total) * 100) : 0

          return (
            <div key={index} className="flex items-center gap-4 rounded-[12px] border border-line bg-card p-4 [backdrop-filter:blur(5px)] [transition:all_0.3s_ease] hover:bg-card-hover hover:[transform:translateX(4px)]">
              <div className="flex size-[50px] items-center justify-center rounded-[12px] bg-[rgba(30,58,138,0.1)]" style={{ backgroundColor: `${turno.color}20` }}>
                <div className="text-[22px] text-primary" style={{ color: turno.color }}>
                  {turno.icon}
                </div>
              </div>

              <div className="flex flex-1 items-center justify-between">
                <div className="flex-1">
                  <h4 className="m-0 mb-1 text-[15px] font-semibold text-content! dark:text-[#f8fafc]!">{turno.nombre}</h4>
                  <p className="m-0 text-[12px] text-content-2! dark:text-[#e2e8f0]!">{turno.descripcion}</p>
                </div>

                <div className="text-right">
                  <h3 className="m-0 text-[24px] font-bold text-content! dark:text-[#f8fafc]!">{turno.cantidad}</h3>
                  <span className="text-[12px] font-medium text-content-2! dark:text-[#e2e8f0]!">{porcentaje}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
