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
    if (bloomRef.current) {
      bloomRef.current.intensity = (mobile ? 0.85 : 1.25) + v * 1.6 + f * 1.4
    }
    if (caRef.current && caRef.current.offset) {
      const o = 0.0006 + v * 0.004 + f * 0.0025
      ;(caRef.current.offset as THREE.Vector2).set(o, o * 0.6)
    }
  })

  if (mobile) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom
          ref={bloomRef}
          intensity={0.85}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.7}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer multisampling={4}>
      <Bloom
        ref={bloomRef}
        intensity={1.25}
        luminanceThreshold={0.15}
        luminanceSmoothing={0.75}
        mipmapBlur
      />
      <ChromaticAberration
        ref={caRef}
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.0006, 0.0004)}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.22} darkness={0.92} />
      <Noise opacity={0.035} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  )
}
