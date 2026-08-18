'use client'

import { useEffect } from 'react'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

/**
 * sentry.client.config.ts خودش Sentry را init می‌کند.
 * اینجا فقط هشدار DSN است تا Replay دو بار ساخته نشود.
 */
export function SentryClientInit(): null {
  useEffect(() => {
    if (!dsn) {
      console.warn(
        '[Sentry] NEXT_PUBLIC_SENTRY_DSN در بیلد نیست. در Vercel مقدار را Save کنید و با Clear Cache دوباره Deploy کنید.'
      )
    }
  }, [])

  return null
}
