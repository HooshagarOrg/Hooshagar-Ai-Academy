'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export function ScrollProgressBar(): JSX.Element {
  const barRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!barRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
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
