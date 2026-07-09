'use client'

/**
 * Hero سینمایی لندینگ — میدان ستاره‌ای Canvas + هالهٔ نور + متن فارسی با reveal
 * بدون هیچ asset خارجی؛ همه‌چیز رویه‌ای (procedural) رندر می‌شود.
 */

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { BrandLogoImage } from '@/components/brand/brand-logo-image'
import { MagneticButton, TextReveal } from './motion'

gsap.registerPlugin(ScrollTrigger, useGSAP)

interface Star {
  x: number
  y: number
  z: number
  r: number
  hue: number
  tw: number
}

interface StarfieldCanvasProps {
  density?: number
  brightness?: number
  className?: string
}

export function StarfieldCanvas({
  density = 1,
  brightness = 1,
  className = 'absolute inset-0 h-full w-full',
}: StarfieldCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let raf = 0
    let stars: Star[] = []
    const pointer = { x: 0.5, y: 0.5 }
    // پالت: بنفش، فیروزه‌ای، طلایی
    const hues = [252, 195, 44]

    const resize = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(420, Math.floor((width * height) / (9000 / density)))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0.25 + Math.random() * 0.75,
        r: 0.6 + Math.random() * 2,
        hue: hues[Math.floor(Math.random() * hues.length)],
        tw: Math.random() * Math.PI * 2,
      }))
    }

    const draw = (t: number): void => {
      ctx.clearRect(0, 0, width, height)
      const px = (pointer.x - 0.5) * 24
      const py = (pointer.y - 0.5) * 24
      for (const s of stars) {
        const twinkle = 0.55 + 0.45 * Math.sin(t * 0.0011 + s.tw)
        const x = s.x + px * s.z
        const y = s.y + py * s.z - (reduced ? 0 : (t * 0.008 * s.z) % height)
        const yy = ((y % height) + height) % height
        ctx.beginPath()
        ctx.arc(x, yy, s.r * s.z, 0, Math.PI * 2)
        const alpha = Math.min(1, 0.58 * twinkle * s.z * brightness)
        ctx.fillStyle = `hsla(${s.hue}, 85%, 78%, ${alpha})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }

    const onPointer = (e: PointerEvent): void => {
      pointer.x = e.clientX / window.innerWidth
      pointer.y = e.clientY / window.innerHeight
    }

    resize()
    window.addEventListener('resize', resize)
    if (!reduced) {
      window.addEventListener('pointermove', onPointer)
      raf = requestAnimationFrame(draw)
    } else {
      draw(0)
      cancelAnimationFrame(raf)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  )
}

export default function LandingHero(): JSX.Element {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!sectionRef.current) return
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduced) return

      // ورود عناصر پایین hero
      gsap.fromTo(
        '[data-hero-fade]',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.14, delay: 0.9, ease: 'power3.out' },
      )

      // خروج سینمایی هنگام اسکرول
      gsap.to('[data-hero-content]', {
        opacity: 0,
        y: -90,
        scale: 0.96,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '75% top',
          scrub: 0.5,
        },
      })
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-transparent"
      aria-label="معرفی هوشاگر"
    >
      {/* پرتوهای طلایی عمودی */}
      <div className="lp-beam right-[18%] top-0 h-full opacity-60" aria-hidden="true" />
      <div className="lp-beam left-[22%] top-0 h-full opacity-40" aria-hidden="true" />

      {/* هالهٔ مرکزی */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[62vmin] w-[62vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(139,124,255,0.22), rgba(84,210,255,0.08) 55%, transparent 72%)',
        }}
        aria-hidden="true"
      />

      <div data-hero-content className="lux-container relative z-10 py-24 text-center">
        <div className="relative mx-auto mb-8 flex justify-center">
          <BrandLogoImage
            alt="لوگوی هوشاگر"
            width={120}
            height={120}
            priority
            className="relative animate-[lp-logo-float_6s_ease-in-out_infinite]"
          />
        </div>

        <div
          data-hero-fade
          className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(201,169,98,0.35)] bg-[rgba(201,169,98,0.08)] px-4 py-1.5 text-xs font-extrabold text-[var(--lux-gold)]"
          style={{ opacity: 0 }}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          سیستم‌عامل هوشمند مدارس ایران
        </div>

        <TextReveal
          text="مدرسه‌ای که آیندهٔ فرزندتان را می‌بیند"
          as="h1"
          className="lux-display mx-auto max-w-4xl"
        />

        <div className="mt-3">
          <TextReveal
            text="با قدرت هوش مصنوعی"
            as="h2"
            gradient
            delay={0.5}
            className="text-[clamp(1.9rem,5.5vw,3.6rem)] font-black leading-tight"
          />
        </div>

        <p
          data-hero-fade
          className="lux-body mx-auto mt-7 max-w-2xl text-balance text-[1.05rem]"
          style={{ opacity: 0 }}
        >
          هوشاگر تحلیل تحصیلی، کشف استعداد، همراه مطالعهٔ هوشمند و گزارش‌های عمیق
          برای والدین را در یک تجربهٔ یکپارچه گرد هم می‌آورد — برای دانش‌آموز، معلم،
          والدین و مدیر مدرسه.
        </p>

        <div
          data-hero-fade
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
          style={{ opacity: 0 }}
        >
          <MagneticButton href="/login" className="lux-btn-accent px-8 text-base">
            ورود به هوشاگر
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </MagneticButton>
          <MagneticButton href="#cinematic" className="lux-btn-ghost px-8 text-base">
            تماشای ویدیو
          </MagneticButton>
        </div>

        <div
          data-hero-fade
          className="mx-auto mt-16 flex max-w-md items-center justify-center gap-8 text-xs font-bold text-[var(--lux-text-muted)]"
          style={{ opacity: 0 }}
        >
          <span>۱۲ قابلیت هوش مصنوعی</span>
          <span className="h-4 w-px bg-[rgba(232,236,244,0.18)]" aria-hidden="true" />
          <span>۴ نقش کاربری</span>
          <span className="h-4 w-px bg-[rgba(232,236,244,0.18)]" aria-hidden="true" />
          <span>فارسی و بومی</span>
        </div>
      </div>

      {/* اشارهٔ اسکرول */}
      <div
        className="absolute bottom-7 left-1/2 -translate-x-1/2 text-[var(--lux-text-muted)]"
        aria-hidden="true"
      >
        <div className="flex h-9 w-5 items-start justify-center rounded-full border border-[rgba(232,236,244,0.25)] p-1">
          <div className="h-2 w-1 animate-bounce rounded-full bg-[var(--lux-gold)]" />
        </div>
      </div>
    </section>
  )
}
