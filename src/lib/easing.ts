/** Easing functions (mirroring GSAP names) operating on t in [0,1]. */
export const linear = (t: number) => t

export const power2Out = (t: number) => 1 - (1 - t) * (1 - t)
export const power2In = (t: number) => t * t
export const power2InOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

export const power3Out = (t: number) => 1 - Math.pow(1 - t, 3)
export const power3In = (t: number) => t * t * t
export const power3InOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/**
 * Ramp a value across a global-progress window [a,b], easing optional.
 * Returns `from` below a and `to` above b (clamped), so it composes safely
 * into piecewise motion functions.
 */
export function ramp(
  p: number,
  a: number,
  b: number,
  from: number,
  to: number,
  ease: (t: number) => number = linear,
): number {
  if (a === b) return p < a ? from : to
  const t = clamp01((p - a) / (b - a))
  return from + (to - from) * ease(t)
}

/** A symmetric in/out window: 0 outside [a,d], rising a→b, full b→c, falling c→d. */
export function pulse(
  p: number,
  a: number,
  b: number,
  c: number,
  d: number,
  ease: (t: number) => number = linear,
): number {
  if (p <= a || p >= d) return 0
  if (p < b) return ease(clamp01((p - a) / (b - a)))
  if (p <= c) return 1
  return ease(clamp01((d - p) / (d - c)))
}
