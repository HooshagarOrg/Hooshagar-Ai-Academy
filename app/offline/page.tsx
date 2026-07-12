'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { WifiOff, RefreshCw, Home, ArrowRight, Cloud, CloudOff, Loader2 } from 'lucide-react'
import { HooshagarLogo } from '@/components/brand/hooshagar-logo'
import { CinematicBackdrop } from '@/components/layout/cinematic-backdrop'
import { PersianDateDisplay } from '@/components/ui/persian-date-display'

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setTimeout(() => window.history.back(), 2000)
    }
    const handleOffline = () => setIsOnline(false)
    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      const response = await fetch('/api/health', { method: 'HEAD', cache: 'no-cache' })
      if (response.ok) window.location.reload()
      else setIsRetrying(false)
    } catch {
      setIsRetrying(false)
    }
  }

  const shell = (content: ReactNode) => (
    <div className="lp-noise relative flex min-h-app items-center justify-center overflow-hidden px-4" dir="rtl" style={{ background: 'var(--lux-void)' }}>
      <CinematicBackdrop showVideo={false} />
      <div className="relative z-10 w-full max-w-md">{content}</div>
    </div>
  )

  if (isOnline) {
    return shell(
      <div className="lp-glass p-8 text-center">
        <Cloud className="mx-auto mb-4 h-16 w-16 text-[var(--lux-success)]" aria-hidden="true" />
        <h1 className="lux-h2 mb-3 text-[var(--lux-success)]">اتصال برقرار شد</h1>
        <p className="text-sm text-[var(--lux-text-muted)]">در حال بازگشت به صفحه قبلی...</p>
        <div className="mt-4 flex items-center justify-center gap-2 text-[var(--lux-text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>لطفاً صبر کنید</span>
        </div>
      </div>,
    )
  }

  return shell(
    <>
      <div className="mb-8 flex flex-col items-center gap-3">
        <HooshagarLogo size="md" href="/" inverted priority />
        <PersianDateDisplay variant="compact" />
      </div>
      <div className="lp-glass p-8 text-center">
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[rgba(15,17,23,0.8)]">
          <CloudOff className="h-12 w-12 text-[var(--lux-text-muted)]" aria-hidden="true" />
          <span className="absolute -bottom-1 -left-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--lux-void)] bg-[rgba(239,68,68,0.15)]">
            <WifiOff className="h-5 w-5 text-red-400" aria-hidden="true" />
          </span>
        </div>
        <h1 className="lux-h2 mb-3">اتصال اینترنت قطع است</h1>
        <p className="mb-8 text-sm leading-7 text-[var(--lux-text-muted)]">
          لطفاً اتصال اینترنت خود را بررسی کنید. برخی قابلیت‌ها در حالت آفلاین در دسترس نیستند.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={handleRetry} disabled={isRetrying} className="lux-btn-accent gap-2">
            {isRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isRetrying ? 'در حال بررسی...' : 'تلاش مجدد'}
          </button>
          <Link href="/dashboard" className="lux-btn-ghost gap-2">
            <Home className="h-4 w-4" />
            صفحه اصلی
          </Link>
          <button type="button" onClick={() => window.history.back()} className="lux-btn-ghost gap-2">
            <ArrowRight className="h-4 w-4" />
            بازگشت
          </button>
        </div>
        <div className="mt-8 rounded-xl border border-[rgba(232,236,244,0.08)] bg-[rgba(15,17,23,0.5)] p-4 text-right text-sm text-[var(--lux-text-muted)]">
          <p className="mb-2 font-bold text-[var(--lux-text)]">راهنمای رفع مشکل</p>
          <ul className="space-y-1 leading-7">
            <li>اتصال Wi-Fi یا داده موبایل را بررسی کنید</li>
            <li>حالت هواپیما را غیرفعال کنید</li>
            <li>مودم را مجدداً راه‌اندازی کنید</li>
          </ul>
        </div>
      </div>
    </>,
  )
}
