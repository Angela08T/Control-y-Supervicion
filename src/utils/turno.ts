export interface TurnoInfo {
  nombre: 'Mañana' | 'Tarde' | 'Noche'
  /** Horario del turno, ej. "22:00 – 06:00" */
  rango: string
  /** Avance del turno entre 0 y 1 */
  progreso: number
  /** Minutos que faltan para que termine */
  minutosRestantes: number
}

const DURACION_MIN = 8 * 60

/** Turno que corresponde a una hora (mismos rangos que la tabla de centinelas). */
export function getTurno(date: Date = new Date()): TurnoInfo {
  const hora = date.getHours()
  const minutoDelDia = hora * 60 + date.getMinutes()
  const avance = (inicio: number) => {
    const transcurrido = (minutoDelDia - inicio * 60 + 24 * 60) % (24 * 60)
    return { progreso: transcurrido / DURACION_MIN, minutosRestantes: DURACION_MIN - transcurrido }
  }
  if (hora >= 6 && hora < 14) return { nombre: 'Mañana', rango: '06:00 – 14:00', ...avance(6) }
  if (hora >= 14 && hora < 22) return { nombre: 'Tarde', rango: '14:00 – 22:00', ...avance(14) }
  return { nombre: 'Noche', rango: '22:00 – 06:00', ...avance(22) }
}

/** "3 h 20 min", "45 min" */
export function formatearRestante(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = Math.round(minutos % 60)
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}
