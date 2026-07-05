'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import {
  useRef,
  useState,
  useCallback,
  createElement,
  type ReactNode,
  type MouseEvent,
} from 'react'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

export const EASE = 'power3.out'
export const EASE_SMOOTH = 'power2.inOut'

export function TextReveal({
  children,
  className,
  as: Tag = 'div',
  delay = 0,
  split = 'words',
}: {
  children: string
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div' | 'span'
  delay?: number
  split?: 'words' | 'lines'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  const parts =
    split === 'lines'
      ? children.split('\n')
      : children.split(/(\s+)/).filter((p) => p.trim().length > 0)

  useGSAP(
    () => {
      if (!ref.current || reduce) return
      const targets = ref.current.querySelectorAll('[data-reveal-part]')
      gsap.fromTo(
        targets,
        { opacity: 0, y: 28, filter: 'blur(6px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.75,
          stagger: split === 'lines' ? 0.12 : 0.06,
          delay,
          ease: EASE,
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        },
      )
    },
    { scope: ref, dependencies: [reduce, children, delay, split] },
  )

  const content = parts.map((part, i) => (
    <span
      key={`${part}-${i}`}
      data-reveal-part
      className={cn('inline-block', !reduce && 'opacity-0')}
      style={{ marginInlineEnd: split === 'words' ? '0.28em' : undefined }}
    >
      {part}
    </span>
  ))

  if (reduce) {
    return createElement(Tag, { className }, children)
  }

  return createElement(Tag, { ref, className }, content)
}

export function HeroTextReveal({
  children,
  className,
  delay = 0,
}: {
  children: string
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const parts = children.split(/(\s+)/).filter((p) => p.trim().length > 0)

  useGSAP(
    () => {
      if (!ref.current || reduce) return
      const targets = ref.current.querySelectorAll('[data-hero-part]')
      gsap.fromTo(
        targets,
        { opacity: 0, y: 36, filter: 'blur(8px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.85,
          stagger: 0.08,
          delay,
          ease: EASE,
        },
      )
    },
    { scope: ref, dependencies: [reduce, children, delay] },
  )

  if (reduce) {
    return <span className={className}>{children}</span>
  }

  return (
    <span ref={ref} className={className}>
      {parts.map((part, i) => (
        <span key={`${part}-${i}`} data-hero-part className="inline-block opacity-0" style={{ marginInlineEnd: '0.28em' }}>
          {part}
        </span>
      ))}
    </span>
  )
}

export function SectionReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useGSAP(
    () => {
      if (!ref.current || reduce) return
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          delay,
          ease: EASE,
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        },
      )
    },
    { scope: ref, dependencies: [reduce, delay] },
  )

  return (
    <div ref={ref} className={cn(reduce ? undefined : 'opacity-0', className)}>
      {children}
    </div>
  )
}

export function StaggerReveal({
  children,
  className,
  stagger = 0.12,
}: {
  children: ReactNode
  className?: string
  stagger?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useGSAP(
    () => {
      if (!ref.current || reduce) return
      const items = ref.current.querySelectorAll('[data-stagger-item]')
      gsap.fromTo(
        items,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger,
          ease: EASE,
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 82%',
            toggleActions: 'play none none none',
          },
        },
      )
    },
    { scope: ref, dependencies: [reduce, stagger] },
  )

  return <div ref={ref} className={className}>{children}</div>
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <div data-stagger-item className={cn(!reduce && 'opacity-0', className)}>
      {children}
    </div>
  )
}

export function ParallaxLayer({
  children,
  className,
  speed = 0.3,
}: {
  children: ReactNode
  className?: string
  speed?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useGSAP(
    () => {
      if (!ref.current || reduce) return
      gsap.to(ref.current, {
        y: () => -speed * 120,
        ease: 'none',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
    },
    { scope: ref, dependencies: [reduce, speed] },
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

export function MagneticButton({
  children,
  className,
  href,
  onClick,
  strength = 0.35,
}: {
  children: ReactNode
  className?: string
  href?: string
  onClick?: () => void
  strength?: number
}) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  const handleMove = useCallback(
    (e: MouseEvent) => {
      if (!ref.current || reduce) return
      const rect = ref.current.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      gsap.to(ref.current, {
        x: x * strength,
        y: y * strength,
        duration: 0.35,
        ease: EASE_SMOOTH,
      })
    },
    [reduce, strength],
  )

  const handleLeave = useCallback(() => {
    if (!ref.current || reduce) return
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.5, ease: EASE_SMOOTH })
  }, [reduce])

  const handlers = {
    onMouseMove: handleMove,
    onMouseLeave: handleLeave,
  }

  if (href) {
    return (
      <Link
        href={href}
        ref={ref as React.RefObject<HTMLAnchorElement>}
        className={cn('relative inline-flex cursor-pointer', className)}
        {...handlers}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      type="button"
      ref={ref as React.RefObject<HTMLButtonElement>}
      onClick={onClick}
      className={cn('relative inline-flex cursor-pointer', className)}
      {...handlers}
    >
      {children}
    </button>
  )
}

export function TiltCard({
  children,
  className,
  maxTilt = 12,
}: {
  children: ReactNode
  className?: string
  maxTilt?: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  const handleMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current || reduce) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      const rotY = (x - 0.5) * maxTilt * 2
      const rotX = (0.5 - y) * maxTilt * 2

      gsap.to(cardRef.current, {
        rotateX: rotX,
        rotateY: -rotY,
        transformPerspective: 900,
        duration: 0.4,
        ease: EASE_SMOOTH,
      })

      if (glareRef.current) {
        glareRef.current.style.setProperty('--glare-x', `${x * 100}%`)
        glareRef.current.style.setProperty('--glare-y', `${y * 100}%`)
      }
    },
    [reduce, maxTilt],
  )

  const handleLeave = useCallback(() => {
    if (!cardRef.current || reduce) return
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.6,
      ease: EASE_SMOOTH,
    })
  }, [reduce])

  return (
    <div
      ref={cardRef}
      className={cn('lux-tilt-card relative', className)}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div ref={glareRef} className="lux-tilt-card-glare" aria-hidden />
      {children}
    </div>
  )
}

export function GlowCounter({
  value,
  suffix = '',
  className,
}: {
  value: number
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(reduce ? value : 0)

  useGSAP(
    () => {
      if (!ref.current || reduce) {
        setDisplay(value)
        return
      }

      const obj = { val: 0 }
      gsap.to(obj, {
        val: value,
        duration: 2.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
        onUpdate: () => setDisplay(Math.round(obj.val)),
      })
    },
    { scope: ref, dependencies: [value, reduce] },
  )

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString('fa-IR')}
      {suffix}
    </span>
  )
}

export function ScrollProgressBar({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useGSAP(
    () => {
      if (!ref.current || reduce) return
      gsap.fromTo(
        ref.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: document.documentElement,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.3,
          },
        },
      )
    },
    { dependencies: [reduce] },
  )

  if (reduce) return null

  return (
    <div
      className={cn('pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]', className)}
      aria-hidden
    >
      <div
        ref={ref}
        className="h-full w-full origin-right scale-x-0 bg-gradient-to-l from-[var(--lux-primary)] via-[var(--lux-secondary)] to-[var(--lux-gold)]"
      />
    </div>
  )
}

export function ScrubProgress({
  triggerRef,
  className,
}: {
  triggerRef: React.RefObject<HTMLElement | null>
  className?: string
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useGSAP(
    () => {
      if (!barRef.current || !triggerRef.current || reduce) return
      gsap.fromTo(
        barRef.current,
        { width: '0%' },
        {
          width: '68%',
          ease: 'none',
          scrollTrigger: {
            trigger: triggerRef.current,
            start: 'top 70%',
            end: 'bottom 40%',
            scrub: 0.5,
          },
        },
      )
    },
    { dependencies: [reduce, triggerRef] },
  )

  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-[rgba(232,236,244,0.08)]', className)}>
      <div
        ref={barRef}
        className="h-full rounded-full"
        style={{
          width: reduce ? '68%' : '0%',
          background: 'linear-gradient(270deg, var(--lux-primary), var(--lux-secondary), var(--lux-gold))',
        }}
      />
    </div>
  )
}
