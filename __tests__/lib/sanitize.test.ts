import {
  escapeHtml,
  normalizeIranPhone,
  sanitizeInt,
  sanitizeString,
  sanitizeText,
  validateIranPhone,
  validatePassword,
  validateStudentNumber,
  validateUUID,
  validateUsername,
} from '@/lib/security/sanitize'

describe('sanitize', () => {
  describe('sanitizeString', () => {
    it('strips HTML and collapses whitespace', () => {
      expect(sanitizeString('  <b>سلام</b>  جهان  ')).toBe('سلام جهان')
    })

    it('returns empty for non-string', () => {
      expect(sanitizeString(42)).toBe('')
    })
  })

  describe('sanitizeText', () => {
    it('removes script tags', () => {
      expect(sanitizeText('<script>alert(1)</script>متن')).toBe('متن')
    })
  })

  describe('Iran phone', () => {
    it('validates common Iranian formats', () => {
      expect(validateIranPhone('09123456789')).toBe(true)
      expect(validateIranPhone('+989123456789')).toBe(true)
      expect(validateIranPhone('12345')).toBe(false)
    })

    it('normalizes to 09xxxxxxxxx', () => {
      expect(normalizeIranPhone('+989123456789')).toBe('09123456789')
      expect(normalizeIranPhone('00989123456789')).toBe('09123456789')
      expect(normalizeIranPhone('9123456789')).toBe('09123456789')
    })
  })

  describe('validateUsername', () => {
    it('rejects short usernames', () => {
      expect(validateUsername('ab').valid).toBe(false)
    })

    it('accepts valid usernames', () => {
      expect(validateUsername('teacher_01').valid).toBe(true)
    })
  })

  describe('validatePassword', () => {
    it('rejects weak passwords', () => {
      const result = validatePassword('123456')
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('rejects password without special character', () => {
      const result = validatePassword('SecurePass1')
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('ویژه'))).toBe(true)
    })

    it('accepts a strong password with special char', () => {
      const result = validatePassword('SecurePass1!')
      expect(result.valid).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(4)
    })
  })

  describe('validateUUID', () => {
    it('accepts UUID v4 only', () => {
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      expect(validateUUID('not-a-uuid')).toBe(false)
      expect(validateUUID(null)).toBe(false)
    })
  })

  describe('sanitizeInt', () => {
    it('parses and clamps', () => {
      expect(sanitizeInt('12')).toBe(12)
      expect(sanitizeInt('3', 5, 10)).toBe(null)
      expect(sanitizeInt('abc')).toBe(null)
    })
  })

  describe('validateStudentNumber', () => {
    it('requires 4–15 digits', () => {
      expect(validateStudentNumber('1234')).toBe(true)
      expect(validateStudentNumber('12')).toBe(false)
      expect(validateStudentNumber('abc')).toBe(false)
    })
  })

  describe('escapeHtml', () => {
    it('escapes special characters', () => {
      expect(escapeHtml('<div>&"\'')).toBe('&lt;div&gt;&amp;&quot;&#039;')
    })
  })
})
