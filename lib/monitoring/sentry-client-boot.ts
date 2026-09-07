import * as Sentry from '@sentry/nextjs'
import { shouldDropClientSentryEvent } from '@/lib/monitoring/sentry-event-filter'
import { isPublicMarketingPath } from '@/lib/monitoring/public-path'

const IGNORE_ERRORS = [
  'ResizeObserver loop limit exceeded',
  'Non-Error promise rejection captured',
  'Invalid login credentials',
  'Invalid login',
  'AuthApiError',
]

/** Init بدون Replay — فقط بعد از dynamic import صدا زده شود. */
export function initClientSentry(): void {
  if (Sentry.getClient()) return

  const publicPath = isPublicMarketingPath()
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
    tracesSampleRate: publicPath
      ? 0
      : process.env.NODE_ENV === 'production'
        ? 0.2
        : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    integrations: [],
    environment: process.env.NODE_ENV || 'development',
    beforeSend(event) {
      if (shouldDropClientSentryEvent(event)) {
        return null
      }
      return event
    },
    ignoreErrors: IGNORE_ERRORS,
    release:
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      'development',
  })
}
