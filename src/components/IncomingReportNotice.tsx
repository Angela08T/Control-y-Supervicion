import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiBell, FiX } from 'react-icons/fi'
import { getPendingInbox } from '../api/report'
import { initSocket } from '../services/websocket'
import Button from './UI/Button'

export default function IncomingReportNotice() {
  const [unread, setUnread] = useState<string[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    let busy = false
    let queued = false
    let previous: Set<string> | undefined
    let department: string | null | undefined
    const socket = initSocket()

    async function sync() {
      if (busy) { queued = true; return }
      busy = true
      try {
        const inbox = await getPendingInbox()
        if (!active) return
        const current = new Set(inbox.ids)
        if (previous && department === inbox.department) {
          const known = previous
          const arrivals = inbox.ids.filter(id => !known.has(id))
          setUnread(old => {
            const remaining = old.filter(id => current.has(id))
            return arrivals.length || remaining.length !== old.length ? [...remaining, ...arrivals] : old
          })
        } else {
          setUnread([])
        }
        previous = current
        department = inbox.department
      } catch {
        // Conservar la última lectura hasta que la API vuelva a responder.
      } finally {
        busy = false
        if (active && queued) { queued = false; void sync() }
      }
    }

    void sync()
    socket?.on('report_status_changed', sync)
    socket?.on('report_status_validate', sync)
    socket?.on('connect', sync)
    window.addEventListener('focus', sync)
    const fallback = window.setInterval(() => { if (!socket?.connected && !busy) void sync() }, 8000)
    return () => {
      active = false
      socket?.off('report_status_changed', sync)
      socket?.off('report_status_validate', sync)
      socket?.off('connect', sync)
      window.removeEventListener('focus', sync)
      window.clearInterval(fallback)
    }
  }, [])

  const count = unread.length
  const title = count === 1 ? 'Nuevo informe para validar' : `${count} informes nuevos para validar`
  useEffect(() => {
    if (!count) return
    const original = document.title
    document.title = `(${count}) ${title} · ${original}`
    return () => { document.title = original }
  }, [count, title])

  if (!count) return null
  return <aside aria-label="Notificación de informes" className="fixed bottom-5 right-5 z-[1900] max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface p-4 shadow-xl">
    <div className="flex items-center gap-3">
      <FiBell aria-hidden className="text-primary" />
      <strong role="status" className="text-sm text-content">{title}</strong>
      <button type="button" aria-label="Descartar aviso" className="rounded p-1 text-muted" onClick={() => setUnread([])}><FiX /></button>
    </div>
    <Button size="sm" className="mt-3" onClick={() => {
      setUnread([])
      navigate('/dashboard/validator/incidencias', { state: { openPendingInbox: true } })
    }}>Ver pendientes</Button>
  </aside>
}
