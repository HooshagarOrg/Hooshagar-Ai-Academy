import { createHmac, randomInt, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'hg_login_captcha'
const TTL_MS = 5 * 60_000

function secret(): string {
  return (
    process.env.LOGIN_CAPTCHA_SECRET ||
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'hooshagar-login-captcha'
  )
}

export function loginCaptchaCookieName(): string {
  return COOKIE_NAME
}

export function issueLoginCaptcha(): { code: string; cookieValue: string } {
  const code = String(randomInt(10000, 99999))
  const exp = Date.now() + TTL_MS
  const payload = `${code}.${exp}`
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url')
  return { code, cookieValue: `${payload}.${sig}` }
}

export function verifyLoginCaptcha(
  cookieValue: string | undefined,
  answer: string | undefined
): boolean {
  if (!cookieValue || !answer) return false
  const parts = cookieValue.split('.')
  if (parts.length !== 3) return false
  const [code, expRaw, sig] = parts
  const exp = Number(expRaw)
  if (!code || !sig || !Number.isFinite(exp) || Date.now() > exp) return false

  const payload = `${code}.${expRaw}`
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false

  const normalized = answer.replace(/\D/g, '')
  return normalized.length > 0 && normalized === code
}

export function renderLoginCaptchaSvg(code: string): string {
  const chars = code.split('')
  const glyphs = chars
    .map((ch, i) => {
      const x = 28 + i * 36
      const y = 42 + ((i % 2) * 6 - 3)
      const rot = (i % 2 === 0 ? -8 : 8)
      return `<text x="${x}" y="${y}" transform="rotate(${rot} ${x} ${y})" font-size="32" font-family="Tahoma, sans-serif" font-weight="700" fill="#f8fafc">${ch}</text>`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="72" viewBox="0 0 220 72" role="img" aria-label="کد امنیتی">
  <rect width="220" height="72" rx="12" fill="#1e1b2e"/>
  <path d="M8 20 H212 M12 48 H200" stroke="#a78bfa" stroke-opacity="0.35" stroke-width="1"/>
  ${glyphs}
</svg>`
}
