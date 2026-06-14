import { useEffect, useRef } from 'react'
import type { OverlayProps } from './types'
import { clamp01, invlerp } from '../../lib/math'

/**
 * Chapter 05 — bottom mini metrics. Labels only (no fabricated numbers),
 * staggering in slightly after the visual settles.
 */
const METRICS = ['Bandwidth', 'Efficiency', 'Reliability', 'Scale']

export default function DatacenterMetrics({ progressRef, range }: OverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    let raf = 0
    const n = METRICS.length
    const tick = () => {
      const p = progressRef.current
      const near = p > range[0] - 0.05 && p < range[1] + 0.05
      const root = rootRef.current
      if (root) root.style.opacity = near ? '1' : '0'
      if (near) {
        const local = clamp01(invlerp(range[0], range[1], p))
        const out = 1 - clamp01(invlerp(0.92, 1.0, local))
        itemRefs.current.forEach((el, i) => {
          if (!el) return
          const s = 0.42 + (i / n) * 0.16
          const a = clamp01(invlerp(s, s + 0.16, local)) * out
          el.style.opacity = String(a)
          el.style.transform = `translateY(${(1 - a) * 8}px)`
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progressRef, range])

  return (
    <div ref={rootRef} className="metrics" aria-hidden="true">
      {METRICS.map((m, i) => (
        <div
          key={m}
          ref={(el) => {
            if (el) itemRefs.current[i] = el
          }}
          className="metrics__item"
        >
          <span className="metrics__bar" />
          <span className="metrics__label">{m}</span>
        </div>
      ))}
    </div>
  )
}
