import {
  buildAuthPassword,
  buildInternalEmail,
  defaultPasswordFromCode,
  hashPin,
  normalizeDigits,
  normalizeTenDigitId,
  toIranPhone,
  toLoginCode,
} from '@/lib/bulk-import/login-code'

describe('login-code helpers', () => {
  describe('normalizeDigits', () => {
    it('converts Persian and Arabic digits to Latin', () => {
      expect(normalizeDigits('۰۹۱۲')).toBe('0912')
      expect(normalizeDigits('٠٩١٢')).toBe('0912')
    })
  })

  describe('toLoginCode', () => {
    it('accepts 10-digit national code', () => {
      expect(toLoginCode('1234567890')).toBe('1234567890')
    })

    it('derives code from mobile without leading zero', () => {
      expect(toLoginCode(undefined, '09123456789')).toBe('9123456789')
      expect(toLoginCode(undefined, '+989123456789')).toBe('9123456789')
    })

    it('returns null for invalid input', () => {
      expect(toLoginCode('123')).toBe(null)
    })
  })

  describe('toIranPhone', () => {
    it('normalizes to 09 format', () => {
      expect(toIranPhone('9123456789')).toBe('09123456789')
      expect(toIranPhone('09123456789')).toBe('09123456789')
      expect(toIranPhone('123')).toBe(null)
    })
  })

  describe('pin and auth helpers', () => {
    it('hashes pin as base64', () => {
      expect(hashPin('1234')).toBe(Buffer.from('1234', 'utf8').toString('base64'))
    })

    it('builds internal email and default password', () => {
      expect(buildInternalEmail('1234567890', 'parent')).toBe(
        '1234567890@parent.hooshagar.ir'
      )
      expect(buildInternalEmail('1234567890', 'art_teacher')).toBe(
        '1234567890@art-teacher.hooshagar.ir'
      )
      expect(defaultPasswordFromCode('1234567890')).toBe('7890')
    })

    it('builds auth password with role prefix and Pro complexity', () => {
      const password = buildAuthPassword(
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        'secret',
        'student'
      )
      expect(password).toBe('Hg_student_aaaaaaaabbbb_secret!9')
      expect(password).toMatch(/[A-Z]/)
      expect(password).toMatch(/[a-z]/)
      expect(password).toMatch(/[0-9]/)
      expect(password).toMatch(/[!]/)
    })

    it('pads leading zeros dropped by Excel on national codes', () => {
      expect(normalizeTenDigitId('987654321')).toBe('0987654321')
      expect(normalizeTenDigitId('0987654321')).toBe('0987654321')
      expect(normalizeTenDigitId('1234567890.0')).toBe('1234567890')
    })
  })
})
