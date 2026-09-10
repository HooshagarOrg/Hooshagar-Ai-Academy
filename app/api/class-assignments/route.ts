import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/security/api-guard'
import { deleteFromArvan } from '@/lib/arvan-storage'
import {
  CLASS_FILES_ROLES,
  CLASS_FILES_TEACHER_ROLES,
  CLASS_ASSIGNMENT_SELECT,
  ASSIGNMENT_SUBMISSION_SELECT,
  classFilePathPrefix,
  isClassFileMime,
  maxBytesForMime,
  assertTeacherOwnsClass,
  getScopedClassIds,
  getScopedClasses,
  getLinkedStudentsForUser,
  type ClassAssignmentRow,
  type AssignmentSubmissionRow,
} from '@/lib/class-files'

export const maxDuration = 30

const createSchema = z.object({
  classId: z.string().uuid(),
  title: z.string().min(2).max(200),
  description: z.string().max(4000).optional().nullable(),
  subject: z.string().min(1).max(100),
  dueAt: z
    .string()
    .min(10)
    .max(40)
    .optional()
    .nullable(),
  maxScore: z.number().positive().max(999).default(20),
  promptFilePath: z
    .string()
    .regex(/^class-files\//)
    .max(500)
    .optional()
    .nullable(),
  promptFileSize: z.number().int().positive().optional().nullable(),
  promptMimeType: z.string().max(120).optional().nullable(),
  promptOriginalName: z.string().max(200).optional().nullable(),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const supabase = ctx.supabase
      const classIds = await getScopedClassIds(supabase, {
        userId: ctx.userId,
        role: ctx.role,
        schoolId: ctx.schoolId,
      })

      if (classIds.length === 0) {
        return NextResponse.json({ assignments: [], classes: [], students: [] })
      }

      const classFilter = request.nextUrl.searchParams.get('classId')
      const queryIds =
        classFilter && classIds.includes(classFilter) ? [classFilter] : classIds

      const { data, error } = await supabase
        .from('class_assignments')
        .select(CLASS_ASSIGNMENT_SELECT)
        .in('class_id', queryIds)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('class_assignments list error:', error)
        return NextResponse.json({ error: 'دریافت تکالیف ناموفق بود' }, { status: 500 })
      }

      const assignments = (data || []) as ClassAssignmentRow[]
      const assignmentIds = assignments.map((a) => a.id)

      let submissions: AssignmentSubmissionRow[] = []
      if (assignmentIds.length > 0) {
        let subQuery = supabase
          .from('assignment_submissions')
          .select(ASSIGNMENT_SUBMISSION_SELECT)
          .in('assignment_id', assignmentIds)

        if (ctx.role === 'student' || ctx.role === 'parent') {
          const linked = await getLinkedStudentsForUser(supabase, {
            userId: ctx.userId,
            role: ctx.role,
          })
          const studentIds = linked.map((s) => s.id)
          if (studentIds.length === 0) {
            submissions = []
          } else {
            const { data: subData } = await subQuery.in('student_id', studentIds)
            submissions = (subData || []) as AssignmentSubmissionRow[]
          }
        } else {
          const { data: subData } = await subQuery.limit(500)
          submissions = (subData || []) as AssignmentSubmissionRow[]
        }
      }

      const classes = await getScopedClasses(supabase, {
        userId: ctx.userId,
        role: ctx.role,
        schoolId: ctx.schoolId,
      })

      const students =
        ctx.role === 'student' || ctx.role === 'parent'
          ? await getLinkedStudentsForUser(supabase, {
              userId: ctx.userId,
              role: ctx.role,
            })
          : []

      return NextResponse.json({
        assignments,
        submissions,
        classes,
        students,
        canManage: CLASS_FILES_TEACHER_ROLES.includes(ctx.role),
      })
    },
    { roles: CLASS_FILES_ROLES, rateLimit: 'api_default' }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!CLASS_FILES_TEACHER_ROLES.includes(ctx.role)) {
        return NextResponse.json({ error: 'فقط معلم می‌تواند تکلیف بسازد' }, { status: 403 })
      }

      let body: unknown
      try {
        body = await request.json()
      } catch {
        return NextResponse.json({ error: 'بدنه درخواست نامعتبر است' }, { status: 400 })
      }

      const parsed = createSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
          { status: 400 }
        )
      }

      const {
        classId,
        title,
        description,
        subject,
        dueAt,
        maxScore,
        promptFilePath,
        promptFileSize,
        promptMimeType,
        promptOriginalName,
      } = parsed.data

      const supabase = ctx.supabase
      const owns = await assertTeacherOwnsClass(supabase, {
        userId: ctx.userId,
        role: ctx.role,
        schoolId: ctx.schoolId,
        classId,
      })
      if (!owns) {
        return NextResponse.json({ error: 'مجاز به این کلاس نیستید' }, { status: 403 })
      }

      const { data: cls } = await supabase
        .from('classes')
        .select('school_id')
        .eq('id', classId)
        .maybeSingle()

      const schoolId = cls?.school_id || ctx.schoolId
      if (!schoolId) {
        return NextResponse.json({ error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      if (promptFilePath) {
        if (
          !promptMimeType ||
          !promptFileSize ||
          !isClassFileMime(promptMimeType) ||
          promptFileSize > maxBytesForMime(promptMimeType)
        ) {
          return NextResponse.json({ error: 'فایل صورت‌مسئله نامعتبر است' }, { status: 400 })
        }
        const expected = classFilePathPrefix(schoolId, classId, 'prompts')
        if (!promptFilePath.startsWith(expected)) {
          return NextResponse.json({ error: 'مسیر فایل صورت‌مسئله نامعتبر است' }, { status: 400 })
        }
      }

      let dueAtIso: string | null = null
      if (dueAt) {
        const parsedDue = new Date(dueAt)
        if (Number.isNaN(parsedDue.getTime())) {
          return NextResponse.json({ error: 'مهلت نامعتبر است' }, { status: 400 })
        }
        dueAtIso = parsedDue.toISOString()
      }

      const { data, error } = await supabase
        .from('class_assignments')
        .insert({
          school_id: schoolId,
          class_id: classId,
          title: title.trim(),
          description: description?.trim() || null,
          subject: subject.trim(),
          due_at: dueAtIso,
          max_score: maxScore,
          prompt_file_path: promptFilePath || null,
          prompt_file_size: promptFilePath ? promptFileSize : null,
          prompt_mime_type: promptFilePath ? promptMimeType : null,
          prompt_original_name: promptFilePath ? promptOriginalName : null,
          created_by: ctx.userId,
        })
        .select(CLASS_ASSIGNMENT_SELECT)
        .single()

      if (error) {
        console.error('class_assignments insert error:', error)
        if (promptFilePath) await deleteFromArvan(promptFilePath)
        return NextResponse.json({ error: 'ثبت تکلیف ناموفق بود' }, { status: 500 })
      }

      return NextResponse.json({ assignment: data as ClassAssignmentRow }, { status: 201 })
    },
    { roles: CLASS_FILES_TEACHER_ROLES, rateLimit: 'api_default' }
  )
}
