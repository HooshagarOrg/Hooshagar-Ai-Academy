import { isPublicApiRoute } from '@/lib/security/public-api-routes'

describe('isPublicApiRoute', () => {
  it('allows known public auth and health endpoints', () => {
    expect(isPublicApiRoute('/api/auth/login')).toBe(true)
    expect(isPublicApiRoute('/api/auth/send-otp')).toBe(true)
    expect(isPublicApiRoute('/api/auth/logout')).toBe(true)
    expect(isPublicApiRoute('/api/health')).toBe(true)
    expect(isPublicApiRoute('/api/ready')).toBe(true)
    expect(isPublicApiRoute('/api/health?full=1')).toBe(true)
  })

  it('denies protected API routes', () => {
    expect(isPublicApiRoute('/api/students')).toBe(false)
    expect(isPublicApiRoute('/api/notifications')).toBe(false)
    expect(isPublicApiRoute('/api/analyze')).toBe(false)
    expect(isPublicApiRoute('/api/grades')).toBe(false)
    expect(isPublicApiRoute('/api/lottery')).toBe(false)
    expect(isPublicApiRoute('/api/badges/unlock')).toBe(false)
    expect(isPublicApiRoute('/api/reports/annual/generate')).toBe(false)
    expect(isPublicApiRoute('/api/notifications/financial')).toBe(false)
  })
})
