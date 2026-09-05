import {
  canStartExam,
  computeMustSubmitBy,
  isSubmitWithinDeadline,
  resolveExamDurationMinutes,
  resolveSessionDeadline,
} from '@/lib/exams/window'

describe('exam window and duration (H1)', () => {
  const examDate = new Date('2026-09-05T08:00:00.000Z')
  const input = { examDate, durationMinutes: 60 }

  it('resolves duration from row then config then default', () => {
    expect(resolveExamDurationMinutes({ examDate, durationMinutes: 45 })).toBe(45)
    expect(
      resolveExamDurationMinutes({
        examDate,
        durationMinutes: null,
        configTimeLimitMinutes: 30,
      })
    ).toBe(30)
    expect(resolveExamDurationMinutes({ examDate, durationMinutes: 0 })).toBe(60)
  })

  it('refuses start before exam_date', () => {
    const now = new Date('2026-09-05T07:50:00.000Z')
    expect(canStartExam(now, input)).toEqual({ allowed: false, reason: 'too_early' })
  })

  it('allows start during the published window', () => {
    const now = new Date('2026-09-05T08:10:00.000Z')
    expect(canStartExam(now, input).allowed).toBe(true)
  })

  it('refuses start after exam_date + duration', () => {
    const now = new Date('2026-09-05T09:05:00.000Z')
    expect(canStartExam(now, input)).toEqual({ allowed: false, reason: 'too_late' })
  })

  it('caps must_submit_by at the published window end', () => {
    const startedAt = new Date('2026-09-05T08:50:00.000Z')
    const deadline = computeMustSubmitBy(startedAt, input)
    expect(deadline.toISOString()).toBe('2026-09-05T09:00:30.000Z')
  })

  it('rejects submit after the deadline', () => {
    const startedAt = new Date('2026-09-05T08:00:00.000Z')
    const deadline = computeMustSubmitBy(startedAt, input)
    expect(isSubmitWithinDeadline(new Date('2026-09-05T09:00:00.000Z'), deadline)).toBe(
      true
    )
    expect(isSubmitWithinDeadline(new Date('2026-09-05T09:01:00.000Z'), deadline)).toBe(
      false
    )
  })

  it('prefers stored must_submit_by on the session', () => {
    const stored = resolveSessionDeadline(
      {
        must_submit_by: '2026-09-05T09:00:30.000Z',
        started_at: '2026-09-05T08:00:00.000Z',
      },
      input
    )
    expect(stored?.toISOString()).toBe('2026-09-05T09:00:30.000Z')
  })
})
