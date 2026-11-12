import React from 'react'
import { cn } from '@/utils/classes'
import loboImage from '@/assets/lobo.png'

export interface BrandMarkProps {
  /** Solo la ficha del lobo (menu contraido) */
  compact?: boolean
  /** `dark` = sobre fondo azul (texto blanco); `light` = sobre fondo claro */
  tone?: 'dark' | 'light'
  className?: string
}

/** Marca de Sentinel: el lobo (la mascota) en una ficha clara + el nombre del sistema. */
export default function BrandMark({ compact = false, tone = 'light', className }: BrandMarkProps) {
  const dark = tone === 'dark'
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg bg-white',
          dark ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.2)]' : 'shadow-[0_0_0_1px_var(--border)]'
        )}
      >
        <img src={loboImage} alt="Lobo Centinela" className="size-[28px] object-contain" />
      </span>
      {!compact && (
        <span className="min-w-0 leading-none">
          <span className={cn('block truncate text-[17px] font-semibold tracking-[-0.01em]', dark ? 'text-white' : 'text-primary dark:text-accent-light')}>
            Centinela
          </span>
          <span className={cn('mt-1 block truncate text-[11px] font-medium', dark ? 'text-white/65' : 'text-muted')}>
            CECOM · SJL
          </span>
        </span>
      )}
    </div>
  )
}
