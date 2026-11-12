import type { Incidencia } from '@/types'

/** Formatos compartidos por la bandeja de incidencias y su detalle */

export const DASH = '—'

const TURNOS: Record<string, string> = {
  M: 'Mañana',
  T: 'Tarde',
  N: 'Noche',
  MAÑANA: 'Mañana',
  TARDE: 'Tarde',
  NOCHE: 'Noche',
}

/** Turno en sentence case para mostrar (los datos pueden venir en mayusculas o como inicial). */
export function formatTurno(turno?: string | null): string {
  const v = (turno ?? '').trim()
  if (!v) return DASH
  return TURNOS[v.toUpperCase()] ?? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
}

/** Texto o guion si esta vacio. */
export function text(value?: string | null): string {
  return value && value.trim() ? value : DASH
}

/** Fecha dd/mm/aaaa desde un ISO. */
export function fmtDate(iso?: string | null): string {
  if (!iso) return DASH
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return DASH
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Fecha y hora desde un ISO. */
export function fmtDateTime(iso?: string | null): string {
  if (!iso) return DASH
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return DASH
  return `${fmtDate(iso)} a las ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
}

/** Rango de una inasistencia: "dd/mm/aaaa - dd/mm/aaaa" */
export function formatAbsenceDates(item: Incidencia): string {
  if (!item.absenceStart || !item.absenceEnd) return DASH
  return `${fmtDate(item.absenceStart)} - ${fmtDate(item.absenceEnd)}`
}

/** Texto del medio: bodycam asignada o tipo de medio */
export function medioLabel(item: Incidencia): string {
  if (item.isAbsenceReport) return 'Reporte'
  if (item.bodycamNumber) return `Bodycam ${item.bodycamNumber}`
  return item.medio || DASH
}

/** Dos iniciales del nombre (o del DNI si no hay nombre) */
export function iniciales(nombre?: string | null, dni?: string | null): string {
  const partes = (nombre ?? '').trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase()
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (dni ?? '').slice(-2) || '?'
}

const AVATAR = ['#1e3a8a', '#0e7490', '#7c3aed', '#c2410c', '#be185d', '#15803d', '#2563eb', '#a16207']

/** Color fijo por persona (segun su DNI o nombre), para reconocerla en la lista */
export function colorAvatar(clave?: string | null): string {
  const s = clave ?? ''
  // FNV-1a con mezcla final: DNIs casi iguales caen en colores distintos
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  h ^= h >>> 15
  h = Math.imul(h, 0x2c1b3c6d)
  h ^= h >>> 12
  return AVATAR[(h >>> 0) % AVATAR.length]
}
