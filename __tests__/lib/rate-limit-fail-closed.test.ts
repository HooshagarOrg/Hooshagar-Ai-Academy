import { shouldFailClosedWithoutRedis } from '@/lib/security/fail-closed'

describe('rate limit fail-closed (H15)', () => {
  it('denies auth and AI scopes in production without Redis', () => {
    expect(shouldFailClosedWithoutRedis('otp_send', 'production', false)).toBe(true)
    expect(shouldFailClosedWithoutRedis('login', 'production', false)).toBe(true)
    expect(shouldFailClosedWithoutRedis('ai_general', 'production', false)).toBe(true)
  })

  it('allows memory fallback in development or when Redis exists', () => {
    expect(shouldFailClosedWithoutRedis('otp_send', 'development', false)).toBe(false)
    expect(shouldFailClosedWithoutRedis('otp_send', 'production', true)).toBe(false)
    expect(shouldFailClosedWithoutRedis('api_default', 'production', false)).toBe(false)
  })
})
