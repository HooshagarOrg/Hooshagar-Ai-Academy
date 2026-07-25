import {
  addXPSchema,
  gradeSchema,
  loginSchema,
  studentSchema,
} from '@/lib/validators'

describe('validators', () => {
  describe('loginSchema', () => {
    it('accepts valid credentials', () => {
      const result = loginSchema.safeParse({
        email: 'admin@hooshagar.ir',
        password: 'secret1',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email and short password', () => {
      const result = loginSchema.safeParse({
        email: 'bad',
        password: '123',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('studentSchema', () => {
    it('accepts a minimal valid student', () => {
      const result = studentSchema.safeParse({
        full_name: 'علی رضایی',
        grade: 7,
      })
      expect(result.success).toBe(true)
    })

    it('rejects out-of-range grade', () => {
      const result = studentSchema.safeParse({
        full_name: 'علی',
        grade: 20,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('gradeSchema', () => {
    it('enforces 0–20 score range', () => {
      const ok = gradeSchema.safeParse({
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        subject: 'ریاضی',
        score: 18.5,
        exam_type: 'quiz',
        exam_date: '2026-01-15T10:00:00.000Z',
      })
      expect(ok.success).toBe(true)

      const bad = gradeSchema.safeParse({
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        subject: 'ریاضی',
        score: 25,
        exam_type: 'quiz',
        exam_date: '2026-01-15T10:00:00.000Z',
      })
      expect(bad.success).toBe(false)
    })
  })

  describe('addXPSchema', () => {
    it('requires positive XP amount and valid student id', () => {
      const ok = addXPSchema.safeParse({
        studentId: '550e8400-e29b-41d4-a716-446655440000',
        xpAmount: 10,
        reason: 'daily_login',
      })
      expect(ok.success).toBe(true)

      const bad = addXPSchema.safeParse({
        studentId: '550e8400-e29b-41d4-a716-446655440000',
        xpAmount: -1,
        reason: 'daily_login',
      })
      expect(bad.success).toBe(false)
    })
  })
})
