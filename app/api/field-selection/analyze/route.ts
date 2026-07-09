import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { AI_USER_ROLES } from '@/lib/security/sensitive-api-roles'

export async function POST(req: NextRequest) {
  return withAuth(
    req,
    async () => {
      try {
        const supabase = await createClient()
        const { student_id } = await req.json()

        if (!student_id) {
          return NextResponse.json({ error: 'student_id الزامی است' }, { status: 400 })
        }

        const { data, error } = await supabase.rpc('analyze_field_selection_ai', {
          p_student_id: student_id,
        })

        if (error) {
          console.error('خطا در تحلیل AI:', error)
          return NextResponse.json({ error: 'خطا در تحلیل' }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          recommendation: data,
        })
      } catch (error) {
        console.error('خطای سرور:', error)
        return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
      }
    },
    { roles: AI_USER_ROLES, rateLimit: 'ai_heavy' }
  )
}
