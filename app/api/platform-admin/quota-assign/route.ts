import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { secureErrorResponse } from '@/lib/security/error-handler'
import { withAuth } from '@/lib/security/api-guard'
import { PLATFORM_ADMIN_ROLES } from '@/lib/security/sensitive-api-roles'

const assignSchema = z.object({
  action:     z.enum(['assign', 'revoke', 'set_quota']),
  period_id:  z.string().uuid(),
  student_id: z.string().uuid().optional(),
  class_id:   z.string().uuid().optional(),
  note:       z.string().max(300).optional(),
  quota:      z.number().int().min(0).max(50).optional(),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const supabase = await createClient()

        const { searchParams } = new URL(request.url)
        const periodId = searchParams.get('period_id')
        if (!periodId) return NextResponse.json({ error: 'period_id الزامی است' }, { status: 400 })

        const { data: classes } = await supabase
          .from('lottery_classes')
          .select('id, class_name, teacher_name, grade, capacity, platform_quota, platform_assigned, enrolled_count')
          .eq('period_id', periodId)
          .order('grade').order('class_name')

        const { data: quotaResults } = await supabase
          .from('lottery_results')
          .select(`
            id, student_id, class_id, status,
            students!inner( student_number, profiles!inner(full_name) )
          `)
          .eq('period_id', periodId)
          .eq('assignment_type', 'platform_quota')

        const { data: notAssigned } = await supabase
          .from('lottery_results')
          .select(`
            student_id,
            students!inner( id, student_number, grade, profiles!inner(full_name) )
          `)
          .eq('period_id', periodId)
          .eq('status', 'not_assigned')

        return NextResponse.json({
          classes:      classes      || [],
          quota_assigned: quotaResults || [],
          not_assigned: notAssigned  || [],
        })
      } catch (error) {
        return secureErrorResponse(error, { context: 'GET quota-assign' })
      }
    },
    { roles: PLATFORM_ADMIN_ROLES }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const supabase = await createClient()

        const body = await request.json()
        const { action, period_id, student_id, class_id, note, quota } = assignSchema.parse(body)

        if (action === 'assign') {
          if (!student_id || !class_id) {
            return NextResponse.json({ error: 'student_id و class_id الزامی است' }, { status: 400 })
          }
          const { data, error } = await supabase.rpc('assign_platform_quota', {
            p_period_id:  period_id,
            p_student_id: student_id,
            p_class_id:   class_id,
            p_note:       note || null,
          })
          if (error) throw error
          if (!data.success) return NextResponse.json({ error: data.error }, { status: 400 })
          return NextResponse.json({ success: true, message: data.message })
        }

        if (action === 'revoke') {
          if (!student_id) {
            return NextResponse.json({ error: 'student_id الزامی است' }, { status: 400 })
          }
          const { data, error } = await supabase.rpc('revoke_platform_quota', {
            p_period_id:  period_id,
            p_student_id: student_id,
          })
          if (error) throw error
          if (!data.success) return NextResponse.json({ error: data.error }, { status: 400 })
          return NextResponse.json({ success: true, message: data.message })
        }

        if (action === 'set_quota') {
          if (!class_id || quota === undefined) {
            return NextResponse.json({ error: 'class_id و quota الزامی است' }, { status: 400 })
          }
          const { error } = await supabase
            .from('lottery_classes')
            .update({ platform_quota: quota })
            .eq('id', class_id)
            .eq('period_id', period_id)
          if (error) throw error
          return NextResponse.json({ success: true, message: `سهمیه کلاس به ${quota} تنظیم شد` })
        }

        return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 })
        }
        return secureErrorResponse(error, { context: 'POST quota-assign' })
      }
    },
    { roles: PLATFORM_ADMIN_ROLES }
  )
}
