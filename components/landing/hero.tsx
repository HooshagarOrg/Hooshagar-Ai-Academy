'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { EASE } from '@/components/landing/motion'

const VIDEO = '/videos/ai-processor-reveal.mp4'

export function LandingHero() {
  const reduce = useReducedMotion()

  return (
    <section className="relative h-[100dvh] min-h-[540px] w-full overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={reduce ? false : { scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2, ease: EASE }}
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        >
          <source src={VIDEO} type="video/mp4" />
        </video>
      </motion.div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(15,17,23,0.88) 0%, rgba(15,17,23,0.42) 48%, rgba(15,17,23,0.82) 100%)',
        }}
      />

      <div className="relative z-10 flex h-full flex-col px-4 sm:px-6">
        <header className="flex items-center justify-between pt-6 sm:pt-8">
          <HooshagarLogo size="sm" href="/" surface="hero" priority showWordmark />
          <nav className="flex gap-2">
            <Link href="/login" className="lux-btn-ghost min-h-10 px-4 text-sm">
              ورود
            </Link>
            <Link href="/register" className="lux-btn-accent hidden min-h-10 px-4 text-sm sm:inline-flex">
              شروع رایگان
            </Link>
          </nav>
        </header>

        <div className="flex flex-1 flex-col justify-center pb-24 pt-8 text-right">
          <motion.h1
            className="lux-display max-w-3xl"
            initial={reduce ? false : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.3, ease: EASE }}
          >
            یادگیری هوشمند،
            <span className="mt-1 block bg-gradient-to-l from-[#8B7CFF] via-[#54D2FF] to-[#FF4DA6] bg-clip-text text-transparent">
              استعداد بی‌نهایت
            </span>
          </motion.h1>

          <motion.p
            className="mt-5 max-w-xl text-base leading-[1.9] text-[#8B95A8] sm:text-lg"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
          >
            نسل جدید یادگیری با هوش مصنوعی — برای نوجوانان ایرانی
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease: EASE }}
          >
            <Link href="/register" className="lux-btn-accent">
              شروع تجربه هوشاگر
            </Link>
            <Link href="/login" className="lux-btn-ghost">
              ورود به حساب
            </Link>
          </motion.div>
        </div>

        <motion.button
          type="button"
          onClick={() => document.getElementById('ai-companion')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-[#8B95A8] hover:text-[#E8ECF4]"
          aria-label="ادامه"
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-xs font-bold">کشف کنید</span>
          <ChevronDown className="h-5 w-5" />
        </motion.button>
      </div>
    </section>
  )
}
