import { CHAPTERS } from '../data/chapters'

export interface XSection {
  id: string
  /** colour texture (existing scene image) */
  image: string
  /** expected depth map; falls back to flat parallax if it 404s */
  depth: string
  label: string
  title: string[]
  cta: string
  /** cool grade tint applied in the shader */
  tint: [number, number, number]
  /** displacement amount when a depth map is present */
  displace: number
}

const TINTS: Array<[number, number, number]> = [
  [0.86, 0.93, 1.04], // server — cool steel
  [0.9, 0.96, 1.06], // card
  [0.82, 0.94, 1.12], // core — electric blue
  [0.86, 0.95, 1.08], // architecture
  [0.84, 0.93, 1.1], // datacenter
  [0.9, 0.95, 1.05], // transformation
  [0.88, 0.96, 1.06], // lab
]

/** Reuse the existing chapter copy so /x stays in sync with the homepage. */
export const X_SECTIONS: XSection[] = CHAPTERS.map((c, i) => {
  const file = c.asset.split('/').pop() ?? `${i + 1}.png`
  return {
    id: c.id,
    image: c.asset,
    depth: `/depth/${file}`,
    label: c.eyebrow,
    title: c.title,
    cta: c.cta,
    tint: TINTS[i] ?? [0.88, 0.95, 1.06],
    displace: 0.28,
  }
})

/** world spacing between section planes along -Z */
export const SECTION_SPACING = 6
/** camera sits this far in front of the first plane */
export const CAM_LEAD = 6
