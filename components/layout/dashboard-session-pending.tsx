'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * بعد از ورود با PIN، کوکی نشست گاهی یک لحظه در RSC خوانده نمی‌شود.
 * redirect() در layout همان لحظه را به error boundary می‌فرستد.
 * اینجا بدون پرتاب خطا صبر می‌کنیم تا نشست آماده شود.
 */
export function DashboardSessionPending(): JSX.Element {
  const router = useRouter()
  const [message, setMessage] = useState('در حال ورود به پنل...')

  useEffect(() => {
    let cancelled = false

    const wait = (ms: number): Promise<void> =>
      new Promise((resolve) => {
        setTimeout(resolve, ms)
      })

    const hydrate = async (): Promise<void> => {
      const delays = [200, 500, 1000, 1600]
      for (let i = 0; i < delays.length; i++) {
        await wait(delays[i])
        if (cancelled) return

        try {
          const res = await fetch('/api/auth/me', {
            cache: 'no-store',
            credentials: 'same-origin',
          })
          if (res.ok) {
            router.refresh()
            return
          }
        } catch {
          // تلاش بعدی
        }
      }

      if (!cancelled) {
        setMessage('ورود کامل نشد. در حال بازگشت به صفحه ورود...')
        window.location.replace('/login')
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <div
      className="flex min-h-app items-center justify-center bg-[var(--lux-hero,#0b1220)] p-6"
      dir="rtl"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--lux-primary,#8B7CFF)]" />
        <p className="text-sm font-medium text-white/80">{message}</p>
        <p className="text-xs text-white/45">اگر چند لحظه طول کشید، صفحه را تازه کنید.</p>
      </div>
    </div>
  )
}
