/** مهلت ارسال آزمون: پنجرهٔ انتشار + مدت جلسه (H1) */

export const EXAM_CLOCK_GRACE_MS = 30_000
export const EXAM_EARLY_START_MS = 60_000

export interface ExamTimingInput {
  examDate: Date | string | null | undefined
  durationMinutes: number | null | undefined
  configTimeLimitMinutes?: number | null
}

export function resolveExamDurationMinutes(input: ExamTimingInput): number {
  const fromRow = Number(input.durationMinutes)
  if (Number.isFinite(fromRow) && fromRow > 0) {
    return Math.min(360, Math.max(1, Math.floor(fromRow)))
  }
  const fromConfig = Number(input.configTimeLimitMinutes)
  if (Number.isFinite(fromConfig) && fromConfig > 0) {
    return Math.min(360, Math.max(1, Math.floor(fromConfig)))
  }
  return 60
}

export function parseExamDate(value: Date | string | null | undefined): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function getExamWindowBounds(
  examDate: Date,
  durationMinutes: number
): { openAt: number; closeAt: number } {
  return {
    openAt: examDate.getTime() - EXAM_EARLY_START_MS,
    closeAt: examDate.getTime() + durationMinutes * 60_000 + EXAM_CLOCK_GRACE_MS,
  }
}

export function canStartExam(
  now: Date,
  input: ExamTimingInput
): { allowed: boolean; reason: 'too_early' | 'too_late' | null } {
  const examDate = parseExamDate(input.examDate)
  if (!examDate) {
    return { allowed: true, reason: null }
  }
  const duration = resolveExamDurationMinutes(input)
  const { openAt, closeAt } = getExamWindowBounds(examDate, duration)
  const t = now.getTime()
  if (t < openAt) return { allowed: false, reason: 'too_early' }
  if (t > closeAt) return { allowed: false, reason: 'too_late' }
  return { allowed: true, reason: null }
}

export function computeMustSubmitBy(
  startedAt: Date,
  input: ExamTimingInput
): Date {
  const duration = resolveExamDurationMinutes(input)
  const studentEnd = startedAt.getTime() + duration * 60_000
  const examDate = parseExamDate(input.examDate)
  const windowEnd = examDate
    ? examDate.getTime() + duration * 60_000
    : studentEnd
  return new Date(Math.min(studentEnd, windowEnd) + EXAM_CLOCK_GRACE_MS)
}

export function isSubmitWithinDeadline(now: Date, mustSubmitBy: Date): boolean {
  return now.getTime() <= mustSubmitBy.getTime()
}

export function resolveSessionDeadline(
  session: { must_submit_by?: string | null; started_at?: string | null },
  input: ExamTimingInput
): Date | null {
  const stored = parseExamDate(session.must_submit_by)
  if (stored) return stored
  const started = parseExamDate(session.started_at)
  if (!started) return null
  return computeMustSubmitBy(started, input)
}

export function startWindowErrorMessage(reason: 'too_early' | 'too_late'): string {
  return reason === 'too_early'
    ? 'زمان شروع این آزمون هنوز نرسیده است'
    : 'مهلت شرکت در این آزمون به پایان رسیده است'
}

export const EXAM_DEADLINE_MESSAGE = 'زمان آزمون به پایان رسیده است'
