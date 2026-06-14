import { useEffect, useRef } from 'react'
import type { OverlayProps } from './types'
import { fitCanvas } from '../../lib/canvas'
import { clamp01, invlerp } from '../../lib/math'

/**
 * Optical-fibre light paths over the rack corridor. Paths converge toward the
 * corridor vanishing point (left of centre in the asset). Light "draws" from
 * the vanishing point outward and tiny dots travel along like fibre signals.
 */

const VP: [number, number] = [0.32, 0.5] // vanishing point

// each path: start point near edges, ends at the vanishing point
const PATHS: Array<[number, number]> = [
  [0.98, 0.3],
  [0.98, 0.46],
  [0.98, 0.66],
  [0.86, 0.86],
  [0.62, 0.92],
].map(([x, y]) => [x, y] as [number, number])

export default function DatacenterPaths({ progressRef, range, lite }: OverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = performance.now()
    let clock = 0

    const render = (now: number) => {
      const dt = Math.min(64, now - last) / 1000
      last = now
      clock += dt
      const p = progressRef.current
      const near = p > range[0] - 0.05 && p < range[1] + 0.05
      const { w, h } = fitCanvas(canvas, ctx)
      ctx.clearRect(0, 0, w, h)

      if (near) {
        const local = clamp01(invlerp(range[0], range[1], p))
        const draw = clamp01(invlerp(0.05, 0.55, local)) // line draw-in
        const fade = 1 - Math.max(0, (local - 0.9) * 6)
        const vis = Math.max(0, fade)
        const vpx = VP[0] * w
        const vpy = VP[1] * h

        ctx.globalCompositeOperation = 'lighter'
        PATHS.forEach(([ex, ey], idx) => {
          const sx = lerpPoint(vpx, ex * w, draw)
          const sy = lerpPoint(vpy, ey * h, draw)

          // glow path
          ctx.strokeStyle = `rgba(190,220,255,${0.22 * vis})`
          ctx.lineWidth = 10
          ctx.shadowBlur = 14
          ctx.shadowColor = 'rgba(160,200,255,0.5)'
          ctx.beginPath()
          ctx.moveTo(vpx, vpy)
          ctx.lineTo(sx, sy)
          ctx.stroke()
          ctx.shadowBlur = 0

          // crisp core
          ctx.strokeStyle = `rgba(220,238,255,${0.62 * vis})`
          ctx.lineWidth = 1.4
          ctx.beginPath()
          ctx.moveTo(vpx, vpy)
          ctx.lineTo(sx, sy)
          ctx.stroke()

          // travelling signal dots
          if (!lite) {
            const dots = 3
            for (let d = 0; d < dots; d++) {
              const phase = (clock * 0.18 + d / dots + idx * 0.13) % 1
              const t = phase * draw
              const x = lerpPoint(vpx, ex * w, t)
              const y = lerpPoint(vpy, ey * h, t)
              const dotAlpha = Math.sin(phase * Math.PI) * vis
              ctx.fillStyle = `rgba(236,245,255,${0.9 * dotAlpha})`
              ctx.beginPath()
              ctx.arc(x, y, 1.8, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        })
        ctx.globalCompositeOperation = 'source-over'
      }

      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [progressRef, range, lite])

  return <canvas ref={canvasRef} className="fx-canvas" aria-hidden="true" />
}

function lerpPoint(a: number, b: number, t: number) {
  return a + (b - a) * t
}
