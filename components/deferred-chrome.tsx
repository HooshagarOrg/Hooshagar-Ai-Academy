'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { isPublicMarketingPath } from '@/lib/monitoring/public-path'

const CookieConsent = dynamic(
  () => import('@/components/cookie-consent').then((m) => m.CookieConsent),
  { ssr: false },
)

const Toaster = dynamic(
  () => import('sonner').then((m) => m.Toaster),
  { ssr: false },
)

/** لندینگ توست نمی‌خواهد؛ کوکی روی صفحات عمومی خیلی دیرتر می‌آید تا LCP/TBT نگیرد. */
export function DeferredChrome(): JSX.Element {
  const pathname = usePathname()
  const [consent, setConsent] = useState(false)
  const showToaster = pathname !== '/'

  useEffect(() => {
    const enable = (): void => setConsent(true)
    const delayMs = isPublicMarketingPath(pathname) ? 20000 : 4000
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(enable, { timeout: delayMs })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(enable, Math.min(delayMs, 4000))
    return () => window.clearTimeout(id)
  }, [pathname])

  return (
    <>
      {consent ? <CookieConsent /> : null}
      {showToaster ? <Toaster position="top-center" richColors /> : null}
    </>
  )
}
