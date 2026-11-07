import { useEffect, useState } from 'react'

/** Fecha y hora actuales; se actualiza cada `intervalMs` (por defecto, cada 30 segundos). */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}
