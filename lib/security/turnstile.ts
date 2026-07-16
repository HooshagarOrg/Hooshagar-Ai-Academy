/**
 * Cloudflare Turnstile — فقط وقتی env تنظیم شده باشد فعال است
 */

export function isTurnstileConfigured(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  )
}

export function getTurnstileSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null
}

/**
 * تأیید توکن Turnstile سمت سرور
 * اگر Turnstile پیکربندی نشده باشد → true (skip)
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  ip?: string
): Promise<{ ok: boolean; skipped: boolean; error?: string }> {
  if (!isTurnstileConfigured()) {
    return { ok: true, skipped: true }
  }

  if (!token || typeof token !== 'string' || token.length < 10) {
    return { ok: false, skipped: false, error: 'تأیید امنیتی لازم است. لطفاً کادر را کامل کنید.' }
  }

  try {
    const body = new URLSearchParams()
    body.set('secret', process.env.TURNSTILE_SECRET_KEY!)
    body.set('response', token)
    if (ip) body.set('remoteip', ip)

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      return { ok: false, skipped: false, error: 'تأیید امنیتی ناموفق بود. دوباره تلاش کنید.' }
    }

    const data = (await res.json()) as { success?: boolean }
    if (!data.success) {
      return { ok: false, skipped: false, error: 'تأیید امنیتی نامعتبر است. صفحه را تازه کنید.' }
    }

    return { ok: true, skipped: false }
  } catch {
    return { ok: false, skipped: false, error: 'خطا در تأیید امنیتی. دوباره تلاش کنید.' }
  }
}
