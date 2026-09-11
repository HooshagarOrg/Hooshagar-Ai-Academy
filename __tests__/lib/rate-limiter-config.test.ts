import { FAIL_CLOSED_SCOPES, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limit-config'

describe('RATE_LIMIT_CONFIGS', () => {
  it('keeps login and OTP tighter than generic API', () => {
    expect(RATE_LIMIT_CONFIGS.login.limit).toBe(5)
    expect(RATE_LIMIT_CONFIGS.otp_send.limit).toBe(3)
    expect(RATE_LIMIT_CONFIGS.api_default.limit).toBeGreaterThan(
      RATE_LIMIT_CONFIGS.login.limit
    )
  })

  it('limits exam submit to 2 per hour', () => {
    expect(RATE_LIMIT_CONFIGS.exam_submit).toEqual({
      limit: 2,
      window: 3_600_000,
    })
  })

  it('fail-closes auth and AI when Redis errors', () => {
    expect(FAIL_CLOSED_SCOPES.has('login')).toBe(true)
    expect(FAIL_CLOSED_SCOPES.has('otp_send')).toBe(true)
    expect(FAIL_CLOSED_SCOPES.has('ai_general')).toBe(true)
    expect(FAIL_CLOSED_SCOPES.has('exam_submit')).toBe(false)
  })
})
