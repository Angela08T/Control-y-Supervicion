import React from 'react'
import { cn } from '@/utils/classes'

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

const tones: Record<BadgeTone, { box: string; dot: string }> = {
  neutral: { box: 'bg-subtle text-content-2', dot: 'bg-[#94a3b8]' },
  info: { box: 'bg-[rgba(30,58,138,0.08)] text-primary', dot: 'bg-secondary' },
  success: { box: 'bg-[rgba(16,185,129,0.12)] text-[#047857]', dot: 'bg-success' },
  warning: { box: 'bg-[rgba(245,158,11,0.14)] text-[#b45309]', dot: 'bg-warning' },
  danger: { box: 'bg-[rgba(239,68,68,0.10)] text-[#b91c1c]', dot: 'bg-danger' },
}

export interface BadgeProps {
  tone?: BadgeTone
  /** Punto de color a la izquierda */
  dot?: boolean
  className?: string
  children: React.ReactNode
}

/** Etiqueta pequena para estados y categorias. Informa con texto + color, nunca solo color. */
export default function Badge({ tone = 'neutral', dot = true, className, children }: BadgeProps) {
  const t = tones[tone]
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', t.box, className)}>
      {dot && <span className={cn('size-1.5 rounded-full', t.dot)} aria-hidden />}
      {children}
    </span>
  )
}

const processMap: Record<string, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Borrador', tone: 'neutral' },
  pending: { label: 'Pendiente', tone: 'warning' },
  approved: { label: 'Aprobado', tone: 'success' },
  rejected: { label: 'Rechazado', tone: 'danger' },
}

/** Estado de un informe: draft | pending | approved | rejected (mayusculas o minusculas, null = borrador). */
export function StatusBadge({ status, disabled = false }: { status?: string | null; disabled?: boolean }) {
  if (disabled) return <Badge tone="danger">Deshabilitado</Badge>
  const entry = processMap[(status || 'draft').toLowerCase()] || processMap.draft
  return <Badge tone={entry.tone}>{entry.label}</Badge>
}
