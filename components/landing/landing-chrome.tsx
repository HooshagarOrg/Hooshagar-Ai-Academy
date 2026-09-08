'use client'

/**
 * تزئینات و below-fold — فقط بعد از اسکرول، با import() تا webpack پیش‌بار نکند.
 */

import { useEffect, useState, type ComponentType } from 'react'

type StarfieldProps = {
  density: number
  brightness: number
  className: string
}

function LazyStarfield(): JSX.Element | null {
  const [El, setEl] = useState<ComponentType<StarfieldProps> | null>(null)

  useEffect(() => {
    let cancelled = false
    void import(
      /* webpackPrefetch: false, webpackPreload: false */
      './starfield-canvas'
    ).then((mod) => {
      if (!cancelled) setEl(() => mod.StarfieldCanvas)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!El) return null
  return (
    <El
      density={0.55}
      brightness={1.05}
      className="pointer-events-none fixed inset-0 z-[1] h-full w-full"
    />
  )
}

function LazyScrollProgress(): JSX.Element | null {
  const [El, setEl] = useState<ComponentType<Record<string, never>> | null>(null)

  useEffect(() => {
    let cancelled = false
    void import(
      /* webpackPrefetch: false, webpackPreload: false */
      './scroll-progress'
    ).then((mod) => {
      if (!cancelled) setEl(() => mod.ScrollProgressBar)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!El) return null
  return <El />
}

function LazyBelowFold(): JSX.Element | null {
  const [El, setEl] = useState<ComponentType<Record<string, never>> | null>(null)

  useEffect(() => {
    let cancelled = false
    void import(
      /* webpackPrefetch: false, webpackPreload: false */
      './landing-rest'
    ).then((mod) => {
      if (!cancelled) setEl(() => mod.default)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!El) return <div className="min-h-[70vh]" aria-hidden="true" />
  return <El />
}

export function LandingChrome(): JSX.Element {
  const [enhance, setEnhance] = useState(false)

  useEffect(() => {
    let cancelled = false
    let done = false
    let stopMotion: (() => void) | undefined

    const enable = (): void => {
      if (done) return
      done = true
      document.getElementById('lp-nav')?.classList.add('is-visible')
      setEnhance(true)
      const section = document.querySelector('[data-hero-section]')
      if (section instanceof HTMLElement) {
        void import(
          /* webpackPrefetch: false, webpackPreload: false */
          './hero-motion'
        ).then((mod) => {
          if (!cancelled) stopMotion = mod.runHeroMotion(section)
        })
      }
    }

    const onScroll = (): void => {
      if (window.scrollY > window.innerHeight * 0.7) {
        document.getElementById('lp-nav')?.classList.add('is-visible')
      }
      if (window.scrollY > 48) enable()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelled = true
      stopMotion?.()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      {enhance ? <LazyStarfield /> : null}
      {enhance ? <LazyScrollProgress /> : null}
    </>
  )
}

export function LandingBelowFoldGate(): JSX.Element {
  const [enhance, setEnhance] = useState(false)

  useEffect(() => {
    const enable = (): void => setEnhance(true)
    const onScroll = (): void => {
      if (window.scrollY > 48) enable()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!enhance) {
    return <div className="min-h-[70vh]" aria-hidden="true" />
  }

  return <LazyBelowFold />
}
