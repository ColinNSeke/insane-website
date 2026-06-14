import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { clamp01, invlerp } from '../../lib/math'
import { ramp, power3InOut, pulse } from '../../lib/easing'

interface Props {
  progressRef: MutableRefObject<number>
}

// 5 horizontal slices that fan apart, faking a 2.5D unfold of the chip into
// readable architecture layers. Offsets in px.
const SLICES = [-26, -13, 0, 13, 26]

/**
 * Core -> architecture unfold (global 0.405–0.545). Translucent horizontal
 * slices fan apart while thin cold vertical connectors draw between them, so
 * the chip's internal light paths visually become a layered architecture.
 */
export default function UnfoldLayers({ progressRef }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const sliceRefs = useRef<HTMLDivElement[]>([])
  const connectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = progressRef.current
      const root = rootRef.current
      const near = p > 0.4 && p < 0.55
      if (root) root.style.opacity = near ? '1' : '0'

      if (near) {
        const unfold = ramp(p, 0.405, 0.475, 0, 1, power3InOut)
        const vis = pulse(p, 0.405, 0.46, 0.5, 0.55, power3InOut)
        sliceRefs.current.forEach((el, i) => {
          if (!el) return
          el.style.transform = `translateY(${SLICES[i] * unfold}px)`
          el.style.opacity = String(vis * 0.5)
        })
        if (connectorRef.current)
          connectorRef.current.style.opacity = String(
            clamp01(invlerp(0.46, 0.52, p)) * 0.55 * (1 - clamp01(invlerp(0.53, 0.56, p))),
          )
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progressRef])

  return (
    <div ref={rootRef} className="unfold" aria-hidden="true">
      {SLICES.map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) sliceRefs.current[i] = el
          }}
          className="unfold__slice"
          style={{ top: `${28 + i * 11}%` }}
        />
      ))}
      <div ref={connectorRef} className="unfold__connectors">
        <span style={{ left: '54%' }} />
        <span style={{ left: '66%' }} />
        <span style={{ left: '78%' }} />
      </div>
    </div>
  )
}
