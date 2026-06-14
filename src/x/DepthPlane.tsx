import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { XSection } from './sections'
import { useColorTexture, useOptionalTexture } from './useOptionalTexture'

interface Props {
  section: XSection
  index: number
  z: number
  flareRef: React.MutableRefObject<number>
}

const PLANE_W = 13.5
const PLANE_H = 7.6

/**
 * Section image plane. The IMAGE is the hero: rendered with an unlit
 * MeshBasicMaterial (full colour, unaffected by scene lighting) and the
 * renderer's ACES tone mapping, so it stays sharp and readable. Geometry is
 * gently depth-displaced (¼ of the previous amplitude) so it never tears.
 */
export default function DepthPlane({ section, z }: Props) {
  const map = useColorTexture(section.image)
  const depth = useOptionalTexture(section.depth)
  const { camera } = useThree()

  // uniforms injected into the basic material's vertex stage
  const uni = useMemo(
    () => ({
      uDepth: { value: null as THREE.Texture | null },
      uHasDepth: { value: 0 },
      uDisplace: { value: section.displace },
      uParallax: { value: 0.16 },
    }),
    [section.displace],
  )

  const material = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: true,
    })
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uDepth = uni.uDepth
      shader.uniforms.uHasDepth = uni.uHasDepth
      shader.uniforms.uDisplace = uni.uDisplace
      shader.uniforms.uParallax = uni.uParallax
      shader.vertexShader =
        'uniform sampler2D uDepth;\nuniform float uHasDepth;\nuniform float uDisplace;\nuniform float uParallax;\n' +
        shader.vertexShader
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_UV
          if (uHasDepth > 0.5) {
            float d = texture2D(uDepth, uv).r;
            transformed.z += (d - 0.5) * uDisplace;
          } else {
            float r = distance(uv, vec2(0.5));
            transformed.z += (0.5 - r) * uParallax;
          }
        #endif`,
      )
    }
    return m
  }, [uni])

  useFrame(() => {
    if (map && material.map !== map) {
      material.map = map
      material.needsUpdate = true
    }
    if (depth && uni.uHasDepth.value === 0) {
      uni.uDepth.value = depth
      uni.uHasDepth.value = 1
    }
    // distance ahead of the camera (looking toward -Z)
    const ahead = camera.position.z - z
    const fadeIn = THREE.MathUtils.smoothstep(ahead, 22, 11)
    const fadeOut = THREE.MathUtils.smoothstep(ahead, -3.2, 1.2)
    material.opacity = fadeIn * fadeOut
  })

  return (
    <mesh position={[0, 0, z]} material={material}>
      <planeGeometry args={[PLANE_W, PLANE_H, 80, 80]} />
    </mesh>
  )
}
