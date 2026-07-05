'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from 'framer-motion'
import { SectionReveal } from '@/components/landing/gsap'

gsap.registerPlugin(ScrollTrigger)

const ISLANDS: Array<{
  label: string
  c: string
  x: number
  h: number
  z: number
  active?: boolean
}> = [
  { label: 'ریاضی', c: '#8B7CFF', x: 10, h: 0, z: 0 },
  { label: 'علوم', c: '#54D2FF', x: 30, h: 12, z: 40 },
  { label: 'فیزیک', c: '#FF4DA6', x: 50, h: 6, z: 80, active: true },
  { label: 'ادبیات', c: '#39D98A', x: 70, h: 14, z: 40 },
  { label: 'استعداد', c: '#C9A962', x: 90, h: 4, z: 0 },
]

export function JourneySection() {
  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const reduce = useReducedMotion()

  useGSAP(
    () => {
      if (!sectionRef.current || !pinRef.current || !sceneRef.current || reduce) return

      const mm = gsap.matchMedia()

      mm.add('(min-width: 768px)', () => {
        const pathLen = pathRef.current?.getTotalLength() ?? 400

        if (pathRef.current) {
          gsap.set(pathRef.current, {
            strokeDasharray: pathLen,
            strokeDashoffset: pathLen,
          })
        }

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=120%',
            pin: pinRef.current,
            scrub: 0.6,
            anticipatePin: 1,
          },
        })

        tl.to(sceneRef.current, { rotateX: 8, z: 80, ease: 'none' }, 0)
        tl.to(
          sceneRef.current?.querySelectorAll('[data-island]') ?? [],
          {
            y: (i) => -20 - (i as number) * 8,
            z: (i) => 30 + (i as number) * 25,
            stagger: 0.05,
            ease: 'none',
          },
          0,
        )

        if (pathRef.current) {
          tl.to(pathRef.current, { strokeDashoffset: 0, ease: 'none' }, 0.1)
        }
      })

      mm.add('(max-width: 767px)', () => {
        if (!pathRef.current) return
        const pathLen = pathRef.current.getTotalLength()
        gsap.fromTo(
          pathRef.current,
          { strokeDasharray: pathLen, strokeDashoffset: pathLen },
          {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 75%',
              end: 'bottom 50%',
              scrub: 0.5,
            },
          },
        )
      })

      return () => mm.revert()
    },
    { scope: sectionRef, dependencies: [reduce] },
  )

  return (
    <section
      id="journey"
      ref={sectionRef}
      className="relative bg-[var(--lux-void)]"
      aria-labelledby="journey-heading"
    >
      <div ref={pinRef} className="lux-section min-h-[100dvh]">
        <div className="lux-container relative z-10">
          <SectionReveal>
            <p className="lux-kicker lux-kicker-gold mb-3">سفر یادگیری</p>
            <h2 id="journey-heading" className="lux-h2">
              جزیره به جزیره — یک ماجراجویی آموزشی
            </h2>
          </SectionReveal>

          <div className="lux-perspective relative mt-10">
            <div ref={sceneRef} className="lux-scene-3d relative" style={{ transformStyle: 'preserve-3d' }}>
              <svg viewBox="0 0 400 220" className="h-52 w-full sm:h-64" aria-hidden>
                <defs>
                  <linearGradient id="journeyPath" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--lux-primary)" />
                    <stop offset="50%" stopColor="var(--lux-secondary)" />
                    <stop offset="100%" stopColor="var(--lux-gold)" />
                  </linearGradient>
                </defs>
                <path
                  ref={pathRef}
                  d="M 20 170 Q 100 120, 200 150 T 380 130"
                  fill="none"
                  stroke="url(#journeyPath)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                <path d="M 0 185 Q 200 145, 400 175 L 400 220 L 0 220 Z" fill="rgba(139,124,255,0.05)" />
              </svg>

              <div className="relative -mt-8 h-40 sm:h-48">
                {ISLANDS.map((island) => {
                  const bx = 40 + island.x * 3.2
                  const by = 80 - island.h
                  return (
                    <div
                      key={island.label}
                      data-island
                      className="absolute transition-shadow duration-300"
                      style={{
                        left: `${island.x}%`,
                        top: `${by}px`,
                        transform: `translateZ(${island.z}px)`,
                        filter: island.active ? `drop-shadow(0 0 24px ${island.c})` : undefined,
                      }}
                    >
                      <svg width="56" height="56" viewBox="0 0 48 48" aria-hidden>
                        <polygon points="0,20 24,8 48,20 24,32" fill={island.c} opacity={island.active ? 0.9 : 0.5} />
                        <polygon points="0,20 24,32 24,48 0,36" fill={island.c} opacity={island.active ? 0.6 : 0.3} />
                        <polygon points="24,32 48,20 48,36 24,48" fill={island.c} opacity={island.active ? 0.45 : 0.22} />
                      </svg>
                      <p className="mt-1 text-center text-[10px] font-bold text-[var(--lux-text-muted)]">{island.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
