import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { clamp01, lerp, invlerp } from '../../lib/math'

interface Props {
  progressRef: MutableRefObject<number>
  /** halve blur / drop the head on mobile */
  lite?: boolean
}

/**
 * Persistent photon beam — the narrative connector that runs through chapters
 * 01–06. It never resets: one sharp core line and one soft glow line stay
 * present while their intensity and vertical alignment ease between chapters.
 * In chapter 01 a bright head sweeps through the server; from there the moving
 * light is carried on by the core/datacenter photon overlays. It calms toward
 * chapter 06 and hands off to the lab laser.
 */
export default function JourneyBeam({ progressRef, lite }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const coreRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    let t0 = performance.now()

    const tick = (now: number) => {
      const p = progressRef.current
      const time = (now - t0) / 1000

      // vertical alignment drifts gently 52vh -> 50vh over the first chapters
      const y = lerp(52, 50, clamp01(invlerp(0, 0.285, p)))

      // intensity envelope across the journey
      let op: number
      if (p < 0.145) {
        const l = clamp01(invlerp(0, 0.145, p))
        op = l < 0.35 ? lerp(0, 0.9, l / 0.35) : lerp(0.9, 0.38, clamp01((l - 0.35) / 0.5))
      } else if (p < 0.705) {
        // steady engineered connector with a barely-there pulse
        op = 0.32 + 0.05 * Math.sin(time * 1.1)
      } else if (p < 0.85) {
        op = lerp(0.34, 0.1, clamp01(invlerp(0.705, 0.85, p))) // hand off in ch06
      } else {
        op = lerp(0.1, 0, clamp01(invlerp(0.85, 0.92, p)))
      }

      const root = rootRef.current
      if (root) {
        root.style.opacity = op > 0.001 ? '1' : '0'
        root.style.setProperty('--beam-y', `${y}vh`)
      }
      if (coreRef.current) coreRef.current.style.opacity = String(clamp01(op))
      if (glowRef.current) glowRef.current.style.opacity = String(clamp01(op * 0.55))

      // chapter-01 entry head sweep (-20vw -> 120vw)
      if (headRef.current) {
        if (p < 0.16 && !lite) {
          const l = clamp01(invlerp(0, 0.145, p))
          headRef.current.style.transform = `translateX(${lerp(-20, 120, l)}vw)`
          headRef.current.style.opacity = String(Math.min(1, op + 0.12))
        } else {
          headRef.current.style.opacity = '0'
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progressRef, lite])

  return (
    <div ref={rootRef} className={`jbeam${lite ? ' jbeam--lite' : ''}`} aria-hidden="true">
      <div ref={glowRef} className="jbeam__glow" />
      <div ref={coreRef} className="jbeam__core" />
      <div ref={headRef} className="jbeam__head" />
    </div>
  )
}
