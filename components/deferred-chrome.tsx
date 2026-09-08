'use client'

import { useEffect, useState, type ComponentType } from 'react'
import { usePathname } from 'next/navigation'
import { isPublicMarketingPath } from '@/lib/monitoring/public-path'

type CookieBannerComponent = ComponentType<Record<string, never>>
type LazyToaster = typeof import('sonner').Toaster

/**
 * کوکی و توست را با import() تأخیری بار می‌کند.
 * requestIdleCallback({timeout:20000}) همان لحظهٔ بیکاری (~۲ثانیه) اجرا می‌شد و LCP را می‌دزدید.
 */
export function DeferredChrome(): JSX.Element {
  const pathname = usePathname()
  const [CookieBanner, setCookieBanner] = useState<CookieBannerComponent | null>(
    null,
  )
  const [Toaster, setToaster] = useState<LazyToaster | null>(null)
  const publicPath = isPublicMarketingPath(pathname)

  useEffect(() => {
    const cookieMs = publicPath ? 20_000 : 4_000
    const cookieId = window.setTimeout(() => {
      void import(
        /* webpackPrefetch: false, webpackPreload: false */
        '@/components/cookie-consent'
      ).then((mod) => {
        setCookieBanner(() => mod.CookieConsent)
      })
    }, cookieMs)

    let toasterId: number | undefined
    if (pathname !== '/') {
      toasterId = window.setTimeout(() => {
        void import(
          /* webpackPrefetch: false, webpackPreload: false */
          'sonner'
        ).then((mod) => {
          setToaster(() => mod.Toaster)
        })
      }, 0)
    }

    return () => {
      window.clearTimeout(cookieId)
      if (toasterId !== undefined) window.clearTimeout(toasterId)
    }
  }, [pathname, publicPath])

  return (
    <>
      {CookieBanner ? <CookieBanner /> : null}
      {Toaster ? <Toaster position="top-center" richColors /> : null}
    </>
  )
}
