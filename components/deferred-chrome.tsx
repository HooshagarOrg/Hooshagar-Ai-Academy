'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const CookieConsent = dynamic(
  () => import('@/components/cookie-consent').then((m) => m.CookieConsent),
  { ssr: false },
)

const Toaster = dynamic(
  () => import('sonner').then((m) => m.Toaster),
  { ssr: false },
)

/** توست همان لحظه (ورود به آن نیاز دارد)؛ بنر کوکی بعد از idle. */
export function DeferredChrome(): JSX.Element {
  const [consent, setConsent] = useState(false)

  useEffect(() => {
    const enable = (): void => setConsent(true)
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(enable, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(enable, 1500)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <>
      {consent ? <CookieConsent /> : null}
      <Toaster position="top-center" richColors />
    </>
  )
}
