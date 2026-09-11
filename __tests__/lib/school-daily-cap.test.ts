import { applySchoolDailyCap, getSchoolAiDailyCap } from '@/lib/ai/school-daily-cap'
import type { AIUsageLimit } from '@/lib/check-ai-limit'

function allowedLimit(): AIUsageLimit {
  return {
    allowed: true,
    dailyUsed: 1,
    dailyLimit: 10,
    weeklyUsed: 1,
    weeklyLimit: 20,
    monthlyUsed: 1,
    monthlyLimit: 50,
    creditsAvailable: 100,
    creditCost: 1,
    featureLabel: 'دستیار مطالعه',
  }
}

describe('getSchoolAiDailyCap', () => {
  it('defaults to 2000', () => {
    expect(getSchoolAiDailyCap(undefined)).toBe(2000)
    expect(getSchoolAiDailyCap('')).toBe(2000)
  })

  it('parses a positive integer', () => {
    expect(getSchoolAiDailyCap('3500')).toBe(3500)
  })

  it('falls back when the value is invalid', () => {
    expect(getSchoolAiDailyCap('0')).toBe(2000)
    expect(getSchoolAiDailyCap('-10')).toBe(2000)
    expect(getSchoolAiDailyCap('nope')).toBe(2000)
  })
})

describe('applySchoolDailyCap', () => {
  it('does not change an already blocked user limit', () => {
    const blocked: AIUsageLimit = { ...allowedLimit(), allowed: false, reason: 'سهمیه کاربر' }
    expect(applySchoolDailyCap(blocked, 5000, 2000)).toEqual(blocked)
  })

  it('fail-opens when school usage could not be counted', () => {
    const limit = allowedLimit()
    expect(applySchoolDailyCap(limit, null, 2000)).toEqual(limit)
  })

  it('blocks when school usage reaches the cap', () => {
    const result = applySchoolDailyCap(allowedLimit(), 2000, 2000)
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/سقف مصرف روزانه/)
  })

  it('allows when school usage is under the cap', () => {
    const result = applySchoolDailyCap(allowedLimit(), 1999, 2000)
    expect(result.allowed).toBe(true)
  })
})
