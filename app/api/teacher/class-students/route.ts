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

/**
 * GET /api/teacher/class-students
 * دانش‌آموزان کلاس(های) معلم جاری
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
      if (classIds.length === 0) {
        return NextResponse.json({ students: [], classes: [] })
      }

      const { data: students, error } = await supabase
        .from('students')
        .select('id, full_name, grade, class_id, parent_id')
        .in('class_id', classIds)
        .order('full_name', { ascending: true })
        .limit(200)

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

      return NextResponse.json({
        classes: classes || [],
        students: (students || []).map((s) => ({
          id: s.id,
          name: s.full_name,
          grade: s.grade,
          classId: s.class_id,
          className: s.class_id ? classNameById.get(s.class_id) || '' : '',
          parentName: s.parent_id ? parentNames.get(s.parent_id) || '' : '',
        })),
      })
    },
    { roles: TEACHER_ROLES, rateLimit: 'api_default' }
  )
}
