import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // بررسی احراز هویت
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 })
    }

    const { student_id } = await req.json()

    if (!student_id) {
      return NextResponse.json({ error: 'student_id الزامی است' }, { status: 400 })
    }

    // اجرای تحلیل AI
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
}

