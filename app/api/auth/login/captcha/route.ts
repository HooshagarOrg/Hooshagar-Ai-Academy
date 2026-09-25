import { NextResponse } from 'next/server'
import {
  issueLoginCaptcha,
  loginCaptchaCookieName,
  renderLoginCaptchaSvg,
} from '@/lib/security/login-captcha'

// بدون این، Next پاسخ را هنگام build ثابت می‌کند و CDN همان کد و کوکی منقضی را به همه می‌دهد
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(): Promise<NextResponse> {
  const { code, cookieValue } = issueLoginCaptcha()
  const svg = renderLoginCaptchaSvg(code)
  const response = new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    },
  })
  response.cookies.set(loginCaptchaCookieName(), cookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 5 * 60,
  })
  return response
}
