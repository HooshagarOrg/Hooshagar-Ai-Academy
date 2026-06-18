'use client'

import Link from 'next/link'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/motion/reveal'
import type { UiTone } from '@/lib/ui/role-tone'

interface MarketingShellProps {
  children: React.ReactNode
  tone?: UiTone
  showNav?: boolean
}

/** Shell مارکتینگ — پس‌زمینه از layout سراسری */
export function MarketingShell({
  children,
  tone = 'balanced',
  showNav = true,
}: MarketingShellProps) {
  return (
    <div className="min-h-screen text-foreground" data-ui-tone={tone} dir="rtl">
      {showNav && (
        <Reveal as="section" className="sticky top-0 z-50 pt-safe">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
            <nav className="premium-glass flex h-14 items-center justify-between px-4 sm:px-5">
              <HooshagarLogo size="sm" href="/" priority showWordmark />
              <div className="flex items-center gap-2">
                <Link href="/login" prefetch={false}>
                  <Button variant="ghost" size="sm">
                    ورود
                  </Button>
                </Link>
                <Link href="/login" prefetch={false}>
                  <Button variant="luxury" size="sm">
                    شروع رایگان
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </Reveal>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  )
}
