import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/classes'

export interface PopoverProps {
  /** Elemento que abre el panel; el panel se alinea a el */
  anchorRef: React.RefObject<HTMLElement | null>
  open: boolean
  onClose: () => void
  /** 'anchor' = mismo ancho que el disparador; un numero = ancho minimo en px */
  width?: 'anchor' | number
  /** Alto maximo deseado; si no cabe debajo se abre hacia arriba */
  maxHeight?: number
  className?: string
  children: React.ReactNode
  /** Teclas dentro del panel (Escape ya cierra) */
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
  role?: string
  id?: string
}

interface Pos {
  top: number
  left: number
  width: number
  maxHeight: number
  up: boolean
}

const GAP = 6
const MARGIN = 12

/**
 * Panel flotante (lista desplegable, calendario). Se dibuja en <body> con posicion fija para
 * que el scroll del modal no lo recorte; sigue al disparador al desplazar o redimensionar.
 */
export default function Popover({
  anchorRef,
  open,
  onClose,
  width = 'anchor',
  maxHeight = 320,
  className,
  children,
  onKeyDown,
  role,
  id,
}: PopoverProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState<Pos | null>(null)

  const place = useCallback(() => {
    const a = anchorRef.current
    if (!a) return
    const r = a.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const w = Math.min(width === 'anchor' ? r.width : Math.max(width, r.width), vw - MARGIN * 2)
    const below = vh - r.bottom - GAP - MARGIN
    const above = r.top - GAP - MARGIN
    const up = below < Math.min(maxHeight, 220) && above > below
    const left = Math.min(Math.max(MARGIN, r.left), vw - w - MARGIN)
    setPos({
      top: up ? r.top - GAP : r.bottom + GAP,
      left,
      width: w,
      maxHeight: Math.max(160, Math.min(maxHeight, up ? above : below)),
      up,
    })
  }, [anchorRef, width, maxHeight])

  useLayoutEffect(() => {
    if (!open) return
    place()
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onMove = () => place()
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return
      onClose()
    }
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    document.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open, place, onClose, anchorRef])

  if (!open || !pos) return null

  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role={role}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          // Solo cierra el panel, no el modal que lo contiene
          e.stopPropagation()
          e.nativeEvent.stopImmediatePropagation()
          onClose()
          anchorRef.current?.focus()
          return
        }
        onKeyDown?.(e)
      }}
      style={{
        position: 'fixed',
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxHeight,
        ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }),
      }}
      className={cn(
        'z-[2100] flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[0_18px_40px_-12px_rgba(12,26,75,0.35),0_2px_6px_rgba(12,26,75,0.08)] dark:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)]',
        pos.up ? 'origin-bottom' : 'origin-top',
        'animate-[popIn_0.14s_ease-out]',
        className
      )}
    >
      {children}
    </div>,
    document.body
  )
}
