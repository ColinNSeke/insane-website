import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { clamp01, invlerp } from '../lib/math'
import { power3Out, power2In } from '../lib/easing'

interface Props {
  progressRef: MutableRefObject<number>
  range: [number, number]
  id: string
  eyebrow: string
  title: string[]
  body: string
  cta: string
  /** local progress at which the stagger begins (default 0.06) */
  textStart?: number
}

// per-element enter delay (local progress) + enter/exit travel (px)
const ELEMENTS = [
  { key: 'eyebrow', delay: 0.0, yIn: 14, yOut: -14 },
  { key: 'title', delay: 0.06, yIn: 34, yOut: -28 },
  { key: 'body', delay: 0.16, yIn: 22, yOut: -18 },
  { key: 'cta', delay: 0.25, yIn: 14, yOut: -10 },
] as const

/**
 * Premium staggered chapter text. Each element enters (power3.out) with its own
 * delay and exits upward (power2.in) as the chapter ends — driven imperatively
 * off the shared scroll progress so it scrubs with the journey.
 */
export default function ChapterText({
  progressRef,
  range,
  id,
  eyebrow,
  title,
  body,
  cta,
  textStart = 0.06,
}: Props) {
  const refs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = progressRef.current
      const local = clamp01(invlerp(range[0], range[1], p))
      const near = p > range[0] - 0.06 && p < range[1] + 0.06

      for (const el of ELEMENTS) {
        const node = refs.current[el.key]
        if (!node) continue
        if (!near) {
          node.style.opacity = '0'
          continue
        }
        const start = textStart + el.delay
        const tin = power3Out(clamp01(invlerp(start, start + 0.34, local)))
        const tout = power2In(clamp01(invlerp(0.82, 1.0, local)))
        const opacity = tin * (1 - tout)
        const y = (1 - tin) * el.yIn - tout * el.yOut
        node.style.opacity = String(opacity)
        node.style.transform = `translateY(${y}px)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progressRef, range, textStart])

  return (
    <article id={id} className="chapter-content">
      <div
        className="chapter-content__eyebrow ct"
        ref={(el) => {
          refs.current.eyebrow = el
        }}
      >
        {eyebrow}
      </div>
      <h1
        className="chapter-content__title ct"
        ref={(el) => {
          refs.current.title = el
        }}
      >
        {title.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h1>
      <p
        className="chapter-content__body ct"
        ref={(el) => {
          refs.current.body = el
        }}
      >
        {body}
      </p>
      <a
        className="chapter-content__cta ct"
        href="#"
        ref={(el) => {
          refs.current.cta = el
        }}
      >
        {cta}
      </a>
    </article>
  )
}
