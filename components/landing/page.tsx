'use client'

/**
 * لندینگ‌پیج هوشاگر — هیرو سبک؛ GSAP و بقیهٔ صفحه فقط بعد از اسکرول
 */

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { AmbientVectors } from './ambient-vectors'
import LandingHero from './hero'

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

function useScrolledPastHero(): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const enable = (): void => setReady(true)
    const onScroll = (): void => {
      if (window.scrollY > 48) enable()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return ready
}

function useIdlePaint(): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const enable = (): void => setReady(true)
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(enable)
    })
    return () => window.cancelAnimationFrame(raf)
  }, [])

  return ready
}

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
      <HooshagarLogo size="sm" href="/" inverted showWordmark priority />
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

export default function LandingPage(): JSX.Element {
  const belowFold = useScrolledPastHero()
  const stars = useIdlePaint()

  return (
    <main
      id="main-content"
      className="lp-noise lp-aurora relative overflow-hidden"
      dir="rtl"
      style={{ background: 'var(--lux-void)' }}
    >
      {stars ? (
        <StarfieldCanvas
          density={0.55}
          brightness={1.05}
          className="pointer-events-none fixed inset-0 z-[1] h-full w-full"
        />
      ) : null}
      <AmbientVectors />
      {belowFold ? <ScrollProgressBar /> : null}
      <FloatingNav />
      <div className="relative z-10">
        <LandingHero />
        {belowFold ? (
          <LandingBelowFold />
        ) : (
          <div className="min-h-[70vh]" aria-hidden="true" />
        )}
      </div>
    </main>
  )
}
