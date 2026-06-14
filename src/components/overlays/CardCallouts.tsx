import { useEffect, useRef } from 'react'
import type { OverlayProps } from './types'
import { CARD_CALLOUTS } from '../../data/chapters'
import { clamp01, invlerp } from '../../lib/math'

/**
 * Chapter 02 — real HTML/SVG product callouts over the photonic card.
 * Each callout: a dot anchor, a thin leader line, and a label. They stagger
 * in across local progress 0.35 -> 0.70 and brighten on hover.
 */
export default function CardCallouts({ progressRef, range }: OverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    let raf = 0
    const n = CARD_CALLOUTS.length
    const tick = () => {
      const p = progressRef.current
      const near = p > range[0] - 0.05 && p < range[1] + 0.05
      const root = rootRef.current
      if (root) root.style.opacity = near ? '1' : '0'
      if (near) {
        const local = clamp01(invlerp(range[0], range[1], p))
        // window 0.35 -> 0.70 with per-item stagger; fade out near chapter end
        const out = 1 - clamp01(invlerp(0.9, 1.0, local))
        itemsRef.current.forEach((el, i) => {
          if (!el) return
          const s = 0.35 + (i / n) * 0.18
          const e = s + 0.16
          const a = clamp01(invlerp(s, e, local)) * out
          el.style.opacity = String(a)
          el.style.transform = `translateY(${(1 - a) * 6}px)`
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progressRef, range])

  return (
    <div ref={rootRef} className="callouts" aria-hidden="true">
      {CARD_CALLOUTS.map((c, i) => (
        <div
          key={c.label}
          ref={(el) => {
            if (el) itemsRef.current[i] = el
          }}
          className={`callout callout--${c.side}`}
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
        >
          <span className="callout__dot" />
          <span className="callout__line" />
          <span className="callout__body">
            <span className="callout__label">{c.label}</span>
            {c.desc && <span className="callout__desc">{c.desc}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}
