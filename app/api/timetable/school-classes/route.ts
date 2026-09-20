import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/security/api-guard'

/** لیست کلاس‌های مدرسه برای معاون آموزشی / مدیر / ادمین */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const allowed = [
        'educational_vp',
        'principal',
        'admin',
        'platform_admin',
        'teacher',
        'disciplinary_vp',
        'nurturing_vp',
        'counselor',
        'health_vp',
      ]
      if (!allowed.includes(ctx.role)) {
        return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
      }

      let query = ctx.supabase
        .from('classes')
        .select('id, name, grade, teacher_id, academic_year')
        .order('grade', { ascending: true })
        .limit(200)

      if (ctx.role === 'teacher') {
        query = query.eq('teacher_id', ctx.userId)
      } else if (ctx.role !== 'platform_admin' && ctx.schoolId) {
        query = query.eq('school_id', ctx.schoolId)
      }

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json({ classes: data || [] })
    },
    {}
  )
}
