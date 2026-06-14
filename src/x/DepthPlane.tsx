import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { XSection } from './sections'
import { useColorTexture, useOptionalTexture } from './useOptionalTexture'

const vertexShader = /* glsl */ `
  uniform sampler2D uDepth;
  uniform float uHasDepth;
  uniform float uDisplace;
  uniform float uParallax;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    if (uHasDepth > 0.5) {
      float d = texture2D(uDepth, uv).r;
      pos.z += (d - 0.5) * uDisplace;
    } else {
      // subtle 2-layer parallax fallback: gentle bow so the plane is never flat-dead
      float r = distance(uv, vec2(0.5));
      pos.z += (0.5 - r) * uParallax;
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform vec3 uTint;
  uniform float uFlare;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(uMap, vUv);
    vec3 col = c.rgb * uTint;
    // light-bridge flare lifts highlights toward white during transitions
    col += pow(max(col.r, max(col.g, col.b)), 2.0) * uFlare * vec3(0.6, 0.8, 1.0);
    gl_FragColor = vec4(col, c.a * uOpacity);
    #include <colorspace_fragment>
  }
`

interface Props {
  section: XSection
  index: number
  z: number
  flareRef: React.MutableRefObject<number>
}

const PLANE_W = 12
const PLANE_H = 6.75

export default function DepthPlane({ section, z, flareRef }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const map = useColorTexture(section.image)
  const depth = useOptionalTexture(section.depth)
  const { camera } = useThree()

  const uniforms = useMemo(
    () => ({
      uMap: { value: null as THREE.Texture | null },
      uDepth: { value: null as THREE.Texture | null },
      uHasDepth: { value: 0 },
      uDisplace: { value: section.displace },
      uParallax: { value: 0.6 },
      uOpacity: { value: 0 },
      uTint: { value: new THREE.Vector3(...section.tint) },
      uFlare: { value: 0 },
    }),
    [section.displace, section.tint],
  )

  useFrame(() => {
    const u = uniforms
    if (map && u.uMap.value !== map) u.uMap.value = map
    if (depth && u.uDepth.value !== depth) {
      u.uDepth.value = depth
      u.uHasDepth.value = 1
    }
    // distance ahead of the camera (camera looks toward -Z)
    const ahead = camera.position.z - z
    const fadeIn = THREE.MathUtils.smoothstep(ahead, 22, 11)
    const fadeOut = THREE.MathUtils.smoothstep(ahead, -3.2, 1.2)
    u.uOpacity.value = fadeIn * fadeOut
    u.uFlare.value = flareRef.current
  })

  return (
    <mesh position={[0, 0, z]}>
      <planeGeometry args={[PLANE_W, PLANE_H, 80, 80]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}
