import type { MutableRefObject } from 'react'

export interface OverlayProps {
  /** shared global scroll progress 0..1 */
  progressRef: MutableRefObject<number>
  /** this chapter's [start, end] window on the global timeline */
  range: [number, number]
  /** disable heavy work (mobile / reduced motion) */
  lite?: boolean
}
