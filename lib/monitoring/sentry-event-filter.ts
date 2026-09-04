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

function recordOfUnknown(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
}

function browserNameFromContexts(contexts: unknown): string | undefined {
  const browser = recordOfUnknown(contexts)?.browser
  return stringTag(recordOfUnknown(browser)?.name)
}

function headerValue(headers: unknown, name: string): string | undefined {
  const record = recordOfUnknown(headers)
  if (!record) return undefined
  const matched = Object.entries(record).find(([key]) => key.toLowerCase() === name.toLowerCase())
  return stringTag(matched?.[1])
}

export function shouldDropClientSentryEvent(event: {
  contexts?: unknown
  tags?: unknown
  request?: unknown
}): boolean {
  if (isHeadlessBrowserName(browserNameFromContexts(event.contexts))) {
    return true
  }

  const tags = recordOfUnknown(event.tags)
  if (isHeadlessBrowserName(stringTag(tags?.['browser.name']))) {
    return true
  }
  if (isHeadlessBrowserName(stringTag(tags?.browser))) {
    return true
  }

  const request = recordOfUnknown(event.request)
  return userAgentLooksHeadless(headerValue(request?.headers, 'user-agent'))
}
