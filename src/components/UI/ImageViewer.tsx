import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiChevronLeft, FiChevronRight, FiDownload, FiMaximize, FiMinus, FiPlus, FiX } from 'react-icons/fi'
import { cn } from '@/utils/classes'

export interface ImageViewerItem {
  src: string
  /** Titulo corto (p. ej. "Anexo 2") */
  title?: string
  /** Descripcion que se muestra al pie */
  caption?: string
  /** Nombre del archivo al descargar */
  fileName?: string
}

interface ImageViewerProps {
  images: ImageViewerItem[]
  /** Imagen con la que se abre */
  startIndex?: number
  onClose: () => void
}

const MIN_ZOOM = 1
const MAX_ZOOM = 5

/** Boton redondo de la barra del visor */
const toolBtn =
  'inline-flex size-10 cursor-pointer items-center justify-center rounded-full border-none bg-white/10 text-lg text-white transition-colors duration-150 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white/10'

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/**
 * Visor de imagenes a pantalla completa: zoom (clic, rueda, botones, teclas + / -), arrastre
 * cuando hay zoom, navegacion entre imagenes (flechas, teclado, miniaturas) y descarga.
 * Se monta en <body> por encima de cualquier modal; Escape cierra solo el visor.
 */
export default function ImageViewer({ images, startIndex = 0, onClose }: ImageViewerProps) {
  const [index, setIndex] = useState(clamp(startIndex, 0, Math.max(0, images.length - 1)))
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const thumbsRef = useRef<HTMLDivElement>(null)

  const total = images.length
  const actual = images[index]

  const resetView = useCallback(() => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  const goTo = useCallback(
    (i: number) => {
      if (total === 0) return
      setIndex((i + total) % total)
      resetView()
    },
    [total, resetView]
  )

  const zoomBy = useCallback((factor: number) => {
    setZoom((z) => {
      const nz = clamp(Math.round(z * factor * 100) / 100, MIN_ZOOM, MAX_ZOOM)
      if (nz === 1) setOffset({ x: 0, y: 0 })
      return nz
    })
  }, [])

  // Teclado: en fase de captura para que Escape no cierre tambien el modal que hay debajo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key
      if (k === 'Escape') onClose()
      else if (k === 'ArrowRight') goTo(index + 1)
      else if (k === 'ArrowLeft') goTo(index - 1)
      else if (k === '+' || k === '=') zoomBy(1.25)
      else if (k === '-') zoomBy(0.8)
      else if (k === '0') resetView()
      else return
      e.preventDefault()
      e.stopPropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [index, goTo, zoomBy, resetView, onClose])

  // Foco al abrir y devolverlo al cerrar
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => previo?.focus?.()
  }, [])

  // La miniatura activa siempre a la vista
  useEffect(() => {
    thumbsRef.current
      ?.querySelector<HTMLElement>(`[data-i="${index}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [index])

  if (!actual) return null

  const onWheel = (e: React.WheelEvent) => zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15)

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    setDragging(true)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    setOffset({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) })
  }
  const endDrag = () => {
    drag.current = null
    setDragging(false)
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Visor de imágenes: ${actual.title ?? `imagen ${index + 1}`}`}
      className="fixed inset-0 z-[3000] flex flex-col bg-slate-950/95 text-white animate-[fadeInSoft_0.15s_ease-out]"
    >
      {/* Barra superior */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 max-sm:px-3">
        <div className="min-w-0">
          <p className="m-0 truncate text-[15px] font-semibold">{actual.title ?? `Imagen ${index + 1}`}</p>
          {total > 1 && (
            <p className="m-0 text-xs text-white/60 tabular-nums">
              {index + 1} de {total}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-full bg-white/5 p-1 max-sm:hidden">
            <button type="button" className={toolBtn} onClick={() => zoomBy(0.8)} disabled={zoom <= MIN_ZOOM} aria-label="Alejar" title="Alejar (−)">
              <FiMinus aria-hidden />
            </button>
            <button
              type="button"
              onClick={resetView}
              className="h-10 min-w-14 cursor-pointer rounded-full border-none bg-transparent px-2 text-[13px] font-semibold text-white tabular-nums hover:bg-white/10"
              title="Ajustar a la pantalla (0)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" className={toolBtn} onClick={() => zoomBy(1.25)} disabled={zoom >= MAX_ZOOM} aria-label="Acercar" title="Acercar (+)">
              <FiPlus aria-hidden />
            </button>
          </div>
          <button type="button" className={cn(toolBtn, 'max-sm:hidden')} onClick={resetView} disabled={zoom === 1} aria-label="Ajustar a la pantalla" title="Ajustar a la pantalla (0)">
            <FiMaximize aria-hidden />
          </button>
          <a
            href={actual.src}
            download={actual.fileName || `${actual.title ?? 'imagen'}.jpg`}
            target="_blank"
            rel="noreferrer"
            className={cn(toolBtn, 'no-underline')}
            aria-label="Descargar imagen"
            title="Descargar"
          >
            <FiDownload aria-hidden />
          </a>
          <button ref={closeRef} type="button" className={cn(toolBtn, 'bg-white/15')} onClick={onClose} aria-label="Cerrar visor" title="Cerrar (Esc)">
            <FiX aria-hidden />
          </button>
        </div>
      </div>

      {/* Imagen: clic en ella acerca; clic fuera de ella (sin zoom) cierra */}
      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        onWheel={onWheel}
        onClick={(e) => {
          if (e.target === e.currentTarget && zoom === 1) onClose()
        }}
      >
        <img
          key={actual.src}
          src={actual.src}
          alt={actual.caption || actual.title || `Imagen ${index + 1}`}
          draggable={false}
          onClick={() => zoom === 1 && setZoom(2.5)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={cn(
            'absolute inset-0 m-auto max-h-[calc(100%-24px)] max-w-[calc(100%-120px)] touch-none object-contain select-none animate-[fadeInSoft_0.2s_ease-out] max-sm:max-w-[calc(100%-16px)]',
            zoom > 1 ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in',
            !dragging && 'transition-transform duration-150 ease-out'
          )}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
        />

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Imagen anterior"
              className={cn(toolBtn, 'absolute top-1/2 left-4 size-12 -translate-y-1/2 bg-black/40 text-2xl backdrop-blur-sm hover:bg-black/60 max-sm:left-2')}
            >
              <FiChevronLeft aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Imagen siguiente"
              className={cn(toolBtn, 'absolute top-1/2 right-4 size-12 -translate-y-1/2 bg-black/40 text-2xl backdrop-blur-sm hover:bg-black/60 max-sm:right-2')}
            >
              <FiChevronRight aria-hidden />
            </button>
          </>
        )}
      </div>

      {/* Pie: descripcion y miniaturas */}
      <div className="shrink-0 px-4 pt-2 pb-4 max-sm:px-3">
        {actual.caption && <p className="m-0 mx-auto mb-3 max-w-3xl text-center text-sm leading-relaxed text-white/85">{actual.caption}</p>}
        {total > 1 && (
          <div ref={thumbsRef} className="mx-auto flex max-w-full justify-center-safe gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                data-i={i}
                onClick={() => goTo(i)}
                aria-label={`Ver ${img.title ?? `imagen ${i + 1}`}`}
                aria-current={i === index ? 'true' : undefined}
                className={cn(
                  'relative h-14 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 bg-white/5 p-0 transition-[border-color,opacity] duration-150',
                  i === index ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-90'
                )}
              >
                <img src={img.src} alt="" className="size-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        )}
        <p className="m-0 mt-2 text-center text-[11px] text-white/40 max-sm:hidden">
          Clic o rueda para acercar · arrastra para moverte · 0 para ajustar · ← → para cambiar · Esc para cerrar
        </p>
      </div>
    </div>,
    document.body
  )
}
