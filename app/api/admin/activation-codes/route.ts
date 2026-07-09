import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard'

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const supabase = await createServerSupabaseClient()

        const { data: codes, error } = await supabase
          .from('activation_codes')
          .select(`
            *,
            student:students(full_name, grade),
            school:schools(name)
          `)
          .eq('school_id', ctx.schoolId)
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) {
          console.error('Fetch codes error:', error)
          return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, codes })
      } catch (error) {
        console.error('Get activation codes error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
      }
    },
    { roles: ADMIN_ROLES }
  )
}
