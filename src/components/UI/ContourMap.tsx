import React from 'react'
import { cn } from '@/utils/classes'

type Point = [number, number]

/** Curva cerrada y suave (Catmull-Rom convertida a Bezier) alrededor de (cx, cy). */
function contour(cx: number, cy: number, radius: number, seed: number): string {
  const steps = 30
  const points: Point[] = []
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2
    // Ondulacion que depende solo del angulo: asi los anillos de un mismo cerro nunca se cruzan
    const wobble =
      Math.sin(a * 2 + seed) * 0.13 + Math.sin(a * 3 + seed * 1.7) * 0.08 + Math.sin(a * 5 + seed * 0.6) * 0.04
    const r = radius * (1 + wobble * (1 + radius / 420))
    points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.72])
  }
  const at = (i: number): Point => points[(i + steps) % steps]
  let d = `M${at(0)[0].toFixed(1)} ${at(0)[1].toFixed(1)}`
  for (let i = 0; i < steps; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return `${d}Z`
}

/** Tres "cerros" con sus curvas de nivel, calculados una sola vez. */
const HILLS = [
  { cx: 360, cy: 300, rings: 11, step: 34, seed: 1.2 },
  { cx: 1160, cy: 640, rings: 13, step: 36, seed: 4.1 },
  { cx: 1440, cy: 150, rings: 7, step: 30, seed: 2.7 },
]

const PATHS = HILLS.flatMap((hill) =>
  Array.from({ length: hill.rings }, (_, k) => ({
    d: contour(hill.cx, hill.cy, (k + 1) * hill.step, hill.seed),
    // Cada cinco curvas, una "maestra" mas marcada, como en un plano topografico
    major: (k + 1) % 5 === 0,
  }))
)

export interface ContourMapProps {
  className?: string
  /** `dark` = lineas claras sobre fondo azul; `light` = lineas azules muy tenues sobre fondo claro */
  tone?: 'light' | 'dark'
  /** Zona del mapa que se ve cuando el contenedor es mas alargado que el mapa */
  align?: 'xMidYMid' | 'xMaxYMid' | 'xMinYMid'
}

/**
 * Fondo de lineas de nivel (como un plano topografico del distrito). Se desplaza y "respira" muy
 * despacio; es decorativo y no recibe el mouse. Debe ir dentro de un contenedor con position.
 */
export default function ContourMap({ className, tone = 'light', align = 'xMidYMid' }: ContourMapProps) {
  const dark = tone === 'dark'
  const minor = dark ? 'rgba(191,219,254,0.17)' : 'var(--contour-minor)'
  const major = dark ? 'rgba(191,219,254,0.32)' : 'var(--contour-major)'

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <svg
        viewBox="0 0 1600 1000"
        preserveAspectRatio={`${align} slice`}
        className="absolute inset-0 size-full"
        fill="none"
      >
        <g
          style={{
            animation: 'contourDrift 42s ease-in-out infinite alternate',
          }}
        >
          {PATHS.map((path, i) => (
            <path
              key={i}
              d={path.d}
              stroke={path.major ? major : minor}
              strokeWidth={path.major ? 1.6 : 1}
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: `contourBreathe ${10 + (i % 5)}s ease-in-out ${-(i * 0.8)}s infinite alternate`,
              }}
            />
          ))}
        </g>
      </svg>
      {dark && (
        <span
          className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{ animation: 'sheen 11s ease-in-out infinite' }}
        />
      )}
    </div>
  )
}
