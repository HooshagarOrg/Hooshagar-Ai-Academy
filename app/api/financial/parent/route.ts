import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'

const ROLES: AllowedRole[] = ['parent']

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      const { data: children, error: childrenError } = await ctx.supabase
        .from('students')
        .select('id, full_name, school_id')
        .or(
          `parent_id.eq.${ctx.userId},father_user_id.eq.${ctx.userId},mother_user_id.eq.${ctx.userId}`
        )
        .order('full_name')
        .limit(20)

      if (childrenError) {
        return NextResponse.json(
          { children: [], error: childrenError.message },
          { status: 500 }
        )
      }

      if (!children || children.length === 0) {
        return NextResponse.json({ children: [] })
      }

      const childIds = children.map((c) => c.id)

      const [tuitionRes, paymentsRes] = await Promise.all([
        ctx.supabase
          .from('student_tuition')
          .select('student_id, total_due, discount, notes')
          .in('student_id', childIds),
        ctx.supabase
          .from('tuition_payments')
          .select('id, student_id, amount, paid_at, method, receipt_no, notes')
          .in('student_id', childIds)
          .order('paid_at', { ascending: false })
          .limit(100),
      ])

      if (tuitionRes.error || paymentsRes.error) {
        return NextResponse.json(
          {
            children: [],
            error: tuitionRes.error?.message || paymentsRes.error?.message || 'خطا',
          },
          { status: 500 }
        )
      }

      const tuitionMap = new Map(
        (tuitionRes.data || []).map((t) => [t.student_id, t] as const)
      )
      const paymentsByStudent = new Map<string, typeof paymentsRes.data>()
      for (const p of paymentsRes.data || []) {
        const list = paymentsByStudent.get(p.student_id) || []
        list.push(p)
        paymentsByStudent.set(p.student_id, list)
      }

      const result = children.map((child) => {
        const t = tuitionMap.get(child.id)
        const payments = paymentsByStudent.get(child.id) || []
        const totalDue = Number(t?.total_due ?? 0)
        const discount = Number(t?.discount ?? 0)
        const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
        const remaining = Math.max(0, totalDue - discount - paid)
        return {
          student_id: child.id,
          full_name: child.full_name,
          total_due: totalDue,
          discount,
          paid,
          remaining,
          notes: t?.notes ?? null,
          payments,
        }
      })

      return NextResponse.json({ children: result })
    },
    { roles: ROLES, rateLimit: 'api_default' }
  )
}
