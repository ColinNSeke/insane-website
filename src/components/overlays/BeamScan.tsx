import { useEffect, useRef } from 'react'
import type { OverlayProps } from './types'
import { clamp01, invlerp, lerp } from '../../lib/math'

/**
 * Chapter 01 — a cold horizontal light beam scans through the server.
 * A full-width soft line whose opacity rises then settles, plus a bright
 * travelling highlight that sweeps left -> right across the chapter.
 */
export default function BeamScan({ progressRef, range }: OverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const coreRef = useRef<HTMLDivElement>(null)
  const travelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = progressRef.current
      const near = p > range[0] - 0.05 && p < range[1] + 0.05
      const root = rootRef.current
      if (root) root.style.opacity = near ? '1' : '0'
      if (near) {
        const local = clamp01(invlerp(range[0], range[1], p))
        // opacity 0 -> 0.9 by ~0.42 of chapter, then settle to 0.35
        const op =
          local < 0.42
            ? lerp(0, 0.9, invlerp(0.0, 0.42, local))
            : lerp(0.9, 0.35, invlerp(0.42, 1.0, local))
        if (lineRef.current) lineRef.current.style.opacity = String(op * 0.7)
        if (coreRef.current) coreRef.current.style.opacity = String(op)
        // travelling highlight -25vw -> 110vw
        const x = lerp(-25, 110, local)
        if (travelRef.current) {
          travelRef.current.style.transform = `translateX(${x}vw)`
          travelRef.current.style.opacity = String(Math.min(1, op + 0.1))
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progressRef, range])

  return (
    <div ref={rootRef} className="beam" aria-hidden="true">
      <div ref={lineRef} className="beam__line" />
      <div ref={coreRef} className="beam__core" />
      <div ref={travelRef} className="beam__travel" />
    </div>
  )
}
