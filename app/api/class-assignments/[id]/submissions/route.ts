import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AuthContext } from '@/lib/security/api-guard'
import { deleteFromArvan } from '@/lib/arvan-storage'
import {
  CLASS_FILES_ROLES,
  CLASS_ASSIGNMENT_SELECT,
  ASSIGNMENT_SUBMISSION_SELECT,
  classFilePathPrefix,
  isClassFileMime,
  maxBytesForMime,
  getScopedClassIds,
  getLinkedStudentsForUser,
  submissionStatus,
  type ClassAssignmentRow,
  type AssignmentSubmissionRow,
} from '@/lib/class-files'

export const maxDuration = 30

const idSchema = z.string().uuid()

const submitSchema = z.object({
  studentId: z.string().uuid(),
  filePath: z.string().regex(/^class-files\//).max(500),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(3).max(120),
  originalName: z.string().min(1).max(200),
})

async function loadAssignment(ctx: AuthContext, id: string): Promise<ClassAssignmentRow | null> {
  const classIds = await getScopedClassIds(ctx.supabase, {
    userId: ctx.userId,
    role: ctx.role,
    schoolId: ctx.schoolId,
  })
  const { data } = await ctx.supabase
    .from('class_assignments')
    .select(CLASS_ASSIGNMENT_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  const row = data as ClassAssignmentRow
  if (!classIds.includes(row.class_id)) return null
  return row
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

      const assignment = await loadAssignment(ctx, id)
      if (!assignment) {
        return NextResponse.json({ error: 'تکلیف یافت نشد' }, { status: 404 })
      }

      let query = ctx.supabase
        .from('assignment_submissions')
        .select(ASSIGNMENT_SUBMISSION_SELECT)
        .eq('assignment_id', id)
        .order('submitted_at', { ascending: false })

      if (ctx.role === 'student' || ctx.role === 'parent') {
        const linked = await getLinkedStudentsForUser(ctx.supabase, {
          userId: ctx.userId,
          role: ctx.role,
        })
        const studentIds = linked.map((s) => s.id)
        if (studentIds.length === 0) {
          return NextResponse.json({ assignment, submissions: [] })
        }
        query = query.in('student_id', studentIds)
      }

      const { data, error } = await query.limit(200)
      if (error) {
        console.error('submissions list error:', error)
        return NextResponse.json({ error: 'دریافت تحویل‌ها ناموفق بود' }, { status: 500 })
      }

      const submissions = (data || []) as AssignmentSubmissionRow[]
      const studentIds = [...new Set(submissions.map((s) => s.student_id))]
      let names: Record<string, string> = {}
      if (studentIds.length > 0) {
        const { data: students } = await ctx.supabase
          .from('students')
          .select('id, full_name')
          .in('id', studentIds)
        for (const s of students || []) {
          names[s.id] = s.full_name || 'دانش‌آموز'
        }
      }

      return NextResponse.json({
        assignment,
        submissions: submissions.map((s) => ({
          ...s,
          student_name: names[s.student_id] || 'دانش‌آموز',
        })),
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

      if (ctx.role !== 'student' && ctx.role !== 'parent') {
        return NextResponse.json({ error: 'فقط دانش‌آموز یا والد می‌تواند تحویل دهد' }, { status: 403 })
      }

      let body: unknown
      try {
        body = await request.json()
      } catch {
        return NextResponse.json({ error: 'بدنه درخواست نامعتبر است' }, { status: 400 })
      }

      const parsed = submitSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
          { status: 400 }
        )
      }

      const { studentId, filePath, fileSize, mimeType, originalName } = parsed.data
      if (!isClassFileMime(mimeType) || fileSize > maxBytesForMime(mimeType)) {
        return NextResponse.json({ error: 'نوع یا حجم فایل نامعتبر است' }, { status: 400 })
      }

      const assignment = await loadAssignment(ctx, id)
      if (!assignment) {
        return NextResponse.json({ error: 'تکلیف یافت نشد' }, { status: 404 })
      }

      const linked = await getLinkedStudentsForUser(ctx.supabase, {
        userId: ctx.userId,
        role: ctx.role,
      })
      const student = linked.find((s) => s.id === studentId)
      if (!student || student.class_id !== assignment.class_id) {
        return NextResponse.json({ error: 'این دانش‌آموز به این تکلیف مرتبط نیست' }, { status: 403 })
      }

      const expected = classFilePathPrefix(assignment.school_id, assignment.class_id, 'submissions')
      if (!filePath.startsWith(expected)) {
        return NextResponse.json({ error: 'مسیر فایل نامعتبر است' }, { status: 400 })
      }

      const now = new Date()
      const status = submissionStatus(assignment.due_at, now)

      const { data: existing } = await ctx.supabase
        .from('assignment_submissions')
        .select('id, status, file_path')
        .eq('assignment_id', id)
        .eq('student_id', studentId)
        .maybeSingle()

      if (existing?.status === 'graded') {
        await deleteFromArvan(filePath)
        return NextResponse.json(
          { error: 'این تکلیف نمره داده شده و قابل تغییر نیست' },
          { status: 409 }
        )
      }

      if (existing) {
        const oldPath = existing.file_path
        const { data, error } = await ctx.supabase
          .from('assignment_submissions')
          .update({
            file_path: filePath,
            file_size: fileSize,
            mime_type: mimeType,
            original_name: originalName,
            submitted_by: ctx.userId,
            submitted_at: now.toISOString(),
            status,
            updated_at: now.toISOString(),
          })
          .eq('id', existing.id)
          .select(ASSIGNMENT_SUBMISSION_SELECT)
          .single()

        if (error) {
          console.error('submission update error:', error)
          await deleteFromArvan(filePath)
          return NextResponse.json({ error: 'ثبت تحویل ناموفق بود' }, { status: 500 })
        }

        if (oldPath && oldPath !== filePath) {
          await deleteFromArvan(oldPath)
        }

        return NextResponse.json({ submission: data as AssignmentSubmissionRow })
      }

      const { data, error } = await ctx.supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: id,
          student_id: studentId,
          file_path: filePath,
          file_size: fileSize,
          mime_type: mimeType,
          original_name: originalName,
          submitted_by: ctx.userId,
          submitted_at: now.toISOString(),
          status,
        })
        .select(ASSIGNMENT_SUBMISSION_SELECT)
        .single()

      if (error) {
        console.error('submission insert error:', error)
        await deleteFromArvan(filePath)
        return NextResponse.json({ error: 'ثبت تحویل ناموفق بود' }, { status: 500 })
      }

      return NextResponse.json({ submission: data as AssignmentSubmissionRow }, { status: 201 })
    },
    { roles: CLASS_FILES_ROLES, rateLimit: 'api_default' }
  )
}
