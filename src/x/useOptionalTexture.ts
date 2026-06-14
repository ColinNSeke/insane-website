import { useEffect, useState } from 'react'
import * as THREE from 'three'

const loader = new THREE.TextureLoader()

/**
 * Loads a texture but never suspends or throws: returns `null` until loaded,
 * and stays `null` if the URL 404s (used for optional depth maps).
 */
export function useOptionalTexture(url: string): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let alive = true
    loader.load(
      url,
      (t) => {
        if (!alive) return
        t.colorSpace = THREE.NoColorSpace
        setTex(t)
      },
      undefined,
      () => {
        /* missing — silently fall back */
      },
    )
    return () => {
      alive = false
    }
  }, [url])

  return tex
}

/** Same, but for required colour textures (sRGB). */
export function useColorTexture(url: string): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let alive = true
    loader.load(
      url,
      (t) => {
        if (!alive) return
        t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = 4
        setTex(t)
      },
      undefined,
      () => {
        // surface missing section textures loudly
        console.warn(`[x] section texture failed to load: ${url}`)
      },
    )
    return () => {
      alive = false
    }
  }, [url])

  return tex
}
