jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  })),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(),
  })),
}))

import {
  lockoutJsonBody,
  persianRetryMessage,
  type LoginLockStatus,
} from '@/lib/security/login-lockout'
import { XP_VALUES } from '@/lib/xp/award-xp'

describe('login lockout messages', () => {
  it('formats Persian retry message in whole minutes', () => {
    expect(persianRetryMessage(30)).toBe(
      'به‌خاطر تلاش‌های ناموفق زیاد، ورود تا 1 دقیقه مسدود است.'
    )
    expect(persianRetryMessage(120)).toBe(
      'به‌خاطر تلاش‌های ناموفق زیاد، ورود تا 2 دقیقه مسدود است.'
    )
  })

  it('builds lockout JSON body with LOGIN_LOCKED code', () => {
    const status: LoginLockStatus = {
      locked: true,
      remainingMs: 90_000,
      retryAfterSeconds: 90,
      requireCaptcha: true,
      failures: 5,
    }
    const body = lockoutJsonBody(status)
    expect(body.success).toBe(false)
    expect(body.error_code).toBe('LOGIN_LOCKED')
    expect(body.require_captcha).toBe(true)
    expect(typeof body.error).toBe('string')
  })
})

describe('XP_VALUES', () => {
  it('defines positive XP for core AI actions', () => {
    expect(XP_VALUES.study_buddy).toBeGreaterThan(0)
    expect(XP_VALUES.problem_solver).toBeGreaterThan(0)
    expect(XP_VALUES.daily_login).toBe(10)
  })
})
