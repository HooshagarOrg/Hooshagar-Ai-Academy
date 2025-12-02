import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const approveSchema = z.object({
  approved: z.boolean(),
  rejection_reason: z.string().optional(),
})

/**
 * POST: تأیید یا رد درخواست انتقال
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'فقط مدیران می‌توانند درخواست را تأیید کنند' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { approved, rejection_reason } = approveSchema.parse(body)

    // دریافت اطلاعات درخواست
    const { data: transfer, error: fetchError } = await supabase
      .from('transfer_requests')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !transfer) {
      return NextResponse.json(
        { success: false, error: 'درخواست انتقال یافت نشد' },
        { status: 404 }
      )
    }

    if (approved) {
      // تأیید انتقال
      const { error: updateError } = await supabase
        .from('transfer_requests')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      // اجرای انتقال
      if (transfer.transfer_all_data) {
        const { error: transferError } = await supabase.rpc('transfer_student_data', {
          p_student_id: transfer.student_id,
          p_from_school_id: transfer.from_school_id,
          p_to_school_id: transfer.to_school_id,
          p_to_grade: transfer.to_grade,
        })

        if (transferError) {
          console.error('خطا در انتقال داده‌ها:', transferError)
          throw transferError
        }

        // به‌روزرسانی وضعیت انتقال داده
        await supabase
          .from('transfer_requests')
          .update({
            data_transferred: true,
            transferred_at: new Date().toISOString(),
            status: 'completed',
          })
          .eq('id', params.id)
      }

      return NextResponse.json({
        success: true,
        message: 'درخواست انتقال با موفقیت تأیید و انجام شد',
      })
    } else {
      // رد انتقال
      const { error: updateError } = await supabase
        .from('transfer_requests')
        .update({
          status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason,
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: 'درخواست انتقال رد شد',
      })
    }
  } catch (error: any) {
    console.error('خطا در تأیید/رد انتقال:', error)

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

