import { beforeEach, describe, expect, it, vi } from 'vitest'
import { jsonRequest } from '../helpers/next-request'
import { mockQuery } from '../helpers/mock-query'

const otpState: {
  user: { id: string } | null
  otp: { id: string; expires_at: string } | null
  attempts: unknown[]
} = {
  user: { id: 'user-1' },
  otp: {
    id: 'otp-1',
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  },
  attempts: [],
}

vi.mock('@/lib/security/rate-limiter', () => ({
  applyRateLimitAsync: async () => null,
}))

vi.mock('@/lib/cache/profile-cache', () => ({
  getProfileCached: async (
    _userId: string,
    fetchFresh: () => Promise<{ role: string; school_id: string | null; email: string | null; id: string; full_name: string | null; ui_theme: string | null } | null>,
  ) => fetchFresh(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: otpState.user },
        error: otpState.user ? null : { message: 'missing token' },
      }),
    },
    from: (table: string) => {
      if (table === 'otp_verify_attempts') {
        const builder = mockQuery({ data: otpState.attempts, error: null })
        builder.insert = async () => ({ error: null })
        return builder
      }
      if (table === 'otp_codes') {
        const builder = mockQuery({
          data: otpState.otp,
          error: otpState.otp ? null : { message: 'not found', code: 'PGRST116' },
        })
        builder.update = () => mockQuery({ data: null, error: null })
        return builder
      }
      if (table === 'profiles') {
        return mockQuery({
          data: otpState.user
            ? { id: otpState.user.id, role: 'student', school_id: 'school-1', email: 'a@b.c', full_name: 'تست', ui_theme: null }
            : null,
          error: otpState.user ? null : { message: 'missing' },
        })
      }
      if (table === 'user_phones') {
        return mockQuery({ data: null, error: { message: 'missing' } })
      }
      if (table === 'phone_login_tokens') {
        const builder = mockQuery({ data: { token: 'tok' }, error: null })
        builder.insert = async () => ({ error: null })
        return builder
      }
      return mockQuery({ data: null, error: null })
    },
  }),
}))

describe('auth', () => {
  beforeEach(() => {
    otpState.user = { id: 'user-1' }
    otpState.otp = {
      id: 'otp-1',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }
    otpState.attempts = []
  })

  it('rejects an expired OTP after the configured window', async () => {
    otpState.otp = {
      id: 'otp-expired',
      expires_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    }
    const { POST } = await import('@/app/api/auth/verify-otp/route')
    const response = await POST(
      jsonRequest('http://localhost:3000/api/auth/verify-otp', {
        body: { phoneNumber: '09121234567', code: '123456', purpose: 'login' },
      }),
    )
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.code).toBe('EXPIRED_OTP')
    expect(String(body.error)).toMatch(/منقضی/)
  })

  it('rejects a wrong OTP', async () => {
    otpState.otp = null
    const { POST } = await import('@/app/api/auth/verify-otp/route')
    const response = await POST(
      jsonRequest('http://localhost:3000/api/auth/verify-otp', {
        body: { phoneNumber: '09121234567', code: '000000', purpose: 'login' },
      }),
    )
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.code).toBe('INVALID_OTP')
  })

  it('returns 401 when a protected request has no token', async () => {
    otpState.user = null
    const { withAuth } = await import('@/lib/security/api-guard')
    const { NextResponse } = await import('next/server')
    const response = await withAuth(
      jsonRequest('http://localhost:3000/api/profile'),
      async () => NextResponse.json({ ok: true }),
      { skipRateLimit: true },
    )
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error_code).toBe('UNAUTHORIZED')
  })
})
