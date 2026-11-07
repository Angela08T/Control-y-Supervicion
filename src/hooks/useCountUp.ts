import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Cuenta desde el valor mostrado hasta `target` (con desaceleracion).
 * Con "reducir movimiento" activado devuelve `target` de inmediato.
 */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0)
  const shown = useRef(0)

  useEffect(() => {
    if (!Number.isFinite(target)) return
    if (prefersReducedMotion()) {
      shown.current = target
      setValue(target)
      return
    }
    const from = shown.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const next = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)))
      shown.current = next
      setValue(next)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}
