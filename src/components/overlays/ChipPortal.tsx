import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { clamp01, invlerp } from '../../lib/math'
import { ramp, power3InOut, pulse } from '../../lib/easing'
import { PORTAL_X, PORTAL_Y } from '../../lib/sceneMotion'

interface Props {
  progressRef: MutableRefObject<number>
}

/**
 * Optical-lensing ring for the card -> core dive (global 0.255–0.335). The ring
 * tracks the expanding clip circle applied to the core scene, reading like a
 * lens aperture opening rather than a "magic portal".
 */
export default function ChipPortal({ progressRef }: Props) {
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = progressRef.current
      const ring = ringRef.current
      if (ring) {
        const near = p > 0.24 && p < 0.345
        if (near) {
          const r = ramp(p, 0.255, 0.335, 4, 150, power3InOut) // vw radius
          const op = pulse(p, 0.255, 0.285, 0.305, 0.335, power3InOut) * 0.75
          ring.style.opacity = String(op)
          ring.style.width = `${r * 2}vw`
          ring.style.height = `${r * 2}vw`
          ring.style.left = `${PORTAL_X}vw`
          ring.style.top = `${PORTAL_Y}vh`
          // subtle scroll-coupled aperture shimmer
          ring.style.borderWidth = `${1 + clamp01(invlerp(0.255, 0.3, p)) * 0.5}px`
        } else {
          ring.style.opacity = '0'
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progressRef])

  return (
    <div className="portal" aria-hidden="true">
      <div ref={ringRef} className="portal__ring" />
    </div>
  )
}
