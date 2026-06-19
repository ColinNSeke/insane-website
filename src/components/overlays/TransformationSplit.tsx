import { useEffect, useRef } from 'react'
import type { OverlayProps } from './types'
import { fitCanvas } from '../../lib/canvas'
import { clamp01, invlerp, lerp } from '../../lib/math'

/**
 * Split-world reveal. A vertical divider sweeps from 50vw -> 38vw. Debris
 * particles spray off the divider (electrical -> photonic). Left side carries
 * a restrained dark/warm electrical tint, right a cold photon tint. The base
 * asset already provides the imagery; this is a subtle interpretive layer.
 */

interface Debris {
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  warm: boolean
}

export default function TransformationSplit({ progressRef, range, lite }: OverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const debrisRef = useRef<Debris[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = performance.now()

    const spawn = (dividerX: number, h: number, intensity: number) => {
      if (lite) return
      const n = Math.round(intensity * 3)
      for (let i = 0; i < n; i++) {
        const warm = Math.random() < 0.4
        debrisRef.current.push({
          y: Math.random() * h,
          vx: (warm ? -1 : 1) * (20 + Math.random() * 90),
          vy: (Math.random() - 0.5) * 50,
          life: 0,
          max: 0.6 + Math.random() * 0.8,
          size: 0.6 + Math.random() * 1.8,
          warm,
        })
        void dividerX
      }
    }

    const render = (now: number) => {
      const dt = Math.min(64, now - last) / 1000
      last = now
      const p = progressRef.current
      const near = p > range[0] - 0.05 && p < range[1] + 0.05
      const { w, h } = fitCanvas(canvas, ctx)
      ctx.clearRect(0, 0, w, h)

      if (near) {
        const local = clamp01(invlerp(range[0], range[1], p))
        // divider 50vw -> 38vw
        const dividerX = lerp(0.5, 0.38, clamp01(invlerp(0.0, 1.0, local))) * w
        // debris opacity 0 -> 0.45 -> 0.15
        const debrisAlpha =
          local < 0.5
            ? lerp(0, 0.45, invlerp(0.0, 0.5, local))
            : lerp(0.45, 0.15, invlerp(0.5, 1.0, local))
        const beamAlpha = clamp01(invlerp(0.05, 0.5, local)) * 0.75

        // side tints (very restrained)
        const leftTint = ctx.createLinearGradient(0, 0, dividerX, 0)
        leftTint.addColorStop(0, `rgba(40,24,16,${0.16 * debrisAlpha + 0.04})`)
        leftTint.addColorStop(1, 'rgba(40,24,16,0)')
        ctx.fillStyle = leftTint
        ctx.fillRect(0, 0, dividerX, h)

        const rightTint = ctx.createLinearGradient(dividerX, 0, w, 0)
        rightTint.addColorStop(0, `rgba(120,170,230,${0.12 * (beamAlpha + 0.2)})`)
        rightTint.addColorStop(1, 'rgba(120,170,230,0)')
        ctx.fillStyle = rightTint
        ctx.fillRect(dividerX, 0, w - dividerX, h)

        // cold divider beam
        ctx.globalCompositeOperation = 'lighter'
        const beam = ctx.createLinearGradient(dividerX - 30, 0, dividerX + 30, 0)
        beam.addColorStop(0, 'rgba(190,220,255,0)')
        beam.addColorStop(0.5, `rgba(220,238,255,${beamAlpha})`)
        beam.addColorStop(1, 'rgba(190,220,255,0)')
        ctx.fillStyle = beam
        ctx.fillRect(dividerX - 30, 0, 60, h)
        ctx.strokeStyle = `rgba(236,245,255,${beamAlpha})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(dividerX, 0)
        ctx.lineTo(dividerX, h)
        ctx.stroke()

        // debris
        spawn(dividerX, h, debrisAlpha)
        const next: Debris[] = []
        for (const d of debrisRef.current) {
          d.life += dt
          if (d.life > d.max) continue
          const t = d.life / d.max
          const x = dividerX + d.vx * d.life
          const y = d.y + d.vy * d.life
          const a = Math.sin(t * Math.PI) * debrisAlpha
          ctx.fillStyle = d.warm
            ? `rgba(197,166,106,${a * 0.7})`
            : `rgba(220,238,255,${a})`
          ctx.beginPath()
          ctx.arc(x, y, d.size, 0, Math.PI * 2)
          ctx.fill()
          next.push(d)
        }
        debrisRef.current = next.slice(-400)
        ctx.globalCompositeOperation = 'source-over'
      } else if (debrisRef.current.length) {
        debrisRef.current = []
      }

      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [progressRef, range, lite])

  return <canvas ref={canvasRef} className="fx-canvas" aria-hidden="true" />
}
