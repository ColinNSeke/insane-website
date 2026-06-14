import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'

import './QantExperience.css'
import { CHAPTERS } from '../data/chapters'
import { clamp01, invlerp, smoothstep } from '../lib/math'
import { computeSceneMotion } from '../lib/sceneMotion'
import { useReducedMotion, useMediaQuery } from '../hooks/useReducedMotion'

import FixedNav from './FixedNav'
import ChapterRail from './ChapterRail'
import ScrollProgress from './ScrollProgress'
import SiteFooter from './SiteFooter'
import StackedFallback from './StackedFallback'
import ChapterText from './ChapterText'

import JourneyBeam from './overlays/JourneyBeam'
import ChipPortal from './overlays/ChipPortal'
import UnfoldLayers from './overlays/UnfoldLayers'
import CardCallouts from './overlays/CardCallouts'
import CorePaths from './overlays/CorePaths'
import ArchitectureLayers from './overlays/ArchitectureLayers'
import DatacenterPaths from './overlays/DatacenterPaths'
import DatacenterMetrics from './overlays/DatacenterMetrics'
import TransformationSplit from './overlays/TransformationSplit'
import LabLaser from './overlays/LabLaser'

gsap.registerPlugin(ScrollTrigger)

export default function QantExperience() {
  const reduced = useReducedMotion()
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Fallback: stacked, readable, static — for reduced motion or mobile.
  if (reduced || isMobile) {
    return <StackedFallback />
  }

  return <PinnedExperience />
}

function PinnedExperience() {
  const progressRef = useRef(0)
  const [active, setActive] = useState(1)
  const lastActiveRef = useRef(1)

  const scrollRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const sceneRefs = useRef<HTMLDivElement[]>([])
  const imgRefs = useRef<HTMLImageElement[]>([])
  const progressFillRef = useRef<HTMLSpanElement>(null)
  const footerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // preload all scene images so crossfades never flash
    CHAPTERS.forEach((c) => {
      const img = new Image()
      img.src = c.asset
    })
  }, [])

  useEffect(() => {
    const applyProgress = (p: number) => {
      CHAPTERS.forEach((c, i) => {
        const m = computeSceneMotion(c.id, p)

        // scene opacity + portal clip (camera-style transitions)
        const scene = sceneRefs.current[i]
        if (scene) {
          scene.style.opacity = String(m.opacity)
          scene.style.clipPath = m.clip ?? 'none'
        }

        // image transform — scale / x(vw) / y(vh) + ch06 micro-jitter
        const img = imgRefs.current[i]
        if (img) {
          let jx = 0
          let jy = 0
          if (c.id === 'transformation') {
            const local = clamp01(invlerp(c.range[0], c.range[1], p))
            if (local > 0.38 && local < 0.46) {
              jx = (Math.random() - 0.5) * 0.08
              jy = (Math.random() - 0.5) * 0.08
            }
          }
          img.style.transform = `translate(calc(${m.x}vw + ${jx}px), calc(${m.y}vh + ${jy}px)) scale(${m.scale})`
        }
      })

      // bottom progress line
      if (progressFillRef.current)
        progressFillRef.current.style.transform = `scaleX(${clamp01(p)})`

      // footer reveal during final chapter (local 0.68 -> 1.0)
      const ch7 = CHAPTERS[6]
      const l7 = clamp01(invlerp(ch7.range[0], ch7.range[1], p))
      if (footerRef.current)
        footerRef.current.style.opacity = String(smoothstep(0.68, 1.0, l7))

      // active rail dot
      let next = 1
      for (const c of CHAPTERS) if (p >= c.range[0]) next = c.index
      if (next !== lastActiveRef.current) {
        lastActiveRef.current = next
        setActive(next)
      }
    }

    // ---- Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    lenis.on('scroll', ScrollTrigger.update)
    const tickerCb = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tickerCb)
    gsap.ticker.lagSmoothing(0)

    // ---- master pinned timeline
    const st = ScrollTrigger.create({
      trigger: scrollRef.current!,
      start: 'top top',
      end: '+=700%',
      scrub: 1.1,
      pin: stageRef.current!,
      anticipatePin: 1,
      onUpdate: (self) => {
        progressRef.current = self.progress
        applyProgress(self.progress)
      },
    })

    applyProgress(0)

    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)
    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 400)

    return () => {
      window.removeEventListener('load', onLoad)
      window.clearTimeout(refreshId)
      st.kill()
      gsap.ticker.remove(tickerCb)
      lenis.destroy()
    }
  }, [])

  return (
    <>
      <FixedNav />
      <ChapterRail active={active} />
      <ScrollProgress ref={progressFillRef} />

      <div ref={scrollRef} className="experience-scroll">
        <div ref={stageRef} className="pinned-stage">
          {/* -------- scene images (z1) */}
          <div className="scene-layer">
            {CHAPTERS.map((c, i) => (
              <div
                key={c.id}
                ref={(el) => {
                  if (el) sceneRefs.current[i] = el
                }}
                className="scene"
              >
                <img
                  ref={(el) => {
                    if (el) imgRefs.current[i] = el
                  }}
                  className="scene__img"
                  src={c.asset}
                  alt=""
                  style={{
                    objectPosition: c.objectPosition,
                    transform: `scale(${c.scaleFrom})`,
                  }}
                  draggable={false}
                />
                <div className="scene__overlays">
                  <div className="scene__base" />
                  <div className="scene__readability" />
                  <div className="scene__vignette" />
                </div>
              </div>
            ))}
          </div>

          {/* -------- persistent connector beam + per-chapter effects */}
          <JourneyBeam progressRef={progressRef} />
          <ChipPortal progressRef={progressRef} />
          <UnfoldLayers progressRef={progressRef} />
          <CardCallouts progressRef={progressRef} range={CHAPTERS[1].range} />
          <CorePaths progressRef={progressRef} range={CHAPTERS[2].range} />
          <ArchitectureLayers progressRef={progressRef} range={CHAPTERS[3].range} />
          <DatacenterPaths progressRef={progressRef} range={CHAPTERS[4].range} />
          <DatacenterMetrics progressRef={progressRef} range={CHAPTERS[4].range} />
          <TransformationSplit progressRef={progressRef} range={CHAPTERS[5].range} />
          <LabLaser progressRef={progressRef} range={CHAPTERS[6].range} />

          {/* -------- chapter text (z40) */}
          <div className="content-layer">
            {CHAPTERS.map((c) => (
              <ChapterText
                key={c.id}
                progressRef={progressRef}
                range={c.range}
                id={c.id}
                eyebrow={c.eyebrow}
                title={c.title}
                body={c.body}
                cta={c.cta}
              />
            ))}
          </div>

          {/* -------- footer (revealed in chapter 07) */}
          <SiteFooter ref={footerRef} />
        </div>
      </div>
    </>
  )
}
