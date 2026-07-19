'use client'

/**
 * ویترین ویدیوی سینمایی — تمام‌صفحه در سکشن خودش
 */

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { brandAssets } from '@/lib/brand'
import { SectionReveal } from './motion'

export function CinematicVideoSection(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const [videoOk, setVideoOk] = useState(false)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (reduceMotion) return
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reduceMotion])

  useEffect(() => {
    if (reduceMotion) return
    const v = videoRef.current
    if (!v) return
    if (inView) {
      v.play().catch(() => setVideoOk(false))
    } else {
      v.pause()
    }
  }, [inView, reduceMotion])

  return (
    <section
      ref={sectionRef}
      id="cinematic"
      className="relative min-h-[100svh] w-full overflow-hidden"
      aria-label="ویترین زنده هوشاگر"
    >
      {/* ویدیوی تمام‌صفحه */}
      <div className="absolute inset-0">
        {!reduceMotion && (
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${videoOk ? 'opacity-100' : 'opacity-0'}`}
            muted
            loop
            playsInline
            preload="metadata"
            onCanPlay={() => setVideoOk(true)}
            onError={() => setVideoOk(false)}
          >
            <source src={brandAssets.heroVideo} type="video/mp4" />
          </video>
        )}

        {(reduceMotion || !videoOk) && (
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(139,124,255,0.28), transparent 62%), var(--lux-void)',
            }}
            aria-hidden="true"
          />
        )}

        {/* تیره‌سازی برای خوانایی متن */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(11,13,18,0.72) 0%, rgba(11,13,18,0.35) 35%, rgba(11,13,18,0.35) 65%, rgba(11,13,18,0.82) 100%)',
          }}
          aria-hidden="true"
        />
      </div>

      {/* متن روی ویدیو */}
      <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-4 py-20 text-center">
        <SectionReveal>
          <p className="lux-kicker lp-kicker-gold mb-4">تجربهٔ بصری</p>
          <h2 className="lux-h2 mx-auto max-w-3xl">
            جهان <span className="lp-gradient-text-animated">هوشاگر</span>
          </h2>
          <p className="lux-body mx-auto mt-5 max-w-xl text-[var(--lux-text-muted)]">
            نگاهی کوتاه به جهانی که آموزش، هوش مصنوعی و مدیریت مدرسه در آن یکی می‌شوند.
          </p>
        </SectionReveal>
      </div>
    </section>
  )
}
