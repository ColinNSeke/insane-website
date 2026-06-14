import { useEffect, useRef } from 'react'
import type { OverlayProps } from './types'
import { fitCanvas } from '../../lib/canvas'
import { clamp01, invlerp } from '../../lib/math'

/**
 * Photonic core: small light particles travelling along engineered pathways.
 * Paths are defined in normalized stage coords (0..1) and biased to the
 * right half where the core circuitry sits in the asset.
 */

// each path: array of control points; particles ease along the polyline
const PATHS: Array<Array<[number, number]>> = [
  [
    [0.34, 0.62],
    [0.52, 0.58],
    [0.7, 0.5],
    [0.92, 0.42],
  ],
  [
    [0.4, 0.74],
    [0.58, 0.66],
    [0.74, 0.62],
    [0.96, 0.56],
  ],
  [
    [0.46, 0.34],
    [0.6, 0.4],
    [0.78, 0.44],
    [0.98, 0.48],
  ],
  [
    [0.5, 0.5],
    [0.66, 0.52],
    [0.82, 0.56],
    [1.0, 0.64],
  ],
  [
    [0.38, 0.48],
    [0.56, 0.46],
    [0.76, 0.36],
    [0.94, 0.3],
  ],
]

interface Particle {
  path: number
  t: number
  speed: number
  size: number
}

function pointOnPath(pts: Array<[number, number]>, t: number): [number, number] {
  const seg = (pts.length - 1) * t
  const i = Math.min(pts.length - 2, Math.floor(seg))
  const f = seg - i
  const [ax, ay] = pts[i]
  const [bx, by] = pts[i + 1]
  return [ax + (bx - ax) * f, ay + (by - ay) * f]
}

export default function CorePaths({ progressRef, range, lite }: OverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const count = lite ? 18 : 46
    particlesRef.current = Array.from({ length: count }, () => ({
      path: Math.floor(Math.random() * PATHS.length),
      t: Math.random(),
      speed: 0.04 + Math.random() * 0.06,
      size: 2 + Math.random() * 2,
    }))
  }, [lite])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = performance.now()

    const render = (now: number) => {
      const dt = Math.min(64, now - last) / 1000
      last = now
      const p = progressRef.current
      // only active near this chapter window
      const near = p > range[0] - 0.05 && p < range[1] + 0.05
      const { w, h } = fitCanvas(canvas, ctx)
      ctx.clearRect(0, 0, w, h)

      if (near) {
        const local = clamp01(invlerp(range[0], range[1], p))
        // particle layer opacity 0 -> 0.75
        const alpha = Math.min(0.75, local * 1.4) * (1 - Math.max(0, (local - 0.9) * 6))
        const visible = Math.max(0, alpha)

        // faint path guides
        ctx.lineWidth = 1
        ctx.strokeStyle = `rgba(190,220,255,${0.05 * visible})`
        for (const path of PATHS) {
          ctx.beginPath()
          path.forEach(([nx, ny], i) => {
            const x = nx * w
            const y = ny * h
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          })
          ctx.stroke()
        }

        ctx.globalCompositeOperation = 'lighter'
        for (const pt of particlesRef.current) {
          pt.t += pt.speed * dt
          if (pt.t > 1) pt.t -= 1
          const [nx, ny] = pointOnPath(PATHS[pt.path], pt.t)
          const x = nx * w
          const y = ny * h

          // trail
          const trailT = Math.max(0, pt.t - 0.04)
          const [tx, ty] = pointOnPath(PATHS[pt.path], trailT)
          const grad = ctx.createLinearGradient(tx * w, ty * h, x, y)
          grad.addColorStop(0, 'rgba(190,220,255,0)')
          grad.addColorStop(1, `rgba(220,238,255,${0.4 * visible})`)
          ctx.strokeStyle = grad
          ctx.lineWidth = pt.size * 0.5
          ctx.beginPath()
          ctx.moveTo(tx * w, ty * h)
          ctx.lineTo(x, y)
          ctx.stroke()

          // head
          ctx.shadowBlur = 5
          ctx.shadowColor = 'rgba(190,220,255,0.9)'
          ctx.fillStyle = `rgba(236,245,255,${0.85 * visible})`
          ctx.beginPath()
          ctx.arc(x, y, pt.size * 0.6, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
        ctx.globalCompositeOperation = 'source-over'
      }

      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [progressRef, range])

  return <canvas ref={canvasRef} className="fx-canvas" aria-hidden="true" />
}
