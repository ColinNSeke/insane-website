import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

interface Props {
  velocityRef: React.MutableRefObject<number>
  flareRef: React.MutableRefObject<number>
  mobile: boolean
}

/**
 * Post stack. Bloom + chromatic aberration intensities ride scroll velocity and
 * section-transition flares, so fast scrolling visibly blooms harder and smears.
 * Mobile drops aberration + grain and softens bloom for stability.
 */
export default function Effects({ velocityRef, flareRef, mobile }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bloomRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const caRef = useRef<any>(null)

  useFrame(() => {
    const v = velocityRef.current
    const f = flareRef.current
    // restrained: only nudge bloom/aberration with velocity, never white-out
    if (bloomRef.current) {
      bloomRef.current.intensity = 0.45 + v * 0.4 + f * 0.35
    }
    if (caRef.current && caRef.current.offset) {
      const o = 0.0004 + v * 0.0022 + f * 0.0012
      ;(caRef.current.offset as THREE.Vector2).set(o, o * 0.6)
    }
  })

  if (mobile) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom
          ref={bloomRef}
          intensity={0.4}
          radius={0.4}
          luminanceThreshold={0.78}
          luminanceSmoothing={0.6}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.3} darkness={0.95} />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer multisampling={4}>
      <Bloom
        ref={bloomRef}
        intensity={0.45}
        radius={0.4}
        luminanceThreshold={0.75}
        luminanceSmoothing={0.65}
        mipmapBlur
      />
      <ChromaticAberration
        ref={caRef}
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.0004, 0.0003)}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.28} darkness={0.95} />
      <Noise opacity={0.025} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  )
}
