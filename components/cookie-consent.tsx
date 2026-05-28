'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'hooshagar_cookie_consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const accepted = localStorage.getItem(STORAGE_KEY)
    if (!accepted) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="رضایت کوکی"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t bg-background/95 backdrop-blur p-4 shadow-lg"
      dir="rtl"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          هوشاگر از کوکی برای ورود امن، ترجیحات و بهبود تجربه استفاده می‌کند. جزئیات در{' '}
          <Link href="/privacy" className="text-primary underline">
            سیاست حریم خصوصی
          </Link>{' '}
          و{' '}
          <Link href="/terms" className="text-primary underline">
            قوانین
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={accept}>
            می‌پذیرم
          </Button>
        </div>
      </div>
    </div>
  )
}
