import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Lenis from '@studio-freight/lenis'
import './chip.css'
import Scene from './Scene'
import Overlay from './Overlay'
import { useMediaQuery, useReducedMotion } from '../hooks/useReducedMotion'

/**
 * Self-contained fullscreen WebGL scroll experience mounted at /x.
 * A single scroll-progress value drives a camera dolly through textured,
 * depth-displaced section planes following a live light beam.
 */
export default function ChipExperience() {
  const progressRef = useRef(0)
  const velocityRef = useRef(0)
  const mobile = useMediaQuery('(max-width: 768px)')
  const reduced = useReducedMotion()

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
    })

    let lastP = 0
    let raf = 0
    const loop = (t: number) => {
      lenis.raf(t)
      const p = lenis.progress || 0
      progressRef.current = p
      // velocity from per-frame progress delta; eases up fast, decays smooth
      const target = Math.min(1, Math.abs(p - lastP) / 0.006)
      velocityRef.current += (target - velocityRef.current) * 0.5
      lastP = p
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])

  return (
    <div className="x-root">
      <div className="x-canvas">
        <Canvas
          dpr={mobile ? [1, 1.5] : [1, 2]}
          gl={{ antialias: !mobile, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, 6], fov: 55, near: 0.1, far: 200 }}
          frameloop={reduced ? 'demand' : 'always'}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 0.9
          }}
        >
          <Scene progressRef={progressRef} velocityRef={velocityRef} mobile={mobile} />
        </Canvas>
      </div>

      <Overlay progressRef={progressRef} />

      {/* tall scroll track creates the scroll distance for the journey */}
      <div className="x-scroll-track" aria-hidden="true" />
    </div>
  )
}
