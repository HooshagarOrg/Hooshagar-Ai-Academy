/**
 * فیلتر رویدادهای کلاینت Sentry — بات‌های Headless نباید issue را regression کنند.
 */

export function isHeadlessBrowserName(name: string | undefined): boolean {
  if (!name) return false
  return /headlesschrome|^headless$/i.test(name.trim())
}

export function userAgentLooksHeadless(userAgent: string | undefined): boolean {
  if (!userAgent) return false
  return /HeadlessChrome/i.test(userAgent)
}

function stringTag(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export function shouldDropClientSentryEvent(event: {
  contexts?: { browser?: { name?: string } }
  tags?: Record<string, unknown>
  request?: { headers?: Record<string, string> }
}): boolean {
  if (isHeadlessBrowserName(event.contexts?.browser?.name)) {
    return true
  }
  if (isHeadlessBrowserName(stringTag(event.tags?.['browser.name']))) {
    return true
  }
  if (isHeadlessBrowserName(stringTag(event.tags?.browser))) {
    return true
  }

  const headers = event.request?.headers
  if (!headers) return false

  const userAgent = headers['User-Agent'] ?? headers['user-agent']
  return userAgentLooksHeadless(userAgent)
}
