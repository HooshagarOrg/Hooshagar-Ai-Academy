import { beforeEach, describe, expect, it, vi } from 'vitest'
import { jsonRequest } from '../helpers/next-request'
import { mockQuery } from '../helpers/mock-query'

let lastQuestionSelect = ''

const supabaseState: {
  user: { id: string } | null
  student: { id: string; user_id: string } | null
  exam: Record<string, unknown> | null
  session: Record<string, unknown> | null
  questions: Record<string, unknown>[]
  upsertError: { message: string } | null
  otherStudentResults: Record<string, unknown> | null
} = {
  user: { id: 'user-student-a' },
  student: { id: 'student-a', user_id: 'user-student-a' },
  exam: { id: 'exam-1', status: 'active', duration_minutes: 60, exam_config: {} },
  session: { id: 'session-1', status: 'in_progress', time_remaining_seconds: 600 },
  questions: [],
  upsertError: null,
  otherStudentResults: null,
}

vi.mock('@/lib/security/rate-limiter', () => ({
  applyRateLimitAsync: async () => null,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: supabaseState.user },
        error: supabaseState.user ? null : { message: 'unauthorized' },
      }),
    },
    rpc: async () => ({ data: null, error: { message: 'rpc missing' } }),
    from: (table: string) => {
      if (table === 'students') {
        return mockQuery({ data: supabaseState.student, error: null })
      }
      if (table === 'exams') {
        return mockQuery({ data: supabaseState.exam, error: supabaseState.exam ? null : { message: 'missing' } })
      }
      if (table === 'exam_sessions') {
        return mockQuery({ data: supabaseState.session, error: supabaseState.session ? null : { message: 'missing' } })
      }
      if (table === 'exam_questions') {
        const builder = mockQuery({
          data: supabaseState.questions.length
            ? supabaseState.questions
            : { points: 1, question_type: 'short_answer' },
          error: null,
        })
        builder.select = (columns?: string) => {
          if (typeof columns === 'string') lastQuestionSelect = columns
          return builder
        }
        return builder
      }
      if (table === 'exam_answers') {
        const builder = mockQuery({ data: [], error: supabaseState.upsertError })
        builder.upsert = async () => ({ error: supabaseState.upsertError })
        return builder
      }
      return mockQuery({ data: null, error: null })
    },
  }),
}))

describe('exam', () => {
  beforeEach(() => {
    supabaseState.user = { id: 'user-student-a' }
    supabaseState.student = { id: 'student-a', user_id: 'user-student-a' }
    supabaseState.exam = { id: 'exam-1', status: 'active', duration_minutes: 60, exam_config: {} }
    supabaseState.session = { id: 'session-1', status: 'in_progress', time_remaining_seconds: 600 }
    supabaseState.questions = []
    supabaseState.upsertError = null
    lastQuestionSelect = ''
  })

  it('accepts an answer inside the time window', async () => {
    const { POST } = await import('@/app/api/exams/[id]/answer/route')
    const response = await POST(
      jsonRequest('http://localhost:3000/api/exams/exam-1/answer', {
        body: {
          session_id: '11111111-1111-1111-1111-111111111111',
          question_id: '22222222-2222-2222-2222-222222222222',
          answer: '۴',
        },
      }),
      { params: { id: 'exam-1' } },
    )
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('rejects an answer after the deadline', async () => {
    supabaseState.session = { id: 'session-1', status: 'submitted', time_remaining_seconds: 0 }
    const { POST } = await import('@/app/api/exams/[id]/answer/route')
    const response = await POST(
      jsonRequest('http://localhost:3000/api/exams/exam-1/answer', {
        body: {
          session_id: '11111111-1111-1111-1111-111111111111',
          question_id: '22222222-2222-2222-2222-222222222222',
          answer: '۴',
        },
      }),
      { params: { id: 'exam-1' } },
    )
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(String(body.error)).toMatch(/نامعتبر|مهلت|جلسه/)
  })

  it('does not let a student start an unpublished exam', async () => {
    supabaseState.exam = { id: 'exam-1', status: 'draft', duration_minutes: 60 }
    const { POST } = await import('@/app/api/exams/[id]/start/route')
    const response = await POST(
      jsonRequest('http://localhost:3000/api/exams/exam-1/start', { method: 'POST', body: {} }),
      { params: { id: 'exam-1' } },
    )
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(String(body.error)).toMatch(/فعال نیست/)
  })

  it('does not send correct_answer to the student on exam start', async () => {
    supabaseState.questions = [
      {
        id: 'q1',
        question_text: '۲+۲؟',
        question_type: 'multiple_choice',
        options: [{ id: 'a', text: '۴', is_correct: true }],
        points: 1,
        correct_answer: 'a',
        correct_answers: ['a'],
        explanation: 'بدیهی',
      },
    ]
    const { POST } = await import('@/app/api/exams/[id]/start/route')
    const response = await POST(
      jsonRequest('http://localhost:3000/api/exams/exam-1/start', { method: 'POST', body: {} }),
      { params: { id: 'exam-1' } },
    )
    expect(response.status).toBe(200)
    expect(lastQuestionSelect).not.toMatch(/correct_answer/)
    expect(lastQuestionSelect).not.toMatch(/explanation/)
    const body = (await response.json()) as {
      questions: Record<string, unknown>[]
    }
    expect(body.questions).toHaveLength(1)
    expect(body.questions[0]).not.toHaveProperty('correct_answer')
    expect(body.questions[0]).not.toHaveProperty('correct_answers')
    expect(body.questions[0]).not.toHaveProperty('explanation')
    const options = body.questions[0]?.options as Record<string, unknown>[]
    expect(options[0]).not.toHaveProperty('is_correct')
  })

  it('returns only the signed-in student results', async () => {
    supabaseState.session = {
      id: 'session-a',
      student_id: 'student-a',
      total_score: 8,
      max_score: 10,
      percentage: 80,
      passed: true,
    }
    const { GET } = await import('@/app/api/exams/[id]/result/route')
    const own = await GET(
      jsonRequest('http://localhost:3000/api/exams/exam-1/result'),
      { params: { id: 'exam-1' } },
    )
    expect(own.status).toBe(200)
    const ownBody = await own.json()
    expect(ownBody.result.total_score).toBe(8)

    supabaseState.student = { id: 'student-b', user_id: 'user-student-b' }
    supabaseState.user = { id: 'user-student-b' }
    supabaseState.session = null
    const other = await GET(
      jsonRequest('http://localhost:3000/api/exams/exam-1/result'),
      { params: { id: 'exam-1' } },
    )
    expect(other.status).toBe(404)
  })
})
