'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from 'framer-motion'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

const LINKS = [
  { href: '#ai-companion', label: 'هوشیار' },
  { href: '#talent', label: 'استعداد' },
  { href: '#journey', label: 'سفر یادگیری' },
  { href: '#faq', label: 'سوالات' },
] as const

export function FloatingNav() {
  const navRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!navRef.current || reduce) {
      navRef.current?.classList.add('is-visible')
      return
    }

    const trigger = ScrollTrigger.create({
      start: 'top -80vh',
      end: 99999,
      onUpdate: (self) => {
        if (!navRef.current) return
        if (self.scroll() > window.innerHeight * 0.85) {
          navRef.current.classList.add('is-visible')
        } else {
          navRef.current.classList.remove('is-visible')
        }
      },
    })

    return () => trigger.kill()
  }, [reduce])

  return (
    <nav ref={navRef} className={cn('lux-floating-nav', reduce && 'is-visible')} aria-label="ناوبری اصلی">
      <HooshagarLogo size="xs" href="/" surface="void" showWordmark inverted className="shrink-0" />
      <div className="hidden flex-1 items-center justify-center gap-1 sm:flex">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-full px-3 py-1.5 text-xs font-bold text-[var(--lux-text-muted)] transition-colors hover:bg-[rgba(232,236,244,0.06)] hover:text-[var(--lux-text)]"
          >
            {link.label}
          </a>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link href="/login" className="lux-btn-ghost min-h-9 px-4 text-xs">
          ورود
        </Link>
        <Link href="/register" className="lux-btn-accent hidden min-h-9 px-4 text-xs sm:inline-flex">
          شروع رایگان
        </Link>
      </div>
    </nav>
  )
}
