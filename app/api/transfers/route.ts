import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, STAFF_ROLES } from '@/lib/security/api-guard'
import type { TransferRequest, CreateTransferRequestInput } from '@/lib/types/academic.types'

const createTransferSchema = z.object({
  student_id: z.string().uuid(),
  from_school_id: z.string().uuid(),
  from_grade: z.number().int().min(1).max(12),
  to_school_id: z.string().uuid(),
  to_grade: z.number().int().min(1).max(12),
  request_reason: z.string().optional(),
  transfer_all_data: z.boolean().default(true),
})

/**
 * GET: دریافت لیست درخواست‌های انتقال
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
  try {
    const supabase = await createServerClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const student_id = searchParams.get('student_id')

    let query = supabase
      .from('transfer_requests')
      .select(`
        *,
        student:students!inner(first_name, last_name),
        from_school:schools!transfer_requests_from_school_id_fkey(name),
        to_school:schools!transfer_requests_to_school_id_fkey(name),
        requester:profiles!transfer_requests_requested_by_fkey(first_name, last_name),
        approver:profiles!transfer_requests_approved_by_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (student_id) {
      query = query.eq('student_id', student_id)
    }

    const { data: transfers, error } = await query

    if (error) throw error

    // فرمت کردن داده‌ها
    const formatted = transfers?.map((t: any) => ({
      ...t,
      student_name: `${t.student.first_name} ${t.student.last_name}`,
      from_school_name: t.from_school?.name || 'نامشخص',
      to_school_name: t.to_school?.name || 'نامشخص',
      requested_by_name: t.requester ? `${t.requester.first_name} ${t.requester.last_name}` : 'نامشخص',
      approved_by_name: t.approver ? `${t.approver.first_name} ${t.approver.last_name}` : null,
    }))

    return NextResponse.json({
      success: true,
      data: formatted,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    console.error('خطا در دریافت درخواست‌های انتقال:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
  }, { roles: STAFF_ROLES })
}

/**
 * POST: ثبت درخواست انتقال جدید
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    // بررسی نقش
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'کاربر احراز هویت نشده است' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = createTransferSchema.parse(body) as CreateTransferRequestInput

    // ایجاد درخواست
    const { data: newTransfer, error } = await supabase
      .from('transfer_requests')
      .insert([
        {
          ...validated,
          requested_by: user.id,
          status: 'pending',
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: newTransfer as TransferRequest,
      message: 'درخواست انتقال با موفقیت ثبت شد',
    })
  } catch (error: any) {
    console.error('خطا در ثبت درخواست انتقال:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'خطای سرور' },
      { status: 500 }
    )
  }
}





