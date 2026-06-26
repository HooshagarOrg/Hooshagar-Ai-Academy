'use client'

import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { AuthIllustration } from '@/components/auth/auth-illustration'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'

interface SpectrumPortalProps {
  children: ReactNode
}

/**
 * HooshagaarAuthShell — ورود ساده و روشن با illustration هوشیار
 */
export function SpectrumPortal({ children }: SpectrumPortalProps) {
  const reduce = useReducedMotion()

  return (
    <div className="hf-auth-shell relative min-h-app overflow-hidden" dir="rtl">
      <div className="relative z-10 mx-auto flex min-h-app w-full max-w-5xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:py-12">
        <motion.div
          className="mb-8 flex flex-col items-center text-center lg:mb-0 lg:max-w-sm lg:items-start lg:text-right"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-6 lg:hidden">
            <HooshagarLogo size="md" href="/" showWordmark priority surface="light" />
          </div>
          <div className="mb-6 hidden lg:block">
            <HooshagarLogo size="lg" href="/" showWordmark priority surface="light" />
          </div>
          <AuthIllustration className="mb-6" compact />
          <h1 className="hf-h2 hidden lg:block">
            ورود به <span className="hf-gradient-text">تجربه یادگیری هوشمند</span>
          </h1>
          <p className="hf-body mt-3 hidden max-w-sm lg:block">
            پنل دانش‌آموز، والدین، معلم و مدرسه — امن، فارسی‌محور و نقش‌محور.
          </p>
        </motion.div>

        <motion.div
          className="w-full max-w-md"
          initial={reduce ? false : { opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <div className="hf-auth-card p-6 sm:p-8">
            <div className="mb-6 border-b border-[#E2E8F0] pb-5 text-center lg:text-right">
              <p className="text-xl font-black text-[#111827]">ورود به هوشاگر</p>
              <p className="mt-1 text-sm text-[#64748B]">نقش خود را انتخاب کنید</p>
            </div>
            {children}
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-[#64748B]">
            <CheckCircle2 className="h-4 w-4 text-[#39D98A]" />
            ورود امن و نقش‌محور
          </div>

          <p className="mt-4 text-center text-xs text-[#64748B]">
            <Link href="/" className="font-bold transition-colors hover:text-[#8B7CFF]">
              بازگشت به صفحه اصلی
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
