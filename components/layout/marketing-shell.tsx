'use client'

import Link from 'next/link'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { AmbientBackground } from '@/components/ui/ambient-background'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/motion/reveal'
import type { UiTone } from '@/lib/ui/role-tone'

interface MarketingShellProps {
  children: React.ReactNode
  tone?: UiTone
  showNav?: boolean
}

export function MarketingShell({
  children,
  tone = 'balanced',
  showNav = true,
}: MarketingShellProps) {
  return (
    <div
      className="min-h-screen bg-background text-foreground ui-canvas premium-grain"
      data-ui-tone={tone}
      dir="rtl"
    >
      <AmbientBackground tone={tone} />

      {showNav && (
        <Reveal as="section" className="sticky top-0 z-50 pt-safe">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
            <nav className="glass-panel-elevated flex h-14 items-center justify-between px-4 sm:px-5 premium-nav">
              <HooshagarLogo size="sm" href="/" priority showWordmark />
              <div className="flex items-center gap-2">
                <Link href="/login" prefetch={false}>
                  <Button variant="ghost" size="sm">
                    ورود
                  </Button>
                </Link>
                <Link href="/login" prefetch={false}>
                  <Button variant="gradient" size="sm">
                    شروع رایگان
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </Reveal>
      )}

      <div className="relative z-10">{children}</div>

      <footer className="relative z-10 border-t border-white/[0.06] py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <HooshagarLogo size="sm" href="/" showWordmark />
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} هوشاگر — سیستم‌عامل یادگیری هوشمند مدارس
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground motion-interactive cursor-pointer">
              قوانین
            </Link>
            <Link href="/privacy" className="hover:text-foreground motion-interactive cursor-pointer">
              حریم خصوصی
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
