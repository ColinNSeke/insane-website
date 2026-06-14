export interface ChapterCallout {
  /** label (uppercase microcopy) */
  label: string
  /** optional secondary description */
  desc?: string
  /** anchor point of the dot, in % of stage (x, y) */
  x: number
  y: number
  /** direction the leader line travels from the dot: label sits at this side */
  side: 'left' | 'right'
}

export interface Chapter {
  id: string
  index: number
  /** scroll progress window on the master timeline [start, end] */
  range: [number, number]
  asset: string
  objectPosition: string
  scaleFrom: number
  scaleTo: number
  eyebrow: string
  /** headline split across lines */
  title: string[]
  body: string
  cta: string
  /** local progress at which the text stagger begins (default ~0.1).
   *  Used to make copy land *after* a portal/scene transition settles. */
  textStart?: number
}

/**
 * Section 03 destination world. `inside-light.png` is the intended waveguide
 * world; it is not present in the repo, so we fall back to the core render.
 * Drop public/assets/qant/inside-light.png to switch — no code change needed
 * beyond pointing the core chapter asset here.
 */
export const INSIDE_LIGHT = '/assets/qant/03_core.png'

export const CHAPTERS: Chapter[] = [
  {
    id: 'server',
    index: 1,
    range: [0.0, 0.145],
    asset: '/assets/qant/01_server.png',
    objectPosition: '72% center',
    scaleFrom: 1.06,
    scaleTo: 1.0,
    eyebrow: '01 / Native Processing',
    title: ['The Server', 'That Computes', 'With Light'],
    body: 'Q.ANT Native Processing Server. Harnessing photons as a compute medium for the next era of AI infrastructure.',
    cta: 'Explore the System',
  },
  {
    id: 'card',
    index: 2,
    range: [0.145, 0.285],
    asset: '/assets/qant/02_card.png',
    objectPosition: '68% center',
    scaleFrom: 1.04,
    scaleTo: 1.0,
    eyebrow: '02 / The Product',
    title: ['The Photonic', 'Processing Card'],
    body: 'A photonic processing card designed to move and process information through light with precision, bandwidth, and efficiency.',
    cta: 'Explore the Card',
  },
  {
    id: 'core',
    index: 3,
    range: [0.285, 0.425],
    asset: INSIDE_LIGHT,
    objectPosition: '70% center',
    scaleFrom: 1.08,
    scaleTo: 1.02,
    eyebrow: '03 / Photonic Core',
    title: ['Light', 'Becomes Math'],
    body: 'Inside the photonic core, light travels through engineered pathways, where signals are routed, combined, and measured with near-zero resistive loss.',
    cta: 'Enter the Core',
    // copy appears only after the portal lands the viewer inside the core world
    textStart: 0.36,
  },
  {
    id: 'architecture',
    index: 4,
    range: [0.425, 0.565],
    asset: '/assets/qant/04_architecture.png',
    objectPosition: '70% center',
    scaleFrom: 1.04,
    scaleTo: 1.0,
    eyebrow: '04 / Architecture',
    title: ['No Digital', 'Detour'],
    body: 'Q.ANT’s architecture is built around photonic signal paths, allowing information to move through layered functions without unnecessary digital detours.',
    cta: 'Explore the Stack',
  },
  {
    id: 'datacenter',
    index: 5,
    range: [0.565, 0.705],
    asset: '/assets/qant/05_datacenter.png',
    objectPosition: '74% center',
    scaleFrom: 1.08,
    scaleTo: 1.02,
    eyebrow: '05 / Deployment',
    title: ['Infrastructure', 'At the Speed', 'Of Light'],
    body: 'Photonic systems are designed for demanding compute environments where bandwidth, power, reliability, and scale matter.',
    cta: 'Explore Deployment',
  },
  {
    id: 'transformation',
    index: 6,
    range: [0.705, 0.85],
    asset: '/assets/qant/06_transformation.png',
    objectPosition: 'center center',
    scaleFrom: 1.02,
    scaleTo: 1.0,
    eyebrow: '06 / Transformation',
    title: ['From', 'Electricity', 'To Light'],
    body: 'The next compute paradigm moves beyond resistive electrical limits, replacing heat and loss with coherent optical signal flow.',
    cta: 'Discover the Shift',
  },
  {
    id: 'lab',
    index: 7,
    range: [0.85, 1.0],
    asset: '/assets/qant/07_lab.png',
    objectPosition: '72% center',
    scaleFrom: 1.05,
    scaleTo: 1.0,
    eyebrow: '07 / Material Science',
    title: ['The Material', 'That Guides', 'Light'],
    body: 'At the material level, photonic computing begins with precise control of light across engineered surfaces, waveguides, and optical structures.',
    cta: 'Explore the Science',
  },
]

/** Chapter 02 product callouts, positioned over the card asset. */
export const CARD_CALLOUTS: ChapterCallout[] = [
  { label: 'Optical I/O', desc: 'Light in, light out', x: 30, y: 40, side: 'left' },
  { label: 'Co-packaged optical engine', x: 58, y: 33, side: 'right' },
  { label: 'Silicon photonics processor', x: 62, y: 52, side: 'right' },
  { label: 'PCIe interface', x: 47, y: 78, side: 'left' },
  { label: 'Thermal management', x: 73, y: 64, side: 'right' },
]

/** Chapter 04 architecture stack callouts. */
export const ARCHITECTURE_CALLOUTS: ChapterCallout[] = [
  { label: 'Optical interface', x: 78, y: 24, side: 'right' },
  { label: 'Modulation layer', x: 78, y: 36, side: 'right' },
  { label: 'Photonic routing', x: 78, y: 48, side: 'right' },
  { label: 'Interference mesh', x: 78, y: 60, side: 'right' },
  { label: 'Detection layer', x: 78, y: 72, side: 'right' },
  { label: 'Electrical interface', x: 78, y: 84, side: 'right' },
]
