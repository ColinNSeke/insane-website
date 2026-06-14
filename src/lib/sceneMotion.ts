import { ramp, power2InOut, power3InOut } from './easing'

export interface SceneMotion {
  opacity: number
  scale: number
  /** translate X in vw */
  x: number
  /** translate Y in vh */
  y: number
  /** clip-path string (portal) or null for none */
  clip: string | null
}

/** portal centre, in viewport units (matches ChipPortal ring) */
export const PORTAL_X = 68 // vw
export const PORTAL_Y = 48 // vh

const I2 = power2InOut
const I3 = power3InOut

/**
 * Per-scene camera motion as a function of GLOBAL scroll progress.
 *
 * The transition windows are overlapping so chapters extract/push into each
 * other (server pushes toward card, camera dives through the card into the
 * core via a portal, core unfolds into architecture, architecture collapses
 * into the datacenter, etc.) instead of cross-fading like slides.
 */
export function computeSceneMotion(id: string, p: number): SceneMotion {
  switch (id) {
    case 'server': {
      const opacity =
        p < 0.12 ? ramp(p, 0, 0.029, 0, 1, I2) : ramp(p, 0.12, 0.175, 1, 0.18, I2)
      const scale =
        p < 0.12 ? ramp(p, 0, 0.12, 1.06, 1.0) : ramp(p, 0.12, 0.175, 1.0, 1.22, I3)
      const x =
        p < 0.12 ? ramp(p, 0, 0.12, 0, -1.5) : ramp(p, 0.12, 0.175, -1.5, -8, I3)
      return { opacity, scale, x, y: 0, clip: null }
    }

    case 'card': {
      let opacity = 0
      if (p >= 0.12 && p < 0.175) opacity = ramp(p, 0.12, 0.175, 0, 1, I2)
      else if (p >= 0.175 && p < 0.255) opacity = 1
      else if (p >= 0.255) opacity = ramp(p, 0.255, 0.335, 1, 0, I2)

      let scale = 1
      if (p < 0.175) scale = ramp(p, 0.12, 0.175, 1.18, 1.0, I3)
      else if (p < 0.255) scale = 1
      else scale = ramp(p, 0.255, 0.335, 1.0, 2.6, I3) // portal dive

      let x = 0
      if (p < 0.175) x = ramp(p, 0.12, 0.175, 12, 0, I3)
      else if (p >= 0.255) x = ramp(p, 0.255, 0.335, 0, -18, I3)

      const y = p < 0.255 ? 0 : ramp(p, 0.255, 0.335, 0, 5, I3)
      return { opacity, scale, x, y, clip: null }
    }

    case 'core': {
      let opacity = 0
      if (p >= 0.255 && p < 0.335) opacity = ramp(p, 0.255, 0.335, 0, 1, I2)
      else if (p >= 0.335 && p < 0.405) opacity = 1
      else if (p >= 0.405) opacity = ramp(p, 0.405, 0.475, 1, 0, I2)

      let scale = 1.35
      if (p < 0.335) scale = ramp(p, 0.255, 0.335, 1.35, 1.1, I3) // portal entry
      else if (p < 0.405) scale = ramp(p, 0.335, 0.405, 1.1, 1.34) // microscopic travel
      else scale = ramp(p, 0.405, 0.475, 1.34, 1.8, I3) // unfold exit

      const x = p < 0.335 ? 0 : ramp(p, 0.335, 0.405, 0, -7)
      const y = p < 0.335 ? 0 : ramp(p, 0.335, 0.405, 0, 3)

      // portal clip: small circle grows to cover the viewport
      let clip: string | null = null
      if (p < 0.255) clip = `circle(0vw at ${PORTAL_X}vw ${PORTAL_Y}vh)`
      else if (p < 0.335)
        clip = `circle(${ramp(p, 0.255, 0.335, 4, 150, I3)}vw at ${PORTAL_X}vw ${PORTAL_Y}vh)`
      else clip = null

      return { opacity, scale, x, y, clip }
    }

    case 'architecture': {
      let opacity = 0
      if (p >= 0.405 && p < 0.475) opacity = ramp(p, 0.405, 0.475, 0, 1, I2)
      else if (p >= 0.475 && p < 0.545) opacity = 1
      else if (p >= 0.545) opacity = ramp(p, 0.545, 0.615, 1, 0.12, I2)

      let scale = 0.92
      if (p < 0.475) scale = ramp(p, 0.405, 0.475, 0.92, 1.0, I3)
      else if (p < 0.545) scale = ramp(p, 0.475, 0.545, 1.0, 1.03)
      else scale = ramp(p, 0.545, 0.615, 1.03, 0.54, I3) // collapse into infra

      const x = p < 0.545 ? 0 : ramp(p, 0.545, 0.615, 0, 20, I3)

      let y = 2
      if (p < 0.475) y = ramp(p, 0.405, 0.475, 2, 0, I3)
      else if (p < 0.545) y = ramp(p, 0.475, 0.545, 0, -1.6) // ~-18px
      else y = ramp(p, 0.545, 0.615, -1.6, 8, I3)

      return { opacity, scale, x, y, clip: null }
    }

    case 'datacenter': {
      let opacity = 0
      if (p >= 0.545 && p < 0.615) opacity = ramp(p, 0.545, 0.615, 0, 1, I2)
      else if (p >= 0.615 && p < 0.685) opacity = 1
      else if (p >= 0.685) opacity = ramp(p, 0.685, 0.735, 1, 0, I2)

      let scale = 1.12
      if (p < 0.615) scale = ramp(p, 0.545, 0.615, 1.12, 1.04, I3)
      else if (p < 0.685) scale = ramp(p, 0.615, 0.685, 1.04, 1.12) // push into corridor
      else scale = 1.12

      const x = p < 0.615 ? 0 : ramp(p, 0.615, 0.685, 0, -4)
      return { opacity, scale, x, y: 0, clip: null }
    }

    case 'transformation': {
      let opacity = 0
      if (p >= 0.685 && p < 0.735) opacity = ramp(p, 0.685, 0.735, 0, 1, I2)
      else if (p >= 0.735) opacity = 1

      const scale =
        p < 0.735 ? 1.02 : p < 0.835 ? ramp(p, 0.735, 0.835, 1.02, 1.0) : 1.0
      return { opacity, scale, x: 0, y: 0, clip: null }
    }

    case 'lab': {
      const opacity = p < 0.835 ? 0 : ramp(p, 0.835, 0.885, 0, 1, I2)
      const scale = ramp(p, 0.835, 0.885, 1.06, 1.0, I3)
      return { opacity, scale, x: 0, y: 0, clip: null }
    }

    default:
      return { opacity: 0, scale: 1, x: 0, y: 0, clip: null }
  }
}
