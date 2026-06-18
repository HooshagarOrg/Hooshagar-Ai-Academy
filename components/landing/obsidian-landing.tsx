'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowLeft,
  Brain,
  BookOpen,
  GraduationCap,
  Heart,
  Sparkles,
  Shield,
  BarChart3,
  Zap,
  Layers,
  Orbit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MeridianOrb } from '@/components/motion/meridian-orb'
import { LuxurySlab } from '@/components/motion/luxury-slab'
import { ObsidianCanvas } from '@/components/ui/obsidian-canvas'
import { cn } from '@/lib/utils'

const CAPABILITIES = [
  {
    icon: Brain,
    title: 'هوشیار',
    tag: 'دستیار زنده',
    desc: 'همراه AI که فارسی آموزش را می‌فهمد — نه ترجمه، بلکه درک فرهنگ کلاس.',
    glow: 'gold' as const,
  },
  {
    icon: Layers,
    title: 'منظومه دانش',
    tag: 'لایه‌بندی هوشمند',
    desc: 'منابع، درس‌ها و گزارش‌ها در عمق‌های مختلف — مثل طبقات یک رصدخانه.',
    glow: 'sapphire' as const,
  },
  {
    icon: Shield,
    title: 'امنیت مرمرین',
    tag: 'اعتماد مدرسه',
    desc: 'RLS، احراز چندلایه و حفاظت داده — آرامش مدیر و خانواده.',
    glow: 'gold' as const,
  },
]

const ROLES = [
  { icon: GraduationCap, name: 'دانش‌آموز', hue: 'from-blue-600/40 to-indigo-900/20' },
  { icon: BookOpen, name: 'معلم', hue: 'from-cyan-600/35 to-blue-900/20' },
  { icon: Heart, name: 'والدین', hue: 'from-teal-600/35 to-slate-900/20' },
  { icon: BarChart3, name: 'مدیر', hue: 'from-violet-600/35 to-indigo-900/20' },
]

function FloatingNav({ show }: { show: boolean }) {
  return (
    <motion.nav
      className={cn(
        'fixed top-0 inset-x-0 z-50 pt-safe px-4 sm:px-6 py-4 transition-all duration-700',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6 pointer-events-none',
      )}
      initial={false}
    >
      <div className="mx-auto max-w-5xl obsidian-slab obsidian-slab-gold h-14 flex items-center justify-between px-5 rounded-full">
        <span className="font-bold tracking-tight text-luxury-shimmer">هوشاگر</span>
        <div className="flex gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              ورود
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="luxury" size="sm">
              شروع
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}

export function ObsidianLanding() {
  const reduce = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const [navShow, setNavShow] = useState(false)

  const { scrollYProgress } = useScroll()
  const heroParallax = useTransform(scrollYProgress, [0, 0.35], [0, 120])
  const heroFade = useTransform(scrollYProgress, [0, 0.25], [1, 0.15])

  useEffect(() => {
    const fn = () => setNavShow(window.scrollY > window.innerHeight * 0.55)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    if (reduce || !rootRef.current) return
    gsap.registerPlugin(ScrollTrigger)
    const items = rootRef.current.querySelectorAll('[data-rise]')
    items.forEach((el, i) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 64, rotateX: 8 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 1,
          delay: i * 0.04,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        },
      )
    })
    return () => ScrollTrigger.getAll().forEach((t) => t.kill())
  }, [reduce])

  return (
    <div ref={rootRef} className="relative min-h-app">
      <ObsidianCanvas mode="immersive" />
      <FloatingNav show={navShow} />

      {/* Hero — نامتقارن، سینمایی */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden pt-safe"
      >
        <div className="absolute inset-0 meridian-thread" aria-hidden />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full grid lg:grid-cols-2 gap-10 lg:gap-6 items-center py-16 lg:py-0">
          <motion.div style={{ y: reduce ? 0 : heroParallax, opacity: reduce ? 1 : heroFade }}>
            <MeridianOrb />
          </motion.div>

          <motion.div
            className="text-center lg:text-right order-first lg:order-last"
            initial={reduce ? false : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs sm:text-sm tracking-[0.2em] text-amber-400/70 mb-5 uppercase">
              Obsidian Meridian
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-black leading-[1.12] mb-6">
              <span className="block text-luxury-shimmer">هوشاگر</span>
              <span className="block text-foreground/90 text-2xl sm:text-3xl lg:text-4xl font-bold mt-3">
                جایی که دانش
                <span className="text-amber-300/90"> می‌درخشد</span>
              </span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 lg:mr-0 mb-10">
              سیستم‌عامل یادگیری برای مدارس ایران — با عمق سه‌بعدی، سایه‌های مرمرین و هوشیاری که شب و روز همراهتان است.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/login">
                <Button size="lg" variant="luxury" className="w-full sm:w-auto px-10 h-12 shadow-luxury-gold">
                  <Zap className="w-5 h-5" />
                  ورود به منظومه
                </Button>
              </Link>
              <Link href="#capabilities">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-10 h-12 border-amber-400/25">
                  کاوش عمق‌ها
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0 lg:mr-0">
              {[
                { v: '۱۲', l: 'AI' },
                { v: '۱۸+', l: 'نقش' },
                { v: '۱۰۰٪', l: 'فارسی' },
              ].map((s) => (
                <div key={s.l} className="obsidian-stat-chip">
                  <span className="text-xl font-black text-luxury-shimmer">{s.v}</span>
                  <span className="text-[10px] text-muted-foreground">{s.l}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Capabilities — تخته‌های شناور */}
      <section id="capabilities" className="py-28 sm:py-36 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div data-rise className="text-center mb-16">
            <Orbit className="w-8 h-8 text-amber-400/60 mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-black mb-3">سه لایهٔ اعتماد</h2>
            <p className="text-muted-foreground">نه قالب SaaS — معماری بصری اختصاصی هوشاگر</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 md:perspective-[1200px]">
            {CAPABILITIES.map((c, i) => (
              <div key={c.title} data-rise style={{ transform: `translateZ(${i * 20}px)` }}>
                <LuxurySlab depth={i + 1} glow={c.glow} className="h-full">
                  <c.icon className="w-7 h-7 text-amber-300/80 mb-4" />
                  <span className="text-[10px] tracking-widest text-amber-400/60">{c.tag}</span>
                  <h3 className="text-xl font-bold mt-2 mb-3">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </LuxurySlab>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI constellation */}
      <section className="py-28 relative overflow-hidden" data-rise>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <LuxurySlab glow="sapphire" className="lg:-rotate-1">
            <p className="text-xs text-blue-300/70 mb-2">منظومه هوش</p>
            <h2 className="text-2xl sm:text-3xl font-black mb-4">
              دوازده ستارهٔ AI
              <span className="block text-amber-300/80 text-lg mt-2">در مدار یادگیری شما</span>
            </h2>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              {['تحلیلگر', 'OCR', 'RAG', 'قصه‌گو', 'آزمون‌ساز', 'گزارش والدین', 'مشاور رشته', 'کنکور'].map(
                (t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400/70" />
                    {t}
                  </span>
                ),
              )}
            </div>
          </LuxurySlab>

          <div className="relative h-[280px] sm:h-[320px]">
            {!reduce &&
              [0, 1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className="absolute obsidian-constellation-node"
                  style={{
                    left: `${15 + (i % 3) * 32}%`,
                    top: `${10 + Math.floor(i / 3) * 38}%`,
                  }}
                  animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.4 }}
                />
              ))}
          </div>
        </div>
      </section>

      {/* Roles — فن ۳D */}
      <section className="py-28 sm:py-36" data-rise>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black text-center mb-12">هر نقش، یک مدار</h2>
          <div className="flex flex-wrap justify-center gap-4 perspective-[900px]">
            {ROLES.map((r, i) => (
              <motion.div
                key={r.name}
                className={cn(
                  'obsidian-role-card bg-gradient-to-br px-6 py-5 rounded-2xl min-w-[140px] text-center',
                  r.hue,
                )}
                whileHover={reduce ? undefined : { rotateY: 8, z: 40, scale: 1.04 }}
                style={{ rotateY: i * 4 - 6 }}
              >
                <r.icon className="w-6 h-6 mx-auto mb-2 text-white/90" />
                <span className="font-bold text-sm">{r.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 pb-36" data-rise>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <LuxurySlab glow="gold" className="py-12 sm:py-16">
            <h2 className="text-3xl font-black mb-4">مدرسه‌ات را به مدار بعدی ببر</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              نصب آسان · پشتیبانی فارسی · تجربه‌ای که شبیه هیچ‌کس نیست
            </p>
            <Link href="/login">
              <Button size="lg" variant="luxury" className="px-12 h-12 shadow-luxury-gold">
                شروع رایگان
              </Button>
            </Link>
          </LuxurySlab>
        </div>
      </section>

      <footer className="border-t border-white/[0.05] py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} هوشاگر — Obsidian Meridian
      </footer>
    </div>
  )
}
