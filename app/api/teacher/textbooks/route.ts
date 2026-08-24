import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { deleteFromArvan } from '@/lib/arvan-storage'
import {
  TEXTBOOK_ROLES,
  TEXTBOOK_SELECT,
  TEXTBOOK_MIME,
  MAX_TEXTBOOK_BYTES,
  canUploadGrade,
  canManageAllSchoolGrades,
  getTeacherGrades,
  type TextbookRow,
} from '@/lib/teacher/textbooks'

export const maxDuration = 30

const confirmSchema = z.object({
  title: z.string().min(2, 'عنوان باید حداقل ۲ کاراکتر باشد').max(200),
  subject: z.string().max(100).optional().nullable(),
  grade: z.number().int().min(1).max(12),
  filePath: z
    .string()
    .min(10)
    .max(500)
    .regex(/^textbooks\//, 'مسیر فایل نامعتبر است'),
  fileSize: z.number().int().positive().max(MAX_TEXTBOOK_BYTES),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin' && ctx.role !== 'admin') {
        return NextResponse.json(
          { error: 'مدرسه کاربر مشخص نیست' },
          { status: 400 }
        )
      }

      const supabase = await createClient()
      const gradeParam = request.nextUrl.searchParams.get('grade')
      const gradeFilter = gradeParam ? Number.parseInt(gradeParam, 10) : null

      let query = supabase
        .from('textbooks')
        .select(TEXTBOOK_SELECT)
        .order('grade', { ascending: true })
        .order('title', { ascending: true })
        .limit(100)

      if (ctx.schoolId) {
        query = query.eq('school_id', ctx.schoolId)
      }

      if (gradeFilter && gradeFilter >= 1 && gradeFilter <= 12) {
        query = query.eq('grade', gradeFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('textbooks list error:', error)
        return NextResponse.json(
          { error: 'دریافت فهرست کتاب‌ها ناموفق بود' },
          { status: 500 }
        )
      }

      const grades = canManageAllSchoolGrades(ctx.role)
        ? Array.from({ length: 12 }, (_, i) => i + 1)
        : await getTeacherGrades(supabase, ctx.userId, ctx.role)

      return NextResponse.json({
        textbooks: (data || []) as TextbookRow[],
        grades,
        canUpload: grades.length > 0 || canManageAllSchoolGrades(ctx.role),
      })
    },
    { roles: TEXTBOOK_ROLES, rateLimit: 'api_default' }
  )
}

/** تأیید آپلود و ثبت metadata (بعد از PUT مستقیم به آروان) */
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId) {
        return NextResponse.json(
          { error: 'مدرسه کاربر مشخص نیست' },
          { status: 400 }
        )
      }

      let body: unknown
      try {
        body = await request.json()
      } catch {
        return NextResponse.json({ error: 'بدنه درخواست نامعتبر است' }, { status: 400 })
      }

      const parsed = confirmSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
          { status: 400 }
        )
      }

      const { title, subject, grade, filePath, fileSize } = parsed.data
      const supabase = await createClient()

      const allowed = await canUploadGrade(supabase, ctx.userId, ctx.role, grade)
      if (!allowed) {
        return NextResponse.json(
          { error: 'مجاز به آپلود برای این پایه نیستید' },
          { status: 403 }
        )
      }

      const expectedPrefix = `textbooks/${ctx.schoolId}/grade-${grade}/`
      if (!filePath.startsWith(expectedPrefix)) {
        return NextResponse.json({ error: 'مسیر فایل با مدرسه/پایه هم‌خوان نیست' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('textbooks')
        .insert({
          school_id: ctx.schoolId,
          grade,
          title: title.trim(),
          subject: subject?.trim() || null,
          file_path: filePath,
          file_size: fileSize,
          mime_type: TEXTBOOK_MIME,
          uploaded_by: ctx.userId,
        })
        .select(TEXTBOOK_SELECT)
        .single()

      if (error) {
        console.error('textbooks insert error:', error)
        await deleteFromArvan(filePath)
        return NextResponse.json(
          { error: 'ثبت کتاب در پایگاه داده ناموفق بود' },
          { status: 500 }
        )
      }

      return NextResponse.json({ textbook: data as TextbookRow }, { status: 201 })
    },
    { roles: TEXTBOOK_ROLES, rateLimit: 'api_default' }
  )
}
