import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard'

/**
 * GET /api/admin/classes?school_id=...
 * لیست کلاس‌ها برای فرم ساخت/ویرایش کاربر ادمین
 */
export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const admin = createServiceClient()
      const { searchParams } = new URL(request.url)
      const schoolId = searchParams.get('school_id')

      let query = admin
        .from('classes')
        .select('id, name, grade, school_id, teacher_id')
        .order('grade', { ascending: true })
        .limit(200)

      if (schoolId) {
        query = query.eq('school_id', schoolId)
      }

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ classes: data || [] })
    },
    { roles: ADMIN_ROLES, rateLimit: 'admin_action' }
  )
}
