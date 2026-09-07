import { isPublicMarketingPath } from '@/lib/monitoring/public-path'

describe('isPublicMarketingPath', () => {
  it('treats landing, login, and marketing as public', () => {
    expect(isPublicMarketingPath('/')).toBe(true)
    expect(isPublicMarketingPath('/login')).toBe(true)
    expect(isPublicMarketingPath('/help')).toBe(true)
    expect(isPublicMarketingPath('/pricing')).toBe(true)
  })

  it('does not treat dashboards as public', () => {
    expect(isPublicMarketingPath('/dashboard/teacher')).toBe(false)
    expect(isPublicMarketingPath('/student/garden')).toBe(false)
  })
})
