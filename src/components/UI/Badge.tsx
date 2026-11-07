import React from 'react'
import { cn } from '@/utils/classes'

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent'

const tones: Record<BadgeTone, { box: string; dot: string }> = {
  neutral: { box: 'bg-subtle text-content-2', dot: 'bg-[#94a3b8]' },
  info: { box: 'bg-[rgba(49,163,181,0.14)] text-cyan-ink', dot: 'bg-brand-cyan' },
  success: { box: 'bg-[rgba(142,188,34,0.2)] text-lime-ink', dot: 'bg-brand-lime' },
  warning: { box: 'bg-[rgba(242,165,15,0.2)] text-amber-ink', dot: 'bg-brand-amber' },
  danger: { box: 'bg-[rgba(199,21,34,0.1)] text-brand-red', dot: 'bg-brand-red' },
  accent: { box: 'bg-[rgba(210,11,128,0.1)] text-brand-pink', dot: 'bg-brand-pink' },
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
