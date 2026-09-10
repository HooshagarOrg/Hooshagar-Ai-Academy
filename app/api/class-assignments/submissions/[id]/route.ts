import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AuthContext } from '@/lib/security/api-guard'
import { getSignedDownloadUrl } from '@/lib/arvan-storage'
import {
  CLASS_FILES_ROLES,
  CLASS_FILES_TEACHER_ROLES,
  ASSIGNMENT_SUBMISSION_SELECT,
  CLASS_ASSIGNMENT_SELECT,
  getScopedClassIds,
  getLinkedStudentsForUser,
  type AssignmentSubmissionRow,
  type ClassAssignmentRow,
} from '@/lib/class-files'

export const maxDuration = 30

const idSchema = z.string().uuid()

const gradeSchema = z.object({
  score: z.number().min(0).max(999),
  feedback: z.string().max(2000).optional().nullable(),
})

async function loadSubmission(
  ctx: AuthContext,
  id: string
): Promise<{ submission: AssignmentSubmissionRow; assignment: ClassAssignmentRow } | null> {
  const { data } = await ctx.supabase
    .from('assignment_submissions')
    .select(ASSIGNMENT_SUBMISSION_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  const submission = data as AssignmentSubmissionRow

  const { data: assignmentData } = await ctx.supabase
    .from('class_assignments')
    .select(CLASS_ASSIGNMENT_SELECT)
    .eq('id', submission.assignment_id)
    .maybeSingle()
  if (!assignmentData) return null
  const assignment = assignmentData as ClassAssignmentRow

  const classIds = await getScopedClassIds(ctx.supabase, {
    userId: ctx.userId,
    role: ctx.role,
    schoolId: ctx.schoolId,
  })
  if (!classIds.includes(assignment.class_id)) return null

  return { submission, assignment }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    request,
    async (ctx) => {
      const { id } = await params
      if (!idSchema.safeParse(id).success) {
        return NextResponse.json({ error: 'شناسه نامعتبر است' }, { status: 400 })
      }

      const loaded = await loadSubmission(ctx, id)
      if (!loaded) {
        return NextResponse.json({ error: 'تحویل یافت نشد' }, { status: 404 })
      }

      if (ctx.role === 'student' || ctx.role === 'parent') {
        const linked = await getLinkedStudentsForUser(ctx.supabase, {
          userId: ctx.userId,
          role: ctx.role,
        })
        if (!linked.some((s) => s.id === loaded.submission.student_id)) {
          return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
        }
      } else if (!CLASS_FILES_TEACHER_ROLES.includes(ctx.role)) {
        return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
      }

      const signedUrl = await getSignedDownloadUrl(loaded.submission.file_path, 900)
      if (!signedUrl) {
        return NextResponse.json({ error: 'تولید لینک دانلود ناموفق بود' }, { status: 500 })
      }

      return NextResponse.json({
        submission: loaded.submission,
        signedUrl,
        expiresIn: 900,
      })
    },
    { roles: CLASS_FILES_ROLES, rateLimit: 'api_default' }
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    request,
    async (ctx) => {
      const { id } = await params
      if (!idSchema.safeParse(id).success) {
        return NextResponse.json({ error: 'شناسه نامعتبر است' }, { status: 400 })
      }

      if (!CLASS_FILES_TEACHER_ROLES.includes(ctx.role)) {
        return NextResponse.json({ error: 'فقط معلم می‌تواند نمره بدهد' }, { status: 403 })
      }

      let body: unknown
      try {
        body = await request.json()
      } catch {
        return NextResponse.json({ error: 'بدنه درخواست نامعتبر است' }, { status: 400 })
      }

      const parsed = gradeSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
          { status: 400 }
        )
      }

      const loaded = await loadSubmission(ctx, id)
      if (!loaded) {
        return NextResponse.json({ error: 'تحویل یافت نشد' }, { status: 404 })
      }

      const { assignment, submission } = loaded
      if (parsed.data.score > Number(assignment.max_score)) {
        return NextResponse.json(
          { error: `نمره نمی‌تواند بیشتر از ${assignment.max_score} باشد` },
          { status: 400 }
        )
      }

      const now = new Date().toISOString()
      let gradeId = submission.grade_id

      const gradePayload = {
        student_id: submission.student_id,
        subject: assignment.subject,
        score: parsed.data.score,
        max_score: assignment.max_score,
        exam_type: 'homework',
        comments: parsed.data.feedback?.trim() || null,
        exam_date: now.slice(0, 10),
        teacher_id: ctx.userId,
        class_id: assignment.class_id,
      }

      if (gradeId) {
        const { error: gradeErr } = await ctx.supabase
          .from('grades')
          .update(gradePayload)
          .eq('id', gradeId)
        if (gradeErr) {
          console.error('grades update error:', gradeErr)
          return NextResponse.json({ error: 'به‌روزرسانی کارنامه ناموفق بود' }, { status: 500 })
        }
      } else {
        const { data: gradeRow, error: gradeErr } = await ctx.supabase
          .from('grades')
          .insert(gradePayload)
          .select('id')
          .single()
        if (gradeErr || !gradeRow) {
          console.error('grades insert error:', gradeErr)
          return NextResponse.json({ error: 'ثبت نمره در کارنامه ناموفق بود' }, { status: 500 })
        }
        gradeId = gradeRow.id
      }

      const { data, error } = await ctx.supabase
        .from('assignment_submissions')
        .update({
          score: parsed.data.score,
          feedback: parsed.data.feedback?.trim() || null,
          status: 'graded',
          graded_at: now,
          graded_by: ctx.userId,
          grade_id: gradeId,
          updated_at: now,
        })
        .eq('id', id)
        .select(ASSIGNMENT_SUBMISSION_SELECT)
        .single()

      if (error) {
        console.error('grade submission error:', error)
        return NextResponse.json({ error: 'ثبت نمره ناموفق بود' }, { status: 500 })
      }

      return NextResponse.json({ submission: data as AssignmentSubmissionRow })
    },
    { roles: CLASS_FILES_TEACHER_ROLES, rateLimit: 'api_default' }
  )
}
