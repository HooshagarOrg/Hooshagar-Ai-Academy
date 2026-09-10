import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/security/api-guard'
import { generateClassFilePath, getSignedUploadUrl } from '@/lib/arvan-storage'
import {
  CLASS_FILES_ROLES,
  CLASS_FILE_MIME,
  classFilePathPrefix,
  isClassFileMime,
  maxBytesForMime,
  assertTeacherOwnsClass,
  getLinkedStudentsForUser,
  type ClassFileKind,
} from '@/lib/class-files'

export const maxDuration = 30

const presignSchema = z.object({
  kind: z.enum(['materials', 'prompts', 'submissions']),
  classId: z.string().uuid(),
  assignmentId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  fileName: z.string().min(1).max(200),
  fileSize: z.number().int().positive(),
  mimeType: z.enum(CLASS_FILE_MIME as unknown as [string, ...string[]]),
})

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin') {
        return NextResponse.json({ error: 'مدرسه کاربر مشخص نیست' }, { status: 400 })
      }

      let body: unknown
      try {
        body = await request.json()
      } catch {
        return NextResponse.json({ error: 'بدنه درخواست نامعتبر است' }, { status: 400 })
      }

      const parsed = presignSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
          { status: 400 }
        )
      }

      const { kind, classId, assignmentId, studentId, fileName, fileSize, mimeType } = parsed.data

      if (!isClassFileMime(mimeType)) {
        return NextResponse.json({ error: 'فرمت فایل مجاز نیست' }, { status: 400 })
      }

      const maxBytes = maxBytesForMime(mimeType)
      if (fileSize > maxBytes) {
        const mb = Math.round(maxBytes / (1024 * 1024))
        return NextResponse.json(
          { error: `حجم فایل نباید بیشتر از ${mb} مگابایت باشد` },
          { status: 400 }
        )
      }

      const supabase = ctx.supabase

      if (kind === 'materials' || kind === 'prompts') {
        const owns = await assertTeacherOwnsClass(supabase, {
          userId: ctx.userId,
          role: ctx.role,
          schoolId: ctx.schoolId,
          classId,
        })
        if (!owns) {
          return NextResponse.json({ error: 'مجاز به آپلود برای این کلاس نیستید' }, { status: 403 })
        }
      } else {
        if (!assignmentId || !studentId) {
          return NextResponse.json(
            { error: 'برای تحویل، شناسه تکلیف و دانش‌آموز الزامی است' },
            { status: 400 }
          )
        }
        if (ctx.role !== 'student' && ctx.role !== 'parent') {
          return NextResponse.json({ error: 'فقط دانش‌آموز یا والد می‌تواند تحویل دهد' }, { status: 403 })
        }

        const linked = await getLinkedStudentsForUser(supabase, {
          userId: ctx.userId,
          role: ctx.role,
        })
        const student = linked.find((s) => s.id === studentId)
        if (!student || student.class_id !== classId) {
          return NextResponse.json({ error: 'این دانش‌آموز به شما مرتبط نیست' }, { status: 403 })
        }

        const { data: assignment } = await supabase
          .from('class_assignments')
          .select('id, class_id')
          .eq('id', assignmentId)
          .maybeSingle()

        if (!assignment || assignment.class_id !== classId) {
          return NextResponse.json({ error: 'تکلیف یافت نشد' }, { status: 404 })
        }
      }

      const schoolId = ctx.schoolId
      if (!schoolId) {
        const { data: cls } = await supabase
          .from('classes')
          .select('school_id')
          .eq('id', classId)
          .maybeSingle()
        if (!cls?.school_id) {
          return NextResponse.json({ error: 'مدرسه کلاس مشخص نیست' }, { status: 400 })
        }
        return presignFor(cls.school_id, classId, kind, fileName, mimeType, fileSize)
      }

      return presignFor(schoolId, classId, kind, fileName, mimeType, fileSize)
    },
    { roles: CLASS_FILES_ROLES, rateLimit: 'api_default' }
  )
}

async function presignFor(
  schoolId: string,
  classId: string,
  kind: ClassFileKind,
  fileName: string,
  mimeType: string,
  fileSize: number
): Promise<NextResponse> {
  const filePath = generateClassFilePath(schoolId, classId, kind, fileName)
  const expected = classFilePathPrefix(schoolId, classId, kind)
  if (!filePath.startsWith(expected)) {
    return NextResponse.json({ error: 'مسیر فایل نامعتبر است' }, { status: 400 })
  }

  const uploadUrl = await getSignedUploadUrl(filePath, mimeType, 900)
  if (!uploadUrl) {
    return NextResponse.json({ error: 'تولید لینک آپلود ناموفق بود' }, { status: 500 })
  }

  return NextResponse.json({
    uploadUrl,
    filePath,
    fileSize,
    contentType: mimeType,
    expiresIn: 900,
  })
}
