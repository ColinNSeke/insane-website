import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  count: number
  /** total journey length in Z so particles wrap around the path */
  depth: number
}

/**
 * Drifting photons in the volumetric light. They wrap around the camera so the
 * field is always populated, and stream slightly faster with the beam.
 */
export default function Particles({ count, depth }: Props) {
  const pointsRef = useRef<THREE.Points>(null)
  const { camera } = useThree()

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 26
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12
      positions[i * 3 + 2] = -Math.random() * depth
      speeds[i] = 0.2 + Math.random() * 0.8
    }
    return { positions, speeds }
  }, [count, depth])

  const sprite = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(220,240,255,1)')
    g.addColorStop(0.3, 'rgba(150,200,255,0.6)')
    g.addColorStop(1, 'rgba(120,180,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
    const t = new THREE.CanvasTexture(c)
    return t
  }, [])

  useFrame((_, dt) => {
    const pts = pointsRef.current
    if (!pts) return
    const arr = pts.geometry.attributes.position.array as Float32Array
    const camZ = camera.position.z
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] += Math.sin((arr[i * 3 + 2] + camZ) * 0.3) * dt * 0.15
      arr[i * 3 + 1] += dt * speeds[i] * 0.25
      // wrap within a window around the camera
      if (arr[i * 3 + 1] > 6) arr[i * 3 + 1] = -6
      const rel = arr[i * 3 + 2] - camZ
      if (rel > 4) arr[i * 3 + 2] -= depth
      if (rel < -depth) arr[i * 3 + 2] += depth
    }
    pts.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        size={0.12}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.85}
      />
    </points>
  )
}
