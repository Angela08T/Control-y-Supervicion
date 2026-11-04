import React, { useState, useEffect } from 'react'
import api from '../../../api/config'
import type { User } from '@/types'
import Badge from '@/components/UI/Badge'
import { EmptyState, LoadingState } from '@/components/UI/EmptyState'
import { cardClass, incTable, incTableTh, incTableTr, incTableTd } from '@/utils/classes'

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

  return (
    <div className={cardClass}>
      <div className="flex flex-col gap-0.5 border-b border-line px-5 py-4">
        <h3 className="m-0 text-[15px] font-semibold text-content">Centinelas</h3>
        {!loading && <p className="m-0 text-xs text-muted">{personal.filter(p => p.activo).length} en turno</p>}
      </div>

      {loading ? (
        <LoadingState label="Cargando personal…" />
      ) : personal.length === 0 ? (
        <EmptyState title="No hay personal registrado" />
      ) : (
        <div className="overflow-x-auto">
          <table className={incTable}>
            <thead>
              <tr>
                <th className={incTableTh}>Personal</th>
                <th className={incTableTh}>Rol</th>
                <th className={incTableTh}>Turno</th>
                <th className={incTableTh}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {personal.map((persona, index) => {
                const esSuTurno = persona.turno === enTurno

                return (
                  <tr key={index} className={incTableTr}>
                    <td className={incTableTd}>
                      <span className="font-medium text-content">{persona.nombre}</span>
                    </td>
                    <td className={incTableTd}>
                      <Badge tone="neutral" dot={false}>{persona.rol}</Badge>
                    </td>
                    <td className={incTableTd}>
                      <Badge tone="info" dot={false}>{persona.turno}</Badge>
                    </td>
                    <td className={incTableTd}>
                      {esSuTurno ? <Badge tone="success">En turno</Badge> : <Badge tone="neutral">Fuera de turno</Badge>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
