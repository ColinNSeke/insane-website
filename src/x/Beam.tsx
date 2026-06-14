import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uVel;
  uniform float uFlare;
  varying vec2 vUv;
  void main() {
    // tight vertical falloff -> a thin core line
    float core = smoothstep(0.5, 0.0, abs(vUv.y - 0.5));
    core = pow(core, 3.0);

    // travelling hot-spot sweeping along x (always moving)
    float head = fract(uTime * 0.12);
    float hot = smoothstep(0.14, 0.0, abs(vUv.x - head));
    hot = pow(hot, 2.0);

    // slow breathing pulse + edge fade so the line dies off-screen
    float pulse = 0.55 + 0.45 * sin(uTime * 1.6);
    float edges = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);

    float intensity = (core * (0.35 + pulse * 0.4) + hot * (1.2 + uVel * 2.0));
    intensity *= edges;
    intensity += core * uFlare * 1.5;

    vec3 cool = mix(vec3(0.45, 0.75, 1.0), vec3(0.9, 0.97, 1.0), hot + uFlare);
    gl_FragColor = vec4(cool * intensity, intensity);
  }
`

interface Props {
  velocityRef: React.MutableRefObject<number>
  flareRef: React.MutableRefObject<number>
}

/**
 * Volumetric-feeling light beam. It rides ~4 units ahead of the camera so it is
 * always on screen, animates on its own clock (motion without scrolling), and
 * flares brighter with scroll velocity / section transitions.
 */
export default function Beam({ velocityRef, flareRef }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { camera } = useThree()

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uVel: { value: 0 },
      uFlare: { value: 0 },
    }),
    [],
  )

  useFrame((_, dt) => {
    uniforms.uTime.value += dt
    uniforms.uVel.value = velocityRef.current
    uniforms.uFlare.value = flareRef.current
    if (meshRef.current) {
      meshRef.current.position.z = camera.position.z - 4
      meshRef.current.position.y = -0.15
    }
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[34, 1.6, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
