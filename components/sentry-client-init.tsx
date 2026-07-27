'use client'

/**
 * اطمینان از لود شدن Sentry روی کلاینت (Next.js 14).
 * withSentryConfig هم همین فایل را inject می‌کند؛ init تکراری بی‌خطر است.
 */
import '../sentry.client.config'

export function SentryClientInit(): null {
  return null
}
