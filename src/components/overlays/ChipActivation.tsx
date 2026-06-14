import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { fitCanvas } from '../../lib/canvas'
import { clamp01 } from '../../lib/math'
import { smoothstep } from '../../lib/math'
import { PORTAL_X, PORTAL_Y } from '../../lib/sceneMotion'

interface Props {
  progressRef: MutableRefObject<number>
}

/**
 * Chip / core activation for the card -> core transition (motion adapted from
 * the assembly.html prototype, rebuilt in the site's canvas style).
 *
 * The effect is contained to the card's chip module and is the *origin* of the
 * existing optical portal (same centre as ChipPortal / the core clip):
 *   - PHASE 3 (global ~0.215–0.255): the core "comes online" — a localized
 *     blue-white glow rises and pulses, a few short light paths emanate inside
 *     the chip, tiny sparks drift.
 *   - PHASE 4 (global 0.255–0.335): the portal opens from that glow; the glow
 *     flares once then resolves as the core world fills the frame.
 */

const N_PATHS = 6
const N_SPARKS = 14

export default function ChipActivation({ progressRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // stable per-instance randomness for sparks / path angles
  const seedRef = useRef(
    Array.from({ length: N_SPARKS }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.2 + Math.random() * 0.8,
      sp: 0.3 + Math.random() * 0.7,
    })),
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let t = 0
    let last = performance.now()

    const render = (now: number) => {
      const dt = Math.min(64, now - last) / 1000
      last = now
      t += dt
      const p = progressRef.current
      const near = p > 0.155 && p < 0.345
      const { w, h } = fitCanvas(canvas, ctx)
      ctx.clearRect(0, 0, w, h)

      if (near) {
        const cx = (PORTAL_X / 100) * w
        const cy = (PORTAL_Y / 100) * h
        const unit = Math.min(w, h)

        const act = smoothstep(0.17, 0.25, p) // core comes online (earlier + wider)
        const port = smoothstep(0.255, 0.335, p) // portal opens from glow
        const pulse = 0.65 + 0.35 * Math.sin(t * 2.6)
        const glowAmt = clamp01(act * (1 - port * 0.8))

        ctx.globalCompositeOperation = 'lighter'

        // localized core glow (bright, unmistakable)
        if (glowAmt > 0.001) {
          const r = (0.16 + act * 0.1 + port * 0.08) * unit
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
          const a = Math.min(1, glowAmt * 1.15 * pulse)
          g.addColorStop(0, `rgba(230,246,255,${a})`)
          g.addColorStop(0.18, `rgba(190,222,255,${a * 0.8})`)
          g.addColorStop(0.45, `rgba(120,180,255,${a * 0.4})`)
          g.addColorStop(1, 'rgba(80,140,230,0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(cx, cy, r, 0, Math.PI * 2)
          ctx.fill()
        }

        // expanding "online" ping rings — clearly signal the core activating
        const ringA = clamp01(act) * (1 - port)
        if (ringA > 0.001) {
          for (let j = 0; j < 3; j++) {
            const ph = (t * 0.6 + j / 3) % 1
            const rr = ph * 0.34 * unit
            ctx.strokeStyle = `rgba(200,230,255,${(1 - ph) * ringA * 0.55})`
            ctx.lineWidth = 1.4
            ctx.beginPath()
            ctx.arc(cx, cy, rr, 0, Math.PI * 2)
            ctx.stroke()
          }
        }

        // a few short light paths emanating inside the chip (contained)
        const pathA = clamp01(act) * (1 - port)
        if (pathA > 0.001) {
          const len = 0.2 * unit
          for (let k = 0; k < N_PATHS; k++) {
            const ang = (k / N_PATHS) * Math.PI * 2 + t * 0.05
            const ex = cx + Math.cos(ang) * len
            const ey = cy + Math.sin(ang) * len * 0.7
            const grad = ctx.createLinearGradient(cx, cy, ex, ey)
            grad.addColorStop(0, `rgba(226,242,255,${0.7 * pathA})`)
            grad.addColorStop(1, 'rgba(220,238,255,0)')
            ctx.strokeStyle = grad
            ctx.lineWidth = 1.3
            ctx.beginPath()
            ctx.moveTo(cx, cy)
            ctx.lineTo(ex, ey)
            ctx.stroke()

            // travelling bright photon along the path
            const ph = (t * 0.5 + k / N_PATHS) % 1
            const px = cx + Math.cos(ang) * len * ph
            const py = cy + Math.sin(ang) * len * 0.7 * ph
            ctx.fillStyle = `rgba(234,246,255,${0.72 * pathA * (1 - ph)})`
            ctx.beginPath()
            ctx.arc(px, py, 1.6, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        // tiny sparks drifting around the chip
        const sparkA = clamp01(act) * (1 - port)
        if (sparkA > 0.001) {
          for (const s of seedRef.current) {
            const ang = s.a + t * s.sp * 0.3
            const rad = s.r * 0.05 * unit
            const x = cx + Math.cos(ang) * rad
            const y = cy + Math.sin(ang) * rad
            ctx.fillStyle = `rgba(234,246,255,${sparkA * 0.6})`
            ctx.beginPath()
            ctx.arc(x, y, 1.4, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        // portal-origin flare: one bright kiss at the chip as the portal opens
        const flare = Math.sin(port * Math.PI)
        if (flare > 0.001) {
          const r = 0.06 * unit
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
          g.addColorStop(0, `rgba(234,246,255,${flare * 0.5})`)
          g.addColorStop(1, 'rgba(234,246,255,0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(cx, cy, r, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.globalCompositeOperation = 'source-over'
      }

      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [progressRef])

  return <canvas ref={canvasRef} className="fx-canvas chip-activation" aria-hidden="true" />
}
