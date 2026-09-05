import { generateOTPCode } from '@/lib/kavenegar'

describe('OTP generation (H13)', () => {
  it('returns a 6-digit numeric code from CSPRNG', () => {
    const code = generateOTPCode(6)
    expect(code).toMatch(/^\d{6}$/)
    expect(Number(code)).toBeGreaterThanOrEqual(100000)
    expect(Number(code)).toBeLessThan(1000000)
  })
})
