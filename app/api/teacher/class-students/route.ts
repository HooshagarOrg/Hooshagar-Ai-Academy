import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'

const TEACHER_ROLES: AllowedRole[] = [
  'teacher',
  'art_teacher',
  'sports_teacher',
  'principal',
  'admin',
  'platform_admin',
]

const SPECIALTY_ROLES: AllowedRole[] = ['art_teacher', 'sports_teacher']

/**
 * GET /api/teacher/class-students
 * معلم کلاس: فقط دانش‌آموزان class_id کلاس(های) خودش.
 * هنر/ورزش: فهرست پایه‌محور داخل مدرسه (اگر کلاسی با teacher_id داشته باشند).
 * هرگز OR روی کل پایه برای معلم کلاس — دانش‌آموزان بدون کلاس («—») نباید دیده شوند.
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const supabase = await createClient()

      const { data: classes, error: classErr } = await supabase
        .from('classes')
        .select('id, name, grade')
        .eq('teacher_id', ctx.userId)
        .limit(20)

      if (classErr) {
        return NextResponse.json({ error: classErr.message }, { status: 500 })
      }

      const classIds = (classes || []).map((c) => c.id)
      const teacherGrades = [
        ...new Set((classes || []).map((c) => c.grade).filter((g): g is number => typeof g === 'number')),
      ]

      if (classIds.length === 0) {
        return NextResponse.json({ students: [], classes: [] })
      }

      let studentsQuery = supabase
        .from('students')
        .select('id, full_name, grade, class_id, parent_id, school_id')
        .order('full_name', { ascending: true })
        .limit(200)

      if (ctx.schoolId) {
        studentsQuery = studentsQuery.eq('school_id', ctx.schoolId)
      }

      const isSpecialty = SPECIALTY_ROLES.includes(ctx.role)
      if (isSpecialty && teacherGrades.length > 0) {
        studentsQuery = studentsQuery.in('grade', teacherGrades)
      } else {
        studentsQuery = studentsQuery.in('class_id', classIds)
      }

      const { data: students, error } = await studentsQuery

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const parentIds = [...new Set((students || []).map((s) => s.parent_id).filter(Boolean))] as string[]
      let parentNames = new Map<string, string>()
      if (parentIds.length > 0) {
        const { data: parents } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', parentIds)
        for (const p of parents || []) {
          parentNames.set(p.id, p.full_name || '')
        }
      }

      const classNameById = new Map((classes || []).map((c) => [c.id, c.name]))
      const missingClassIds = [
        ...new Set(
          (students || [])
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
        classes: classes || [],
        students: (students || []).map((s) => ({
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
