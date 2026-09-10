import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/security/api-guard'
import { deleteFromArvan } from '@/lib/arvan-storage'
import {
  CLASS_FILES_ROLES,
  CLASS_FILES_TEACHER_ROLES,
  CLASS_MATERIAL_SELECT,
  classFilePathPrefix,
  isClassFileMime,
  maxBytesForMime,
  assertTeacherOwnsClass,
  getScopedClassIds,
  getScopedClasses,
  type ClassMaterialRow,
} from '@/lib/class-files'

export const maxDuration = 30

const confirmSchema = z.object({
  classId: z.string().uuid(),
  title: z.string().min(2, 'عنوان باید حداقل ۲ کاراکتر باشد').max(200),
  description: z.string().max(2000).optional().nullable(),
  filePath: z
    .string()
    .min(10)
    .max(500)
    .regex(/^class-files\//, 'مسیر فایل نامعتبر است'),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(3).max(120),
  originalName: z.string().min(1).max(200),
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
        return NextResponse.json({ materials: [], classes: [] })
      }

      const classFilter = request.nextUrl.searchParams.get('classId')
      const queryIds =
        classFilter && classIds.includes(classFilter) ? [classFilter] : classIds

      const { data, error } = await supabase
        .from('class_materials')
        .select(CLASS_MATERIAL_SELECT)
        .in('class_id', queryIds)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('class_materials list error:', error)
        return NextResponse.json({ error: 'دریافت منابع ناموفق بود' }, { status: 500 })
      }

      const classes = await getScopedClasses(supabase, {
        userId: ctx.userId,
        role: ctx.role,
        schoolId: ctx.schoolId,
      })

      return NextResponse.json({
        materials: (data || []) as ClassMaterialRow[],
        classes,
        canUpload: CLASS_FILES_TEACHER_ROLES.includes(ctx.role),
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
        return NextResponse.json({ error: 'فقط معلم می‌تواند منبع آپلود کند' }, { status: 403 })
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

      const { classId, title, description, filePath, fileSize, mimeType, originalName } =
        parsed.data

      if (!isClassFileMime(mimeType) || fileSize > maxBytesForMime(mimeType)) {
        return NextResponse.json({ error: 'نوع یا حجم فایل نامعتبر است' }, { status: 400 })
      }

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

      const expected = classFilePathPrefix(schoolId, classId, 'materials')
      if (!filePath.startsWith(expected)) {
        return NextResponse.json({ error: 'مسیر فایل با کلاس هم‌خوان نیست' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('class_materials')
        .insert({
          school_id: schoolId,
          class_id: classId,
          title: title.trim(),
          description: description?.trim() || null,
          file_path: filePath,
          file_size: fileSize,
          mime_type: mimeType,
          original_name: originalName,
          uploaded_by: ctx.userId,
        })
        .select(CLASS_MATERIAL_SELECT)
        .single()

      if (error) {
        console.error('class_materials insert error:', error)
        await deleteFromArvan(filePath)
        return NextResponse.json({ error: 'ثبت منبع ناموفق بود' }, { status: 500 })
      }

      return NextResponse.json({ material: data as ClassMaterialRow }, { status: 201 })
    },
    { roles: CLASS_FILES_TEACHER_ROLES, rateLimit: 'api_default' }
  )
}
