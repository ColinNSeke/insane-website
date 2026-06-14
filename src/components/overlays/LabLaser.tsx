import { useEffect, useRef } from 'react'
import type { OverlayProps } from './types'
import { clamp01, invlerp } from '../../lib/math'

/**
 * Chapter 07 — quiet lab finish. A single laser line slowly activates across
 * the wafer/lab scene, with a few faint specular highlights. Calm, precise.
 */
export default function LabLaser({ progressRef, range, lite }: OverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const laserRef = useRef<HTMLDivElement>(null)
  const specRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = progressRef.current
      const near = p > range[0] - 0.05 && p < range[1] + 0.05
      const root = rootRef.current
      if (root) root.style.opacity = near ? '1' : '0'
      if (near) {
        const local = clamp01(invlerp(range[0], range[1], p))
        const laser = clamp01(invlerp(0.1, 0.55, local)) * 0.8
        if (laserRef.current) {
          laserRef.current.style.opacity = String(laser)
          laserRef.current.style.transform = `scaleX(${0.3 + laser * 0.875})`
        }
        if (specRef.current)
          specRef.current.style.opacity = String(clamp01(invlerp(0.2, 0.7, local)) * 0.22)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progressRef, range])

  return (
    <div ref={rootRef} className="lab" aria-hidden="true">
      <div ref={laserRef} className="lab__laser" />
      {!lite && (
        <div ref={specRef} className="lab__spec">
          {SPECKS.map((s, i) => (
            <span
              key={i}
              className="lab__speck"
              style={{ left: `${s[0]}%`, top: `${s[1]}%` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const SPECKS: Array<[number, number]> = [
  [60, 58],
  [66, 64],
  [71, 55],
  [63, 70],
  [69, 49],
  [74, 67],
]
