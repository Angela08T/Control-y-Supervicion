import React, { useState, useEffect } from 'react'
import { FaCircle } from 'react-icons/fa'
import api from '../../../api/config'
import type { User } from '@/types'
import { cn } from '../../../utils/classes'

/** Fila de la tabla de personal. */
interface PersonalRow {
  nombre: string
  rol: string
  turno: string
  activo: boolean
  avatar: string
  dni: string | null
}

/** Usuario de GET /user con los campos que usa la tabla y que no estan en `User`. */
interface PersonalApiUser extends User {
  shift?: string
  status?: string | boolean
}

/** Cuerpo de GET /user: la lista viene en `data` o en `data.data` (paginada). */
interface PersonalListBody {
  data?: PersonalApiUser[] | { data?: PersonalApiUser[] }
}

export default function PersonalTable() {
  const [personal, setPersonal] = useState<PersonalRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPersonal()
  }, [])

  const fetchPersonal = async () => {
    try {
      // Obtener usuarios con rol SENTINEL
      const response = await api.get<PersonalListBody>('/user', {
        params: { rol: 'SENTINEL' }
      })

      // Extraer datos de la respuesta
      const payload = response.data?.data
      const usersData: PersonalApiUser[] = (Array.isArray(payload) ? payload : payload?.data) || []

      // Si no hay datos, mostrar lista vacía
      if (!usersData || usersData.length === 0) {
        setPersonal([])
        setLoading(false)
        return
      }

      // Transformar datos de la API al formato de la tabla
      const personalData: PersonalRow[] = usersData.map(user => {
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
      <div className="rounded-[16px] border border-line bg-transparent! p-6 shadow-[0_4px_20px_var(--shadow)] [backdrop-filter:blur(10px)]">
        <div className="mb-5 flex items-start justify-between">
          <h3 className="mb-1 text-[18px] font-semibold text-content! dark:text-[#f8fafc]!">Centinelas</h3>
        </div>
        <div className="p-10 text-center text-muted">
          Cargando personal...
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-line bg-transparent! p-6 shadow-[0_4px_20px_var(--shadow)] [backdrop-filter:blur(10px)]">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="mb-1 text-[18px] font-semibold text-content! dark:text-[#f8fafc]!">Centinelas</h3>
          <p className="flex items-center gap-1.5 text-[12px] text-content-2">
            <FaCircle className="size-2 text-success" />
            {personal.filter(p => p.activo).length} en turno
          </p>
        </div>
        <button className="cursor-pointer border-none bg-transparent p-0 text-[20px] text-content-2">⋮</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-[rgba(30,58,138,0.1)] p-3 text-left text-[12px] font-semibold uppercase text-content! border-b border-line dark:bg-[rgba(59,130,246,0.2)] dark:text-[#f8fafc]!">#</th>
              <th className="bg-[rgba(30,58,138,0.1)] p-3 text-left text-[12px] font-semibold uppercase text-content! border-b border-line dark:bg-[rgba(59,130,246,0.2)] dark:text-[#f8fafc]!">Personal</th>
              <th className="bg-[rgba(30,58,138,0.1)] p-3 text-left text-[12px] font-semibold uppercase text-content! border-b border-line dark:bg-[rgba(59,130,246,0.2)] dark:text-[#f8fafc]!">Rol</th>
              <th className="bg-[rgba(30,58,138,0.1)] p-3 text-left text-[12px] font-semibold uppercase text-content! border-b border-line dark:bg-[rgba(59,130,246,0.2)] dark:text-[#f8fafc]!">Turno</th>
              <th className="bg-[rgba(30,58,138,0.1)] p-3 text-left text-[12px] font-semibold uppercase text-content! border-b border-line dark:bg-[rgba(59,130,246,0.2)] dark:text-[#f8fafc]!">Estado</th>
            </tr>
          </thead>
          <tbody>
            {personal.length === 0 && (
              <tr>
                <td colSpan={5} className="p-5 text-center text-[14px] text-content! dark:text-[#f8fafc]!">
                  No hay personal registrado
                </td>
              </tr>
            )}
            {personal.map((persona, index) => {
              const esSuTurno = persona.turno === enTurno
              const estado = esSuTurno ? 'En turno' : 'Fuera de turno'

              return (
                <tr key={index} className="border-b border-line [transition:background_0.2s_ease] hover:bg-[rgba(30,58,138,0.05)]">
                  <td className="w-[40px] px-3 py-4 text-center text-[14px] font-bold text-content! dark:text-[#f8fafc]!">
                    {index + 1}
                  </td>
                  <td className="px-3 py-4 text-[14px] text-content! dark:text-[#f8fafc]!">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-[8px] bg-[linear-gradient(135deg,var(--primary),var(--secondary))] text-[12px] font-semibold text-white">{persona.avatar}</div>
                      <span>{persona.nombre}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-[14px] text-content! dark:text-[#f8fafc]!">
                    <span className="rounded-[6px] bg-[rgba(126,34,206,0.1)] px-3 py-1 text-[12px] font-semibold text-[#7e22ce] dark:bg-[rgba(192,132,252,0.2)] dark:text-[#c084fc]!">{persona.rol}</span>
                  </td>
                  <td className="px-3 py-4 text-[14px] text-content! dark:text-[#f8fafc]!">
                    <span className="rounded-[6px] bg-[rgba(30,58,138,0.1)] px-3 py-1 text-[12px] font-medium text-primary dark:bg-[rgba(59,130,246,0.2)] dark:text-[#60a5fa]!">{persona.turno}</span>
                  </td>
                  <td className="px-3 py-4 text-[14px] text-content! dark:text-[#f8fafc]!">
                    <span className={cn('flex items-center gap-1.5 text-[13px]', esSuTurno ? 'text-success' : 'text-content-2')}>
                      <FaCircle className="text-[8px]" />
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
