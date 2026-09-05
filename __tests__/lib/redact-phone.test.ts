import { redactPhone } from '@/lib/privacy/redact'

describe('phone redaction (H14)', () => {
  it('keeps only prefix and suffix of an Iranian mobile', () => {
    expect(redactPhone('09123456789')).toBe('0912****89')
    expect(redactPhone('+989123456789')).not.toContain('1234567')
  })
})
