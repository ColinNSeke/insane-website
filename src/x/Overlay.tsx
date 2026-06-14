import { useEffect, useRef } from 'react'
import { X_SECTIONS } from './sections'

interface Props {
  progressRef: React.MutableRefObject<number>
}

const N = X_SECTIONS.length

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

/**
 * HTML typography layer. Each section's copy fades in/out around its slice of
 * the journey; the left index line fills with overall progress.
 */
export default function Overlay({ progressRef }: Props) {
  const blockRefs = useRef<HTMLDivElement[]>([])
  const indexFillRef = useRef<HTMLSpanElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = progressRef.current
      // each section owns a window; fade in early, hold, fade out
      blockRefs.current.forEach((el, i) => {
        if (!el) return
        const start = i / N
        const end = (i + 1) / N
        const span = end - start
        const local = (p - start) / span
        // first section is already legible on load (no scroll required)
        const inOp = smoothstep(i === 0 ? -0.35 : 0.04, 0.32, local)
        const outOp = 1 - smoothstep(0.7, 0.98, local)
        const op = Math.max(0, inOp * outOp)
        el.style.opacity = String(op)
        el.style.transform = `translateY(${(1 - inOp) * 30 - (1 - outOp) * 24}px)`
      })
      if (indexFillRef.current)
        indexFillRef.current.style.transform = `scaleY(${Math.max(0, Math.min(1, p))})`
      if (counterRef.current) {
        const idx = Math.min(N, Math.floor(p * N) + 1)
        counterRef.current.textContent = String(idx).padStart(2, '0')
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="x-overlay">
      <header className="x-nav">
        <span className="x-wordmark">Q.ANT</span>
        <span className="x-badge">Photonic Journey · /x</span>
      </header>

      <div className="x-index" aria-hidden="true">
        <span ref={counterRef} className="x-index__num">
          01
        </span>
        <span className="x-index__total">/ {String(N).padStart(2, '0')}</span>
        <span className="x-index__track">
          <span ref={indexFillRef} className="x-index__fill" />
        </span>
      </div>

      {X_SECTIONS.map((s, i) => (
        <div
          key={s.id}
          ref={(el) => {
            if (el) blockRefs.current[i] = el
          }}
          className="x-block"
        >
          <div className="x-label">{s.label}</div>
          <h2 className="x-title">
            {s.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <a className="x-cta" href="#">
            {s.cta}
          </a>
        </div>
      ))}

      <div className="x-hint" aria-hidden="true">
        Scroll to fly through
      </div>
    </div>
  )
}
