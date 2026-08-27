import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'
import { listStudentsForTeacher } from '@/lib/teacher/class-scope'

const TEACHER_ROLES: AllowedRole[] = [
  'teacher',
  'art_teacher',
  'sports_teacher',
  'principal',
  'admin',
  'platform_admin',
]

/**
 * GET /api/teacher/class-students
 * تنها فهرست دانش‌آموز معلم — از lib/teacher/class-scope.ts
 * معلم کلاس: فقط دانش‌آموزان class_id کلاس(های) خودش.
 * هنر/ورزش: فهرست پایه‌محور داخل مدرسه (اگر کلاسی با teacher_id داشته باشند).
 * هرگز OR روی کل پایه برای معلم کلاس — دانش‌آموزان بدون کلاس («—») نباید دیده شوند.
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const supabase = ctx.supabase

      let classes
      let students
      try {
        const listed = await listStudentsForTeacher(supabase, {
          teacherId: ctx.userId,
          role: ctx.role,
          schoolId: ctx.schoolId,
        })
        classes = listed.classes
        students = listed.students
      } catch (err) {
        const message = err instanceof Error ? err.message : 'خطا در دریافت دانش‌آموزان'
        return NextResponse.json({ error: message }, { status: 500 })
      }

      const parentIds = [...new Set(students.map((s) => s.parent_id).filter(Boolean))] as string[]
      const parentNames = new Map<string, string>()
      if (parentIds.length > 0) {
        const { data: parents } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', parentIds)
        for (const p of parents || []) {
          parentNames.set(p.id, p.full_name || '')
        }
      }

      const classNameById = new Map(classes.map((c) => [c.id, c.name || '']))
      const missingClassIds = [
        ...new Set(
          students
            .map((s) => s.class_id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0 && !classNameById.has(id))
        ),
      ]
      if (missingClassIds.length > 0) {
        const { data: extraClasses } = await supabase
          .from('classes')
          .select('id, name')
          .in('id', missingClassIds)
        for (const c of extraClasses || []) {
          classNameById.set(c.id, c.name)
        }
      }

      return NextResponse.json({
        classes,
        students: students.map((s) => ({
          id: s.id,
          name: s.full_name,
          grade: s.grade,
          classId: s.class_id,
          className: s.class_id ? classNameById.get(s.class_id) || '' : '',
          parentId: s.parent_id,
          parentName: s.parent_id ? parentNames.get(s.parent_id) || '' : '',
        })),
      })
    },
    { roles: TEACHER_ROLES, rateLimit: 'api_default' }
  )
}
