'use client'

/**
 * Primitives انیمیشن لندینگ — GSAP + ScrollTrigger
 * همه کامپوننت‌ها prefers-reduced-motion را رعایت می‌کنند.
 */

import {
  createElement,
  useCallback,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/* ── نوار پیشرفت اسکرول ── */
export function ScrollProgressBar(): JSX.Element {
  const barRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (prefersReducedMotion() || !barRef.current) return
    gsap.to(barRef.current, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.4 },
    })
  })

  return (
    <div className="fixed inset-x-0 top-0 z-[70] h-[3px]" aria-hidden="true">
      <div
        ref={barRef}
        className="h-full origin-right"
        style={{
          transform: 'scaleX(0)',
          background:
            'linear-gradient(90deg, var(--lux-gold), var(--lux-primary), var(--lux-secondary))',
        }}
      />
    </div>
  )
}

/* ── نمایان‌شدن سکشن هنگام اسکرول ── */
interface SectionRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}

export function SectionReveal({
  children,
  className,
  delay = 0,
  y = 56,
}: SectionRevealProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      if (prefersReducedMotion()) {
        gsap.set(ref.current, { opacity: 1, y: 0 })
        return
      }
      gsap.fromTo(
        ref.current,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          delay,
          ease: 'power3.out',
          scrollTrigger: { trigger: ref.current, start: 'top 82%', once: true },
        },
      )
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  )
}

/* ── نمایان‌شدن پلکانی فرزندان ── */
interface StaggerRevealProps {
  children: ReactNode
  className?: string
  stagger?: number
}

export function StaggerReveal({
  children,
  className,
  stagger = 0.12,
}: StaggerRevealProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      const items = Array.from(ref.current.children)
      if (items.length === 0) return
      if (prefersReducedMotion()) {
        gsap.set(items, { opacity: 1, y: 0 })
        return
      }
      gsap.fromTo(
        items,
        { opacity: 0, y: 44 },
        {
          opacity: 1,
          y: 0,
          duration: 0.95,
          stagger,
          ease: 'power3.out',
          scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
        },
      )
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

/* ── نمایش کلمه‌به‌کلمهٔ متن (سینمایی) ── */
interface TextRevealProps {
  text: string
  as?: 'h1' | 'h2' | 'p' | 'span'
  className?: string
  delay?: number
  gradient?: boolean
}

export function TextReveal({
  text,
  as = 'h1',
  className,
  delay = 0,
  gradient = false,
}: TextRevealProps): JSX.Element {
  const ref = useRef<HTMLElement>(null)
  const words = text.split(' ')

  useGSAP(
    () => {
      if (!ref.current) return
      const spans = ref.current.querySelectorAll<HTMLSpanElement>('[data-word]')
      if (prefersReducedMotion()) {
        gsap.set(spans, { opacity: 1, y: 0, rotateX: 0 })
        return
      }
      gsap.fromTo(
        spans,
        { opacity: 0, y: '110%', rotateX: -45 },
        {
          opacity: 1,
          y: '0%',
          rotateX: 0,
          duration: 1.15,
          delay,
          stagger: 0.09,
          ease: 'power4.out',
        },
      )
    },
    { scope: ref },
  )

  return createElement(
    as,
    { ref, className, dir: 'rtl' },
    words.map((word, i) => (
      <span
        key={`${word}-${i}`}
        className="inline-block overflow-hidden pb-[0.12em] align-bottom"
        style={{ perspective: '600px' }}
      >
        <span
          data-word
          className={`inline-block will-change-transform ${gradient ? 'lp-gradient-text-animated' : ''}`}
          style={{ opacity: 0 }}
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      </span>
    )),
  )
}

/* ── شمارندهٔ درخشان ── */
interface GlowCounterProps {
  value: number
  suffix?: string
  className?: string
  duration?: number
}

export function GlowCounter({
  value,
  suffix = '',
  className,
  duration = 2,
}: GlowCounterProps): JSX.Element {
  const ref = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      const el = ref.current
      const format = (n: number): string =>
        `${Math.round(n).toLocaleString('fa-IR')}${suffix}`
      if (prefersReducedMotion()) {
        el.textContent = format(value)
        return
      }
      const state = { n: 0 }
      gsap.to(state, {
        n: value,
        duration,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        onUpdate: () => {
          el.textContent = format(state.n)
        },
      })
    },
    { scope: ref },
  )

  return (
    <span ref={ref} className={className}>
      {(0).toLocaleString('fa-IR')}
      {suffix}
    </span>
  )
}

/* ── دکمهٔ مغناطیسی ── */
interface MagneticButtonProps {
  children: ReactNode
  className?: string
  href: string
  strength?: number
}

export function MagneticButton({
  children,
  className,
  href,
  strength = 0.3,
}: MagneticButtonProps): JSX.Element {
  const ref = useRef<HTMLAnchorElement>(null)

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>): void => {
      if (prefersReducedMotion() || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width / 2) * strength
      const y = (e.clientY - rect.top - rect.height / 2) * strength
      gsap.to(ref.current, { x, y, duration: 0.4, ease: 'power3.out' })
    },
    [strength],
  )

  const handleLeave = useCallback((): void => {
    if (!ref.current) return
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
  }, [])

  return (
    <a
      ref={ref}
      href={href}
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </a>
  )
}

/* ── کارت سه‌بعدی با tilt ── */
interface TiltCardProps {
  children: ReactNode
  className?: string
  maxTilt?: number
  style?: CSSProperties
}

export function TiltCard({
  children,
  className,
  maxTilt = 7,
  style,
}: TiltCardProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      if (prefersReducedMotion() || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      ref.current.style.setProperty('--glare-x', `${px * 100}%`)
      ref.current.style.setProperty('--glare-y', `${py * 100}%`)
      gsap.to(ref.current, {
        rotateY: (px - 0.5) * maxTilt * 2,
        rotateX: (0.5 - py) * maxTilt * 2,
        duration: 0.5,
        ease: 'power2.out',
        transformPerspective: 900,
      })
    },
    [maxTilt],
  )

  const handleLeave = useCallback((): void => {
    if (!ref.current) return
    gsap.to(ref.current, { rotateX: 0, rotateY: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)' })
  }, [])

  return (
    <div
      ref={ref}
      className={`lp-tilt relative ${className ?? ''}`}
      style={style}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
      <span className="lp-tilt-glare" aria-hidden="true" />
    </div>
  )
}

/* ── لایهٔ پارالاکس ── */
interface ParallaxLayerProps {
  children: ReactNode
  className?: string
  speed?: number
}

export function ParallaxLayer({
  children,
  className,
  speed = 0.2,
}: ParallaxLayerProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return
      gsap.to(ref.current, {
        yPercent: speed * -100,
        ease: 'none',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
        },
      })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
