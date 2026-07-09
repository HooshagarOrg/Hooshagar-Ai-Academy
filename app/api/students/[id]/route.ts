import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import {
  STUDENT_DATA_ROLES,
  STUDENT_DELETE_ROLES,
} from '@/lib/security/sensitive-api-roles'

const STUDENT_COLUMNS =
  'id, full_name, grade, class_id, school_id, student_number, user_id, parent_id, education_stage, can_login, created_at'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    request,
    async () => {
      try {
        const supabase = await createClient()
        const { data, error } = await supabase
          .from('students')
          .select(STUDENT_COLUMNS)
          .eq('id', params.id)
          .single()

        if (error) {
          return NextResponse.json({ error: 'دانش‌آموز یافت نشد' }, { status: 404 })
        }

        return NextResponse.json({ student: data })
      } catch {
        return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
      }
    },
    { roles: STUDENT_DATA_ROLES }
  )
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    request,
    async () => {
      try {
        const supabase = await createClient()
        const { error } = await supabase.from('students').delete().eq('id', params.id)

        if (error) {
          return NextResponse.json({ error: 'حذف ناموفق بود' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      } catch {
        return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
      }
    },
    { roles: STUDENT_DELETE_ROLES }
  )
}
