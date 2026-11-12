import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/classes'
import { colorAvatar, iniciales } from '@/utils/incidenciaFormat'

/**
 * Graficos de Estadisticas, en SVG/HTML sin librerias.
 * Reglas: marcas finas (barras <= 24px con punta redondeada de 4px), 2px de separacion entre
 * segmentos, rejilla en lineas finas solidas, texto en colores de texto (nunca el color de la serie),
 * leyenda siempre que hay 2 o mas series y detalle al pasar el mouse o con el teclado.
 */

// ==================== Detalle flotante ====================

export interface TipState {
  x: number
  y: number
  /** Ancho del contenedor al abrir el detalle (para voltearlo cerca del borde derecho) */
  w: number
  content: React.ReactNode
}

/** Detalle que sigue al puntero dentro de un contenedor `relative` */
export function useTooltip() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [tip, setTip] = useState<TipState | null>(null)

  const show = useCallback((e: React.MouseEvent | React.FocusEvent, content: React.ReactNode) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box) return
    let x: number
    let y: number
    if ('clientX' in e) {
      x = e.clientX - box.left
      y = e.clientY - box.top
    } else {
      // Con teclado: sobre el centro del elemento enfocado
      const r = (e.currentTarget as Element).getBoundingClientRect()
      x = r.left + r.width / 2 - box.left
      y = r.top - box.top
    }
    setTip({ x, y, w: box.width, content })
  }, [])
  const hide = useCallback(() => setTip(null), [])

  return { ref, tip, show, hide }
}

export function ChartTooltip({ tip }: { tip: TipState | null }) {
  if (!tip) return null
  const w = tip.w
  // Se voltea hacia la izquierda cerca del borde derecho
  const izquierda = tip.x > w - 230
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-30 max-w-[240px] rounded-xl border border-line bg-surface px-3 py-2 text-xs text-content shadow-[0_14px_32px_-12px_rgba(12,26,75,0.45)] dark:shadow-[0_14px_32px_-12px_rgba(0,0,0,0.8)]"
      style={{
        left: izquierda ? undefined : tip.x + 14,
        right: izquierda ? w - tip.x + 14 : undefined,
        top: Math.max(0, tip.y - 12),
      }}
    >
      {tip.content}
    </div>
  )
}

/** Fila del detalle: muestra de color, etiqueta y valor */
export function TipRow({ color, label, value }: { color?: string; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      {color && <span className="size-2.5 shrink-0 rounded-sm" style={{ background: color }} aria-hidden />}
      <span className="flex-1 text-content-2">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  )
}

// ==================== Leyenda ====================

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-content-2" aria-label="Leyenda">
      {items.map(i => (
        <li key={i.label} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: i.color }} aria-hidden />
          {i.label}
        </li>
      ))}
    </ul>
  )
}

/** Ancho disponible de un contenedor (para los graficos SVG) */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

const pct = (n: number, t: number) => (t > 0 ? Math.round((n / t) * 100) : 0)

// ==================== Barras horizontales apiladas por persona ====================

export interface StackSegment {
  key: string
  label: string
  value: number
  color: string
}

export interface StackRow {
  id: string
  name: string
  sub?: string
  segments: StackSegment[]
}

/**
 * Una barra por persona, ordenada de mayor a menor. Cada barra se divide por estado
 * (2px de separacion); el total va al final de la barra.
 */
export function StackedBarList({ rows, max }: { rows: StackRow[]; max: number }) {
  const { ref, tip, show, hide } = useTooltip()
  return (
    <div ref={ref} className="relative">
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {rows.map(r => {
          const total = r.segments.reduce((s, x) => s + x.value, 0)
          const detalle = (
            <>
              <p className="m-0 mb-1 font-semibold">{r.name}</p>
              {r.segments.map(s => (
                <TipRow key={s.key} color={s.color} label={s.label} value={`${s.value} · ${pct(s.value, total)}%`} />
              ))}
              <div className="mt-1 border-t border-line pt-1">
                <TipRow label="Total" value={total} />
              </div>
            </>
          )
          return (
            <li
              key={r.id}
              tabIndex={0}
              onMouseMove={e => show(e, detalle)}
              onMouseLeave={hide}
              onFocus={e => show(e, detalle)}
              onBlur={hide}
              aria-label={`${r.name}: ${total} en total, ${r.segments.map(s => `${s.value} ${s.label.toLowerCase()}`).join(', ')}`}
              className="grid cursor-default grid-cols-[minmax(0,200px)_minmax(0,1fr)] items-center gap-3 rounded-xl px-2 py-1.5 outline-none transition-colors hover:bg-subtle focus-visible:ring-2 focus-visible:ring-accent max-sm:grid-cols-1 max-sm:gap-1.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                  style={{ background: colorAvatar(r.id) }}
                  aria-hidden
                >
                  {iniciales(r.name)}
                </span>
                <div className="min-w-0">
                  <p className="m-0 truncate text-[13px] font-semibold text-content">{r.name}</p>
                  {r.sub && <p className="m-0 truncate text-[11px] text-muted">{r.sub}</p>}
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-[18px] min-w-0 flex-1 items-center">
                  <div className="flex h-full gap-[2px]" style={{ width: `${(total / max) * 100}%`, minWidth: total ? 6 : 0 }}>
                    {r.segments
                      .filter(s => s.value > 0)
                      .map((s, i, arr) => (
                        <div
                          key={s.key}
                          className={cn('h-full', i === arr.length - 1 && 'rounded-r-[4px]')}
                          style={{ flexGrow: s.value, flexBasis: 0, background: s.color }}
                        />
                      ))}
                  </div>
                </div>
                <span className="w-9 shrink-0 text-right text-[13px] font-bold text-content tabular-nums">{total}</span>
              </div>
            </li>
          )
        })}
      </ul>
      <ChartTooltip tip={tip} />
    </div>
  )
}

// ==================== Dispersion: volumen vs aprobacion ====================

export interface ScatterPoint {
  id: string
  name: string
  x: number
  y: number
  /** Etiqueta directa junto al punto (solo los mas relevantes) */
  label?: boolean
}

/**
 * Cada punto es una persona: a la derecha mas informes, arriba mayor % aprobado.
 * Las lineas de la mediana dividen el plano en cuatro cuadrantes con nombre.
 */
export function Scatter({ points, xLabel, yLabel }: { points: ScatterPoint[]; xLabel: string; yLabel: string }) {
  const [boxRef, width] = useWidth<HTMLDivElement>()
  const { ref, tip, show, hide } = useTooltip()
  const [activo, setActivo] = useState<string | null>(null)

  const H = 300
  const M = { top: 16, right: 20, bottom: 40, left: 46 }
  const W = Math.max(280, width)
  const iw = W - M.left - M.right
  const ih = H - M.top - M.bottom

  const maxX = Math.max(1, ...points.map(p => p.x))
  const niceMax = maxX <= 5 ? 5 : Math.ceil(maxX / 5) * 5
  // Margen dentro del plano: los puntos en 0% o 100% no caen sobre las etiquetas de los cuadrantes
  const X_MIN = -niceMax * 0.04
  const X_MAX = niceMax * 1.04
  const Y_MIN = -14
  const Y_MAX = 114
  const sx = (v: number) => M.left + ((v - X_MIN) / (X_MAX - X_MIN)) * iw
  const sy = (v: number) => M.top + ih - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * ih

  const mediana = (vals: number[]) => {
    const s = [...vals].sort((a, b) => a - b)
    if (s.length === 0) return 0
    const m = Math.floor(s.length / 2)
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
  }
  const medX = mediana(points.map(p => p.x))
  const medY = mediana(points.map(p => p.y))
  const ticksX = Array.from({ length: 6 }, (_, i) => Math.round((niceMax / 5) * i))
  const ticksY = [0, 25, 50, 75, 100]

  // Punto mas cercano al puntero (objetivo amplio en vez de acertar al punto)
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - r.left
    const my = e.clientY - r.top
    let best: ScatterPoint | null = null
    let dist = Infinity
    points.forEach(p => {
      const d = Math.hypot(sx(p.x) - mx, sy(p.y) - my)
      if (d < dist) {
        dist = d
        best = p
      }
    })
    const p = best as ScatterPoint | null
    if (p && dist < 40) {
      setActivo(p.id)
      show(e, (
        <>
          <p className="m-0 mb-1 font-semibold">{p.name}</p>
          <TipRow label="Informes" value={p.x} />
          <TipRow label="Aprobados" value={`${p.y}%`} />
        </>
      ))
    } else {
      setActivo(null)
      hide()
    }
  }

  const cuadrante = 'fill-[var(--text-muted)] text-[10px] font-semibold tracking-[0.06em] uppercase'

  // ---- Etiquetas sin choques ----
  // Cajas aproximadas (ancho por caracter) de todo lo que ya ocupa espacio: etiquetas de cuadrante y puntos.
  type Caja = { x: number; y: number; w: number; h: number }
  const choca = (a: Caja, b: Caja) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  const anchoCuadrante = (t: string) => t.length * 6.9
  const cuadrantes: { text: string; x: number; y: number; anchor: 'start' | 'end' }[] = [
    { text: 'Mucho y bien', x: M.left + iw - 6, y: M.top + 12, anchor: 'end' },
    { text: 'Poco, pero bien', x: M.left + 6, y: M.top + 12, anchor: 'start' },
    { text: 'Mucho, por revisar', x: M.left + iw - 6, y: M.top + ih - 6, anchor: 'end' },
    { text: 'Poco y por revisar', x: M.left + 6, y: M.top + ih - 6, anchor: 'start' },
  ]
  const ocupadas: Caja[] = [
    ...cuadrantes.map(c => {
      const w = anchoCuadrante(c.text)
      return { x: c.anchor === 'end' ? c.x - w : c.x, y: c.y - 10, w, h: 12 }
    }),
    ...points.map(p => ({ x: sx(p.x) - 7, y: sy(p.y) - 7, w: 14, h: 14 })),
  ]
  // Para cada punto con nombre se prueba arriba, abajo, derecha e izquierda; si nada cabe, solo queda el detalle al pasar el mouse
  const etiquetas: { id: string; text: string; x: number; y: number; anchor: 'start' | 'middle' | 'end' }[] = []
  points
    .filter(p => p.label)
    .forEach(p => {
      const text = p.name.split(' ')[0]
      const w = text.length * 6.6 + 4
      const cx = sx(p.x)
      const cy = sy(p.y)
      const opciones: { x: number; y: number; anchor: 'start' | 'middle' | 'end'; caja: Caja }[] = [
        { x: cx, y: cy - 12, anchor: 'middle', caja: { x: cx - w / 2, y: cy - 22, w, h: 12 } },
        { x: cx, y: cy + 21, anchor: 'middle', caja: { x: cx - w / 2, y: cy + 11, w, h: 12 } },
        { x: cx + 11, y: cy + 4, anchor: 'start', caja: { x: cx + 11, y: cy - 6, w, h: 12 } },
        { x: cx - 11, y: cy + 4, anchor: 'end', caja: { x: cx - 11 - w, y: cy - 6, w, h: 12 } },
      ]
      // Las cajas de los puntos incluyen el propio punto: se descarta solo la suya
      const propia = ocupadas.findIndex(o => Math.abs(o.x - (cx - 7)) < 0.01 && Math.abs(o.y - (cy - 7)) < 0.01)
      const elegida = opciones.find(
        o =>
          o.caja.x >= M.left &&
          o.caja.x + o.caja.w <= M.left + iw &&
          o.caja.y >= M.top &&
          o.caja.y + o.caja.h <= M.top + ih &&
          !ocupadas.some((c, i) => i !== propia && choca(c, o.caja))
      )
      if (elegida) {
        etiquetas.push({ id: p.id, text, x: elegida.x, y: elegida.y, anchor: elegida.anchor })
        ocupadas.push(elegida.caja)
      }
    })

  /** Contorno del color de la tarjeta: el texto se lee aunque pase sobre una linea o un punto */
  const halo = { stroke: 'var(--card)', strokeWidth: 3, strokeLinejoin: 'round' as const, paintOrder: 'stroke' as const }

  return (
    <div ref={ref} className="relative">
      <div ref={boxRef} className="w-full">
        {width > 0 && (
          <svg
            width={W}
            height={H}
            role="img"
            aria-label={`Dispersión de ${points.length} personas: ${xLabel} contra ${yLabel}`}
            onMouseMove={onMove}
            onMouseLeave={() => {
              setActivo(null)
              hide()
            }}
            className="block overflow-visible"
          >
            {/* Cuadrante destacado: alto volumen y alta aprobacion */}
            <rect x={sx(medX)} y={M.top} width={Math.max(0, M.left + iw - sx(medX))} height={Math.max(0, sy(medY) - M.top)} className="fill-[var(--viz-approved)] opacity-[0.06]" />

            {/* Rejilla */}
            {ticksY.map(t => (
              <g key={`y${t}`}>
                <line x1={M.left} x2={M.left + iw} y1={sy(t)} y2={sy(t)} stroke="var(--grid-line-color)" strokeWidth={1} />
                <text x={M.left - 8} y={sy(t)} dy="0.32em" textAnchor="end" className="fill-[var(--text-muted)] text-[11px] tabular-nums">
                  {t}%
                </text>
              </g>
            ))}
            {ticksX.map(t => (
              <text key={`x${t}`} x={sx(t)} y={M.top + ih + 18} textAnchor="middle" className="fill-[var(--text-muted)] text-[11px] tabular-nums">
                {t}
              </text>
            ))}

            {/* Medianas */}
            <line x1={sx(medX)} x2={sx(medX)} y1={M.top} y2={M.top + ih} stroke="var(--border-strong)" strokeWidth={1} />
            <line x1={M.left} x2={M.left + iw} y1={sy(medY)} y2={sy(medY)} stroke="var(--border-strong)" strokeWidth={1} />

            {cuadrantes.map(c => (
              <text key={c.text} x={c.x} y={c.y} textAnchor={c.anchor} className={cuadrante} style={halo}>
                {c.text}
              </text>
            ))}

            {/* Ejes */}
            <text x={M.left + iw / 2} y={H - 4} textAnchor="middle" className="fill-[var(--text-secondary)] text-[11px] font-semibold">
              {xLabel} →
            </text>
            <text transform={`translate(12 ${M.top + ih / 2}) rotate(-90)`} textAnchor="middle" className="fill-[var(--text-secondary)] text-[11px] font-semibold">
              {yLabel} →
            </text>

            {/* Puntos: anillo de 2px del color de la superficie para separarlos cuando se tocan */}
            {points.map(p => {
              const on = activo === p.id
              return (
                <g key={p.id}>
                  <circle
                    cx={sx(p.x)}
                    cy={sy(p.y)}
                    r={on ? 8 : 6}
                    fill="var(--viz-accent)"
                    stroke="var(--card)"
                    strokeWidth={2}
                    className="transition-[r] duration-150"
                    opacity={activo && !on ? 0.45 : 1}
                  />
                </g>
              )
            })}

            {/* Nombres: despues de los puntos para quedar siempre encima */}
            {etiquetas.map(e => (
              <text
                key={`l${e.id}`}
                x={e.x}
                y={e.y}
                textAnchor={e.anchor}
                className="pointer-events-none fill-[var(--text-primary)] text-[11px] font-semibold"
                style={halo}
              >
                {e.text}
              </text>
            ))}

          </svg>
        )}
      </div>
      <ChartTooltip tip={tip} />
    </div>
  )
}

// ==================== Barras ordenadas (una sola serie) ====================

export interface RankItem {
  id: string
  label: string
  value: number
  sub?: string
  /** Detalle extra para el tooltip */
  detail?: React.ReactNode
}

/**
 * Barras horizontales de mayor a menor, un solo color. La etiqueta va arriba de la barra,
 * el valor y su % a la derecha.
 */
export function RankedBars({ items, total, color = 'var(--viz-accent)', unidad }: { items: RankItem[]; total: number; color?: string; unidad: string }) {
  const { ref, tip, show, hide } = useTooltip()
  const max = Math.max(1, ...items.map(i => i.value))
  return (
    <div ref={ref} className="relative">
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {items.map(it => {
          const detalle = (
            <>
              <p className="m-0 mb-1 font-semibold">{it.label}</p>
              <TipRow color={color} label={unidad} value={`${it.value} · ${pct(it.value, total)}%`} />
              {it.detail}
            </>
          )
          return (
            <li
              key={it.id}
              tabIndex={0}
              onMouseMove={e => show(e, detalle)}
              onMouseLeave={hide}
              onFocus={e => show(e, detalle)}
              onBlur={hide}
              aria-label={`${it.label}: ${it.value} ${unidad.toLowerCase()} (${pct(it.value, total)}%)`}
              className="flex cursor-default flex-col gap-1 rounded-lg px-1.5 py-1 outline-none transition-colors hover:bg-subtle focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-[13px] font-medium text-content" title={it.label}>
                  {it.label}
                  {it.sub && <span className="ml-1.5 text-xs font-normal text-muted">{it.sub}</span>}
                </span>
                <span className="shrink-0 text-[13px] text-content-2 tabular-nums">
                  <strong className="font-bold text-content">{it.value}</strong> · {pct(it.value, total)}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-r-full bg-subtle">
                <div className="h-full rounded-r-[4px] transition-[width] duration-500" style={{ width: `${(it.value / max) * 100}%`, background: color }} />
              </div>
            </li>
          )
        })}
      </ul>
      <ChartTooltip tip={tip} />
    </div>
  )
}

// ==================== Columnas (histograma) ====================

export interface ColumnItem {
  label: string
  value: number
  /** Resaltar (color de enfasis) o dejar en gris de contexto */
  emphasis?: boolean
}

/** Columnas verticales con su valor encima; el enfasis separa lo que importa del contexto */
export function Columns({ items, unidad, emphasisColor = 'var(--viz-rejected)' }: { items: ColumnItem[]; unidad: string; emphasisColor?: string }) {
  const { ref, tip, show, hide } = useTooltip()
  const max = Math.max(1, ...items.map(i => i.value))
  const total = items.reduce((s, i) => s + i.value, 0)
  return (
    <div ref={ref} className="relative">
      <div className="flex h-[200px] items-end gap-3 border-b border-line-strong px-2">
        {items.map(it => {
          const detalle = (
            <>
              <p className="m-0 mb-1 font-semibold">{it.label}</p>
              <TipRow color={it.emphasis ? emphasisColor : 'var(--viz-muted)'} label={unidad} value={`${it.value} · ${pct(it.value, total)}%`} />
            </>
          )
          return (
            <div
              key={it.label}
              tabIndex={0}
              onMouseMove={e => show(e, detalle)}
              onMouseLeave={hide}
              onFocus={e => show(e, detalle)}
              onBlur={hide}
              aria-label={`${it.label}: ${it.value} ${unidad.toLowerCase()}`}
              className="group flex h-full min-w-0 flex-1 cursor-default flex-col items-center justify-end gap-1.5 rounded-t-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="text-[13px] font-bold text-content tabular-nums">{it.value}</span>
              <div
                className="w-full max-w-[56px] rounded-t-[4px] transition-[height,opacity] duration-500 group-hover:opacity-85"
                style={{ height: `${(it.value / max) * 82}%`, minHeight: it.value ? 4 : 0, background: it.emphasis ? emphasisColor : 'var(--viz-muted)' }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-3 px-2 pt-2">
        {items.map(it => (
          <span key={it.label} className="flex-1 text-center text-xs font-medium text-content-2">
            {it.label}
          </span>
        ))}
      </div>
      <ChartTooltip tip={tip} />
    </div>
  )
}

// ==================== Barra segmentada alta (parte de un todo) ====================

/** Una sola barra alta dividida en partes (<= 6), con el % impreso cuando cabe */
export function SegmentedBar({ parts }: { parts: { key: string; label: string; value: number; color: string; textOn?: string }[] }) {
  const { ref, tip, show, hide } = useTooltip()
  const total = parts.reduce((s, p) => s + p.value, 0)
  if (total === 0) return null
  return (
    <div ref={ref} className="relative flex flex-col gap-2.5">
      <div className="flex h-7 w-full gap-[2px]" role="img" aria-label={parts.map(p => `${p.label} ${pct(p.value, total)}%`).join(', ')}>
        {parts
          .filter(p => p.value > 0)
          .map(p => {
            const share = pct(p.value, total)
            return (
              <div
                key={p.key}
                onMouseMove={e => show(e, <TipRow color={p.color} label={p.label} value={`${p.value} · ${share}%`} />)}
                onMouseLeave={hide}
                className="flex h-full items-center justify-center overflow-hidden rounded-[4px] text-[11px] font-bold transition-opacity hover:opacity-90"
                style={{ flexGrow: p.value, flexBasis: 0, background: p.color, color: p.textOn ?? '#fff' }}
              >
                {share >= 8 && `${share}%`}
              </div>
            )
          })}
      </div>
      <Legend items={parts.map(p => ({ label: `${p.label} · ${p.value}`, color: p.color }))} />
      <ChartTooltip tip={tip} />
    </div>
  )
}
