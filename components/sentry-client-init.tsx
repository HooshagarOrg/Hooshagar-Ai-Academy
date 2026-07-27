'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

let initialized = false

/**
 * Init صریح کلاینت Sentry برای Next.js 14.
 * اگر DSN در بیلد Vercel نباشد، در Console هشدار می‌دهد.
 */
export function SentryClientInit(): null {
  useEffect(() => {
    if (initialized) return
    initialized = true

    if (!dsn) {
      console.warn(
        '[Sentry] NEXT_PUBLIC_SENTRY_DSN در بیلد نیست. در Vercel مقدار را Save کنید و با Clear Cache دوباره Deploy کنید.'
      )
      return
    }

    Sentry.init({
      dsn,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
          maskAllInputs: true,
        }),
      ],
      environment: process.env.NODE_ENV || 'development',
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],
      release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'development',
    })
  }, [])

  return null
}
