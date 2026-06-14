export const clamp = (v: number, min = 0, max = 1) =>
  v < min ? min : v > max ? max : v

export const clamp01 = (v: number) => clamp(v, 0, 1)

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** inverse lerp, clamped to [0,1] */
export const invlerp = (a: number, b: number, v: number) =>
  a === b ? 0 : clamp01((v - a) / (b - a))

/** smoothstep easing on a [edge0, edge1] window */
export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = invlerp(edge0, edge1, x)
  return t * t * (3 - 2 * t)
}

/** map global progress to a chapter-local 0..1 given its [start,end] range */
export const localProgress = (
  progress: number,
  range: [number, number],
) => invlerp(range[0], range[1], progress)
