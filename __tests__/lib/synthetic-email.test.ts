import {
  buildSyntheticEmail,
  isSyntheticEmail,
  normalizeOptionalEmail,
} from '@/lib/auth/synthetic-email'

describe('synthetic-email', () => {
  it('detects synthetic domain emails', () => {
    expect(isSyntheticEmail('student.0912.abc@users.hooshagar.ir')).toBe(true)
    expect(isSyntheticEmail('real@gmail.com')).toBe(false)
  })

  it('builds role-prefixed synthetic emails from phone', () => {
    const email = buildSyntheticEmail({
      role: 'student',
      phone: '09123456789',
    })
    expect(email).toMatch(/^student\.09123456789\.[a-z0-9]+@users\.hooshagar\.ir$/)
    expect(isSyntheticEmail(email)).toBe(true)
  })

  it('falls back to username when phone is missing', () => {
    const email = buildSyntheticEmail({
      role: 'teacher',
      username: 'Ms.Tehran!',
    })
    expect(email.startsWith('teacher.ms.tehran.')).toBe(true)
  })

  it('normalizes optional email input', () => {
    expect(normalizeOptionalEmail('  Pedram@Example.com ')).toBe('pedram@example.com')
    expect(normalizeOptionalEmail('')).toBe(null)
    expect(normalizeOptionalEmail(123)).toBe(null)
  })
})
