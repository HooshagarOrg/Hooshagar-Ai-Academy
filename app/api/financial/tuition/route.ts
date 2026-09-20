import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, type AllowedRole } from '@/lib/security/api-guard'

const ROLES: AllowedRole[] = ['financial_vp', 'principal', 'admin', 'platform_admin']

const paymentSchema = z.object({
  action: z.literal('payment'),
  student_id: z.string().uuid('شناسه دانش‌آموز نامعتبر است'),
  amount: z.number().int().positive('مبلغ باید بیشتر از صفر باشد'),
  paid_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ نامعتبر است'),
  method: z.string().trim().max(100).optional().nullable(),
  receipt_no: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
})

const tuitionSchema = z.object({
  action: z.literal('tuition'),
  student_id: z.string().uuid('شناسه دانش‌آموز نامعتبر است'),
  total_due: z.number().int().min(0, 'مبلغ نامعتبر است'),
  discount: z.number().int().min(0, 'تخفیف نامعتبر است').optional().default(0),
  notes: z.string().trim().max(2000).optional().nullable(),
})

const settingsSchema = z.object({
  action: z.literal('settings'),
  academic_year: z.string().trim().max(50).optional().nullable(),
  base_tuition: z.number().int().min(0).optional().default(0),
  with_service_tuition: z.number().int().min(0).optional().default(0),
  registration_fee: z.number().int().min(0).optional().default(0),
})

const postSchema = z.discriminatedUnion('action', [
  paymentSchema,
  tuitionSchema,
  settingsSchema,
])

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId && ctx.role !== 'platform_admin') {
        return NextResponse.json(
          { settings: null, balances: [], payments: [], error: 'مدرسه مشخص نیست' },
          { status: 400 }
        )
      }

      const schoolId = ctx.schoolId
      if (!schoolId) {
        return NextResponse.json({ settings: null, balances: [], payments: [] })
      }

      const [settingsRes, tuitionRes, paymentsRes, studentsRes] = await Promise.all([
        ctx.supabase
          .from('tuition_settings')
          .select(
            'id, school_id, academic_year, base_tuition, with_service_tuition, registration_fee, updated_at'
          )
          .eq('school_id', schoolId)
          .maybeSingle(),
        ctx.supabase
          .from('student_tuition')
          .select('id, student_id, total_due, discount, notes')
          .eq('school_id', schoolId)
          .limit(500),
        ctx.supabase
          .from('tuition_payments')
          .select('id, student_id, amount, paid_at, method, receipt_no, notes, created_at')
          .eq('school_id', schoolId)
          .order('paid_at', { ascending: false })
          .limit(200),
        ctx.supabase
          .from('students')
          .select('id, full_name')
          .eq('school_id', schoolId)
          .order('full_name')
          .limit(500),
      ])

      if (settingsRes.error || tuitionRes.error || paymentsRes.error || studentsRes.error) {
        const msg =
          settingsRes.error?.message ||
          tuitionRes.error?.message ||
          paymentsRes.error?.message ||
          studentsRes.error?.message ||
          'خطای دریافت داده'
        return NextResponse.json(
          { settings: null, balances: [], payments: [], error: msg },
          { status: 500 }
        )
      }

      const paidByStudent = new Map<string, number>()
      for (const p of paymentsRes.data || []) {
        paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) || 0) + Number(p.amount))
      }

      const tuitionByStudent = new Map(
        (tuitionRes.data || []).map((t) => [t.student_id, t] as const)
      )

      const balances = (studentsRes.data || []).map((s) => {
        const t = tuitionByStudent.get(s.id)
        const totalDue = Number(t?.total_due ?? 0)
        const discount = Number(t?.discount ?? 0)
        const paid = paidByStudent.get(s.id) || 0
        const remaining = Math.max(0, totalDue - discount - paid)
        return {
          student_id: s.id,
          full_name: s.full_name,
          total_due: totalDue,
          discount,
          paid,
          remaining,
          notes: t?.notes ?? null,
          tuition_id: t?.id ?? null,
        }
      })

      return NextResponse.json({
        settings: settingsRes.data,
        balances,
        payments: paymentsRes.data || [],
      })
    },
    { roles: ROLES, rateLimit: 'api_default' }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      if (!ctx.schoolId) {
        return NextResponse.json({ error: 'مدرسه مشخص نیست' }, { status: 400 })
      }

      const parsed = postSchema.safeParse(await request.json())
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || 'داده‌های نامعتبر' },
          { status: 400 }
        )
      }

      const body = parsed.data

      if (body.action === 'settings') {
        const { data: existing } = await ctx.supabase
          .from('tuition_settings')
          .select('id')
          .eq('school_id', ctx.schoolId)
          .maybeSingle()

        const payload = {
          school_id: ctx.schoolId,
          academic_year: body.academic_year || null,
          base_tuition: body.base_tuition,
          with_service_tuition: body.with_service_tuition,
          registration_fee: body.registration_fee,
          updated_at: new Date().toISOString(),
        }

        const query = existing
          ? ctx.supabase
              .from('tuition_settings')
              .update(payload)
              .eq('id', existing.id)
              .select(
                'id, school_id, academic_year, base_tuition, with_service_tuition, registration_fee, updated_at'
              )
              .single()
          : ctx.supabase
              .from('tuition_settings')
              .insert(payload)
              .select(
                'id, school_id, academic_year, base_tuition, with_service_tuition, registration_fee, updated_at'
              )
              .single()

        const { data, error } = await query
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ settings: data })
      }

      if (body.action === 'tuition') {
        const { data: student } = await ctx.supabase
          .from('students')
          .select('id, school_id')
          .eq('id', body.student_id)
          .eq('school_id', ctx.schoolId)
          .maybeSingle()

        if (!student) {
          return NextResponse.json({ error: 'دانش‌آموز در این مدرسه یافت نشد' }, { status: 404 })
        }

        const { data: existing } = await ctx.supabase
          .from('student_tuition')
          .select('id')
          .eq('student_id', body.student_id)
          .maybeSingle()

        const payload = {
          student_id: body.student_id,
          school_id: ctx.schoolId,
          total_due: body.total_due,
          discount: body.discount,
          notes: body.notes || null,
        }

        const query = existing
          ? ctx.supabase
              .from('student_tuition')
              .update(payload)
              .eq('id', existing.id)
              .select('id, student_id, total_due, discount, notes')
              .single()
          : ctx.supabase
              .from('student_tuition')
              .insert(payload)
              .select('id, student_id, total_due, discount, notes')
              .single()

        const { data, error } = await query
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ tuition: data })
      }

      // payment
      const { data: student } = await ctx.supabase
        .from('students')
        .select('id')
        .eq('id', body.student_id)
        .eq('school_id', ctx.schoolId)
        .maybeSingle()

      if (!student) {
        return NextResponse.json({ error: 'دانش‌آموز در این مدرسه یافت نشد' }, { status: 404 })
      }

      const { data, error } = await ctx.supabase
        .from('tuition_payments')
        .insert({
          student_id: body.student_id,
          school_id: ctx.schoolId,
          amount: body.amount,
          paid_at: body.paid_at,
          method: body.method || null,
          receipt_no: body.receipt_no || null,
          notes: body.notes || null,
          recorded_by: ctx.userId,
        })
        .select('id, student_id, amount, paid_at, method, receipt_no, notes, created_at')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ payment: data }, { status: 201 })
    },
    { roles: ROLES, rateLimit: 'api_default' }
  )
}
