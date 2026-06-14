import { useEffect, useRef } from 'react'
import type { OverlayProps } from './types'
import { ARCHITECTURE_CALLOUTS } from '../../data/chapters'
import { clamp01, invlerp } from '../../lib/math'

/**
 * Chapter 04 — 2.5D layer focus. Transparent highlight bands align to the
 * stacked layers of the exploded-architecture asset and receive a cold-white
 * edge glow in sequence. Numbered callouts appear one by one on the right.
 */

// bands aligned to the layered object (which sits centre-right in the asset)
const BANDS = [
  { top: 22, h: 9 },
  { top: 34, h: 9 },
  { top: 46, h: 9 },
  { top: 58, h: 9 },
  { top: 70, h: 9 },
  { top: 82, h: 9 },
]

export default function ArchitectureLayers({ progressRef, range }: OverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const bandRefs = useRef<HTMLDivElement[]>([])
  const calloutRefs = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    let raf = 0
    const n = BANDS.length
    const tick = () => {
      const p = progressRef.current
      const near = p > range[0] - 0.05 && p < range[1] + 0.05
      const root = rootRef.current
      if (root) root.style.opacity = near ? '1' : '0'
      if (near) {
        const local = clamp01(invlerp(range[0], range[1], p))
        const out = 1 - clamp01(invlerp(0.92, 1.0, local))
        for (let i = 0; i < n; i++) {
          const s = 0.18 + (i / n) * 0.42
          const e = s + 0.14
          const a = clamp01(invlerp(s, e, local)) * out
          const band = bandRefs.current[i]
          if (band) band.style.opacity = String(a * 0.45)
          const call = calloutRefs.current[i]
          if (call) {
            call.style.opacity = String(a)
            call.style.transform = `translateX(${(1 - a) * 10}px)`
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progressRef, range])

  return (
    <div ref={rootRef} className="arch" aria-hidden="true">
      <div className="arch__bands">
        {BANDS.map((b, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) bandRefs.current[i] = el
            }}
            className="arch__band"
            style={{ top: `${b.top}%`, height: `${b.h}%` }}
          />
        ))}
      </div>
      <div className="arch__callouts">
        {ARCHITECTURE_CALLOUTS.map((c, i) => (
          <div
            key={c.label}
            ref={(el) => {
              if (el) calloutRefs.current[i] = el
            }}
            className="arch__callout"
            style={{ top: `${c.y}%` }}
          >
            <span className="arch__index">{String(i + 1).padStart(2, '0')}</span>
            <span className="arch__label">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
