import { shouldBlockDevTestPath } from '@/lib/security/dev-test-routes'

describe('shouldBlockDevTestPath', () => {
  it('blocks /test-* in production', () => {
    expect(shouldBlockDevTestPath('/test-login', 'production')).toBe(true)
    expect(shouldBlockDevTestPath('/test-students', 'production')).toBe(true)
    expect(shouldBlockDevTestPath('/test-ocr', 'production')).toBe(true)
    expect(shouldBlockDevTestPath('/test-session', 'production')).toBe(true)
  })

  it('allows /test-* in development and test', () => {
    expect(shouldBlockDevTestPath('/test-login', 'development')).toBe(false)
    expect(shouldBlockDevTestPath('/test-login', 'test')).toBe(false)
  })

  it('does not block real app routes in production', () => {
    expect(shouldBlockDevTestPath('/login', 'production')).toBe(false)
    expect(shouldBlockDevTestPath('/student', 'production')).toBe(false)
    expect(shouldBlockDevTestPath('/teacher', 'production')).toBe(false)
  })
})
