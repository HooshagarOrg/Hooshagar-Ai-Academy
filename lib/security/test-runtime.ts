/**
 * Local `next dev` and Playwright both need login/OTP without Turnstile,
 * IP lockout, or Upstash rate limits. Nightly runs `next start` (NODE_ENV=production)
 * with HOOSHAGAR_E2E=1. `.env.local` can overwrite APP_ENV even when the process
 * was started from `.env.test`.
 */
export function isRelaxedAuthRuntime(): boolean {
  return (
    process.env.HOOSHAGAR_E2E === '1' ||
    process.env.APP_ENV === 'test' ||
    process.env.NODE_ENV === 'development'
  )
}
