'use client'

/**
 * ناوبری، ستاره و GSAP — فقط بعد از اسکرول تا LCP هیرو را نگیرند.
 */

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'

const StarfieldCanvas = dynamic(
  () => import('./starfield-canvas').then((m) => m.StarfieldCanvas),
  { ssr: false },
)

const LandingBelowFold = dynamic(() => import('./landing-rest'), {
  ssr: false,
  loading: () => <div className="min-h-[70vh]" aria-hidden="true" />,
})

const ScrollProgressBar = dynamic(
  () => import('./scroll-progress').then((m) => m.ScrollProgressBar),
  { ssr: false },
)

function FloatingNav(): JSX.Element {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = (): void => {
      setVisible(window.scrollY > window.innerHeight * 0.7)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`lp-nav ${visible ? 'is-visible' : ''}`} aria-label="ناوبری اصلی">
      <HooshagarLogo
        size="sm"
        href="/"
        inverted
        showWordmark
        showImage={visible}
      />
      <div className="hidden items-center gap-5 text-sm font-bold text-[var(--lux-text-muted)] sm:flex">
        <a href="#cinematic" className="transition-colors hover:text-[var(--lux-text)]">
          جهان
        </a>
        <a href="#insights" className="transition-colors hover:text-[var(--lux-text)]">
          بینش
        </a>
        <a href="#hooshiar" className="transition-colors hover:text-[var(--lux-text)]">
          هوشیار
        </a>
        <a href="#features" className="transition-colors hover:text-[var(--lux-text)]">
          قابلیت‌ها
        </a>
        <a href="#roles" className="transition-colors hover:text-[var(--lux-text)]">
          نقش‌ها
        </a>
      </div>
      <a
        href="/login"
        className="rounded-full bg-[var(--lux-primary)] px-4 py-1.5 text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5"
      >
        ورود
      </a>
    </nav>
  )
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
      setEnhance(true)
      const section = document.querySelector('[data-hero-section]')
      if (section instanceof HTMLElement) {
        void import('./hero-motion').then((mod) => {
          if (!cancelled) stopMotion = mod.runHeroMotion(section)
        })
      }
    }
    const onScroll = (): void => {
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
      {enhance ? (
        <StarfieldCanvas
          density={0.55}
          brightness={1.05}
          className="pointer-events-none fixed inset-0 z-[1] h-full w-full"
        />
      ) : null}
      {enhance ? <ScrollProgressBar /> : null}
      <FloatingNav />
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

  return <LandingBelowFold />
}
