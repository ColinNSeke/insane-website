import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { X_SECTIONS, SECTION_SPACING, CAM_LEAD } from './sections'
import DepthPlane from './DepthPlane'
import Beam from './Beam'
import Particles from './Particles'
import Effects from './Effects'

interface Props {
  progressRef: React.MutableRefObject<number>
  velocityRef: React.MutableRefObject<number>
  mobile: boolean
}

const N = X_SECTIONS.length
const LAST_Z = -(N - 1) * SECTION_SPACING
const CAM_START = CAM_LEAD
const CAM_END = LAST_Z - CAM_LEAD
const TRAVEL = CAM_START - CAM_END
const JOURNEY_DEPTH = (N - 1) * SECTION_SPACING + CAM_LEAD * 2 + 12

export default function Scene({ progressRef, velocityRef, mobile }: Props) {
  const { camera } = useThree()
  const flareRef = useRef(0)
  const camZRef = useRef(CAM_START)

  useFrame((state) => {
    const p = THREE.MathUtils.clamp(progressRef.current, 0, 1)
    const targetZ = CAM_START - p * TRAVEL

    // damped dolly for a smooth, weighty camera
    camZRef.current += (targetZ - camZRef.current) * 0.12
    camera.position.z = camZRef.current

    // gentle drift so it feels alive even when still
    const t = state.clock.elapsedTime
    camera.position.x = Math.sin(t * 0.18) * 0.25 + Math.sin(p * Math.PI * 2) * 0.4
    camera.position.y = Math.cos(t * 0.15) * 0.12
    camera.lookAt(0, 0, camZRef.current - 10)

    // flare: spike as we cross a plane (light bridge) + scroll velocity
    let nearest = Infinity
    for (let i = 0; i < N; i++) {
      const ahead = camZRef.current - -i * SECTION_SPACING
      if (Math.abs(ahead) < Math.abs(nearest)) nearest = ahead
    }
    const cross = Math.exp(-(nearest * nearest) / (2 * 0.7 * 0.7))
    flareRef.current = THREE.MathUtils.clamp(
      cross * 0.7 + velocityRef.current * 0.5,
      0,
      1.4,
    )
  })

  return (
    <>
      <color attach="background" args={['#04060a']} />
      <fog attach="fog" args={['#04060a', 8, 34]} />
      <ambientLight intensity={0.4} />

      {X_SECTIONS.map((s, i) => (
        <DepthPlane
          key={s.id}
          section={s}
          index={i}
          z={-i * SECTION_SPACING}
          flareRef={flareRef}
        />
      ))}

      <Beam velocityRef={velocityRef} flareRef={flareRef} />
      <Particles count={mobile ? 220 : 900} depth={JOURNEY_DEPTH} />

      <Effects velocityRef={velocityRef} flareRef={flareRef} mobile={mobile} />
    </>
  )
}
