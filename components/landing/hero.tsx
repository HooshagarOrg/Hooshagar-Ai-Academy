'use client'

import { useRef } from 'react'
import dynamic from 'next/dynamic'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { HeroTextReveal, MagneticButton } from '@/components/landing/gsap'
import { HeroSceneStatic } from '@/components/landing/hero-scene'

gsap.registerPlugin(ScrollTrigger)

const HeroScene = dynamic(
  () => import('@/components/landing/hero-scene').then((m) => m.HeroScene),
  {
    ssr: false,
    loading: () => <HeroSceneStatic className="absolute inset-0" />,
  },
)

export function LandingHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useGSAP(
    () => {
      if (!sectionRef.current || reduce) return

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
        },
      })

      if (contentRef.current) {
        tl.to(contentRef.current, { opacity: 0, y: -60, scale: 0.96, ease: 'none' }, 0)
      }
      if (sceneRef.current) {
        tl.to(sceneRef.current, { scale: 1.15, opacity: 0.35, ease: 'none' }, 0)
      }
    },
    { scope: sectionRef, dependencies: [reduce] },
  )

  return (
    <section
      ref={sectionRef}
      className="relative h-[100dvh] min-h-[540px] w-full overflow-hidden"
      aria-label="صفحه اصلی هوشاگر"
    >
      <div ref={sceneRef} className="absolute inset-0">
        <HeroScene className="absolute inset-0" />
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(13,15,20,0.55) 0%, rgba(15,17,23,0.35) 45%, rgba(15,17,23,0.88) 100%)',
        }}
      />

      <div ref={contentRef} className="relative z-10 flex h-full flex-col px-4 sm:px-6">
        <header className="flex items-center justify-between pt-6 sm:pt-8">
          <HooshagarLogo size="sm" href="/" surface="hero" priority showWordmark />
          <nav className="flex gap-2">
            <MagneticButton href="/login" className="lux-btn-ghost min-h-10 px-4 text-sm">
              ورود
            </MagneticButton>
            <MagneticButton href="/register" className="lux-btn-accent hidden min-h-10 px-4 text-sm sm:inline-flex">
              شروع رایگان
            </MagneticButton>
          </nav>
        </header>

        <div className="flex flex-1 flex-col justify-center pb-24 pt-8 text-right">
          <h1 className="lux-display max-w-3xl">
            <HeroTextReveal delay={0.2}>یادگیری هوشمند،</HeroTextReveal>
            <span className="mt-2 block lux-gradient-text-animated">
              <HeroTextReveal delay={0.45}>استعداد بی‌نهایت</HeroTextReveal>
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-[1.9] text-[var(--lux-text-muted)] sm:text-lg">
            <HeroTextReveal delay={0.65}>نسل جدید یادگیری با هوش مصنوعی — برای نوجوانان ایرانی</HeroTextReveal>
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <MagneticButton href="/register" className="lux-btn-accent shadow-[0_0_40px_var(--lux-glow-accent)]">
              شروع تجربه هوشاگر
            </MagneticButton>
            <MagneticButton href="/login" className="lux-btn-ghost border-[rgba(201,169,98,0.25)]">
              ورود به حساب
            </MagneticButton>
          </div>
        </div>

        <button
          type="button"
          onClick={() => document.getElementById('ai-companion')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[var(--lux-text-muted)] transition-colors hover:text-[var(--lux-text)]"
          aria-label="ادامه به بخش بعدی"
        >
          <span className="text-xs font-bold">کشف کنید</span>
          <span className="relative flex h-10 w-6 items-start justify-center rounded-full border border-[rgba(232,236,244,0.2)] p-1">
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </span>
        </button>
      </div>
    </section>
  )
}
