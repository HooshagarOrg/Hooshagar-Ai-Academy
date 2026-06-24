'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Brain, BookOpen, GraduationCap, Heart, BarChart3, Zap,
  Sparkles, Shield, Layers, Target, Camera, Compass,
  MessageSquare, Trophy, ArrowLeft, ChevronDown,
} from 'lucide-react'
import { ChromaticCanvas } from '@/components/ui/chromatic-canvas'
import { ArcBloom } from '@/components/motion/arc-bloom'
import { RolesOrbit } from '@/components/motion/roles-orbit'
import { SpectrumMesh } from '@/components/motion/spectrum-mesh'
import { GlassArc } from '@/components/ui/glass-arc'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { cn } from '@/lib/utils'

const AI_CAPABILITIES = [
  { icon: Brain,        label: 'تحلیلگر هوشمند',  color: '#3B82F6', desc: 'تحلیل عملکرد دانش‌آموز با AI' },
  { icon: Camera,       label: 'حل مسئله OCR',      color: '#10B981', desc: 'تصویر مسئله → راه‌حل گام به گام' },
  { icon: BookOpen,     label: 'دستیار مطالعه',    color: '#F59E0B', desc: 'RAG روی منابع درسی فارسی' },
  { icon: Sparkles,     label: 'قصه‌گو آموزشی',    color: '#EC4899', desc: 'داستان‌های سفارشی برای هر موضوع' },
  { icon: Target,       label: 'آزمون‌ساز',        color: '#EF4444', desc: 'سوال هوشمند از سرفصل‌ها' },
  { icon: BarChart3,    label: 'گزارش والدین',      color: '#14B8A6', desc: 'بینش AI برای خانواده' },
  { icon: Compass,      label: 'مشاور رشته',        color: '#3B82F6', desc: 'انتخاب رشته با هوش مصنوعی' },
  { icon: GraduationCap, label: 'کنکور هوشمند',   color: '#10B981', desc: 'نقشه راه کنکور شخصی‌سازی‌شده' },
  { icon: Layers,       label: 'منظومه دانش',      color: '#F59E0B', desc: 'لایه‌بندی محتوای آموزشی' },
  { icon: MessageSquare, label: 'هوشیار (AI FAB)', color: '#EC4899', desc: 'دستیار زنده فارسی‌زبان' },
  { icon: Trophy,       label: 'باغ استعداد',      color: '#EF4444', desc: 'گیمیفیکیشن و XP' },
  { icon: Zap,          label: 'سوالات شفاهی',     color: '#14B8A6', desc: 'ارزیابی گفتاری AI' },
]

const STATS = [
  { value: '۱۲',    label: 'قابلیت AI' },
  { value: '۱۸+',   label: 'نقش کاربری' },
  { value: '۱۰۰٪',  label: 'فارسی‌محور' },
  { value: '۶',     label: 'لایه fallback' },
]

function FloatingNav({ visible }: { visible: boolean }) {
  return (
    <motion.nav
      className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 py-4"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -12 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <div
        className="mx-auto max-w-5xl h-14 flex items-center justify-between px-5 rounded-full"
        style={{
          background: 'rgba(7,8,14,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <HooshagarLogo size="sm" href="/" showWordmark priority />
        <div className="flex gap-2">
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="px-4 h-9 rounded-full text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              ورود
            </motion.button>
          </Link>
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="btn-spectrum px-5 h-9 rounded-full text-sm font-bold"
            >
              شروع رایگان
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}

export function SpectrumLanding() {
  const rootRef  = useRef<HTMLDivElement>(null)
  const heroRef  = useRef<HTMLElement>(null)
  const reduce   = useReducedMotion()
  const [navVisible, setNavVisible] = useState(false)

  const { scrollYProgress } = useScroll()
  const heroY    = useTransform(scrollYProgress, [0, 0.3], [0, 80])
  const heroFade = useTransform(scrollYProgress, [0, 0.28], [1, 0.2])

  useEffect(() => {
    const fn = () => setNavVisible(window.scrollY > window.innerHeight * 0.5)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    if (reduce || !rootRef.current) return
    gsap.registerPlugin(ScrollTrigger)
    const els = rootRef.current.querySelectorAll('[data-reveal]')
    els.forEach((el, i) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.75,
          delay: i * 0.025,
          ease: 'power3.out',
          immediateRender: false,
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        },
      )
    })
    return () => ScrollTrigger.getAll().forEach((t) => t.kill())
  }, [reduce])

  return (
    <div ref={rootRef} className="relative min-h-app" dir="rtl">
      <ChromaticCanvas mode="immersive" />
      <FloatingNav visible={navVisible} />

      {/* ══════════════════ HERO ══════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-[100dvh] flex items-center overflow-hidden"
      >
        {/* ویدیو پس‌زمینه */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay muted loop playsInline
          style={{ opacity: 0.28 }}
          aria-hidden
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        <div className="hero-video-overlay absolute inset-0" aria-hidden />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full grid lg:grid-cols-2 gap-12 items-center py-20 lg:py-0">
          {/* ArcBloom سمت چپ */}
          <motion.div
            className="flex items-center justify-center order-2 lg:order-1"
            style={{ y: reduce ? 0 : heroY, opacity: reduce ? 1 : heroFade }}
          >
            <ArcBloom className="w-[min(72vw,420px)] h-[min(72vw,420px)]" />
          </motion.div>

          {/* Headline سمت راست */}
          <motion.div
            className="text-right order-1 lg:order-2"
            initial={reduce ? false : { opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs sm:text-sm tracking-[0.2em] text-white/40 mb-4 uppercase font-mono">
              Hooshagar · Chromatic Spectrum
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black leading-[1.1] mb-6">
              <span className="block text-white">هوشاگر</span>
              <span
                className="block mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold leading-snug"
                style={{ WebkitTextStroke: 'unset' }}
              >
                <span className="text-spectrum">سیستم‌عامل</span>
                <span className="text-white/80"> یادگیری</span>
              </span>
              <span className="block text-xl sm:text-2xl lg:text-3xl font-medium text-white/55 mt-2">
                برای مدارس ایران
              </span>
            </h1>

            <p className="text-white/55 text-base sm:text-lg leading-relaxed max-w-lg mb-10">
              هوش مصنوعی فارسی‌محور در کنار هر معلم، دانش‌آموز و والد — 
              از حل مسئله تا گزارش تحلیلی.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-start">
              <Link href="/register">
                <motion.button
                  whileHover={reduce ? undefined : { scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-spectrum w-full sm:w-auto px-8 h-12 rounded-full text-base font-bold flex items-center gap-2 justify-center"
                >
                  <Zap className="w-5 h-5" />
                  شروع رایگان
                </motion.button>
              </Link>
              <Link href="#capabilities">
                <motion.button
                  whileHover={reduce ? undefined : { scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto px-8 h-12 rounded-full text-base font-medium text-white/65 hover:text-white border border-white/10 hover:border-white/20 flex items-center gap-2 justify-center transition-colors"
                >
                  کاوش قابلیت‌ها
                  <ArrowLeft className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-4 gap-3 max-w-xs sm:max-w-sm">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center gap-1 py-3 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="text-lg font-black text-spectrum leading-none">{s.value}</span>
                  <span className="text-[10px] text-white/40 text-center">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30"
          animate={reduce ? {} : { y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* ══════════════════ ROLES ORBIT ══════════════════ */}
      <section className="py-20 sm:py-28 relative overflow-hidden" data-reveal>
        <SpectrumMesh intensity="low" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div data-reveal className="text-center mb-16">
            <p className="text-sm tracking-widest text-white/30 mb-4 uppercase">اکوسیستم یادگیری</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              یک سیستم،{' '}
              <span className="text-spectrum">پنج مدار</span>
            </h2>
            <p className="text-white/45 max-w-xl mx-auto">
              هر نقش کاربری فضای اختصاصی خود را دارد — با رنگ، ابزار و هوش مصنوعی متفاوت
            </p>
          </div>

          <div className="flex justify-center" data-reveal>
            <RolesOrbit className="w-[min(90vw,500px)] h-[min(90vw,500px)]" />
          </div>
        </div>
      </section>

      {/* ══════════════════ AI CAPABILITIES ══════════════════ */}
      <section id="capabilities" className="py-20 sm:py-28 relative" data-reveal>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div data-reveal className="text-center mb-16">
            <p className="text-sm tracking-widest text-white/30 mb-4 uppercase">هوش مصنوعی</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              دوازده ستاره{' '}
              <span className="text-spectrum">AI</span>
            </h2>
            <p className="text-white/45 max-w-xl mx-auto">
              از تصویر مسئله تا گزارش تحلیلی — همه با Gemini و fallback چندلایه
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {AI_CAPABILITIES.map((cap, i) => {
              const Icon = cap.icon
              return (
                <div key={cap.label} data-reveal>
                  <motion.div
                    className="h-full p-4 rounded-2xl flex flex-col gap-3 cursor-default"
                    style={{
                      background: 'rgba(12,13,21,0.75)',
                      border: `1px solid ${cap.color}25`,
                      backdropFilter: 'blur(12px)',
                    }}
                    whileHover={reduce ? undefined : {
                      scale: 1.03,
                      borderColor: `${cap.color}55`,
                      boxShadow: `0 8px 32px ${cap.color}20`,
                    }}
                    transition={{ duration: 0.22 }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${cap.color}18`, border: `1px solid ${cap.color}30` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: cap.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-snug">{cap.label}</p>
                      <p className="text-xs text-white/40 mt-1 leading-relaxed">{cap.desc}</p>
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════ PROOF ══════════════════ */}
      <section className="py-20 sm:py-24 relative" data-reveal>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Shield,       color: '#3B82F6', title: 'امنیت مدرسه‌ای',  body: 'RLS چندلایه، JWT در httpOnly cookie، Rate Limiting — اطلاعات دانش‌آموز هرگز بیرون نمی‌رود' },
              { icon: Zap,          color: '#10B981', title: 'زیرساخت ایرانی', body: 'Cloudflare Workers بین مدرسه و سرور — بدون تأخیر فیلترینگ، با کش هوشمند' },
              { icon: Sparkles,     color: '#EC4899', title: 'فارسی‌محور واقعی', body: 'نه ترجمه — Vazirmatn، RTL نیتیو، تقویم شمسی، فرهنگ کلاس ایرانی' },
            ].map((c) => {
              const Icon = c.icon
              return (
                <div key={c.title} data-reveal>
                  <GlassArc className="h-full p-6 flex flex-col gap-4" style={{ ['--role-accent-r' as string]: 'initial' } as React.CSSProperties}>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: `${c.color}18`, border: `1px solid ${c.color}30` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: c.color }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">{c.title}</h3>
                      <p className="text-sm text-white/50 leading-relaxed">{c.body}</p>
                    </div>
                  </GlassArc>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA ══════════════════ */}
      <section className="py-24 pb-32 relative overflow-hidden" data-reveal>
        <SpectrumMesh intensity="high" />
        <div className="max-w-2xl mx-auto px-4 text-center relative z-10">
          <motion.div
            data-reveal
            className="p-10 sm:p-14 rounded-3xl"
            style={{
              background: 'rgba(12,13,21,0.78)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
            }}
          >
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              مدرسه‌ات را به{' '}
              <span className="text-spectrum">مدار بعدی</span>{' '}
              ببر
            </h2>
            <p className="text-white/50 mb-8 leading-relaxed">
              نصب آسان · پشتیبانی فارسی · ۱۲ قابلیت AI · رایگان شروع کن
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <motion.button
                  whileHover={reduce ? undefined : { scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-spectrum w-full sm:w-auto px-10 h-12 rounded-full text-base font-bold flex items-center gap-2 justify-center"
                >
                  <Zap className="w-5 h-5" />
                  شروع رایگان
                </motion.button>
              </Link>
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full sm:w-auto px-10 h-12 rounded-full text-base font-medium text-white/60 border border-white/10 hover:border-white/25 hover:text-white flex items-center justify-center transition-colors"
                >
                  ورود به حساب
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer
        className="border-t py-10 text-center text-sm text-white/25"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        © {new Date().getFullYear()} هوشاگر — Chromatic Spectrum
      </footer>
    </div>
  )
}
