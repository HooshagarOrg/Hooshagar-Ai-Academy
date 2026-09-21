import { NextResponse } from 'next/server'
import {
  issueLoginCaptcha,
  loginCaptchaCookieName,
  renderLoginCaptchaSvg,
} from '@/lib/security/login-captcha'

export async function GET(): Promise<NextResponse> {
  const { code, cookieValue } = issueLoginCaptcha()
  const svg = renderLoginCaptchaSvg(code)
  const response = new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
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
