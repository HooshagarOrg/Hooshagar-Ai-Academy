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

    // پیش‌بینی رتبه با ML
    const { data, error } = await supabase.rpc('predict_konkur_rank', {
      p_student_id: student_id,
    })

    if (error) {
      console.error('خطا در پیش‌بینی:', error)
      return NextResponse.json({ error: 'خطا در پیش‌بینی رتبه' }, { status: 500 })
    }

    // بروزرسانی konkur_preparation
    if (data && data.length > 0) {
      await supabase
        .from('konkur_preparation')
        .update({
          predicted_rank: data[0].predicted_rank,
          prediction_confidence: data[0].confidence,
          prediction_updated_at: new Date().toISOString(),
        })
        .eq('student_id', student_id)
    }

    return NextResponse.json({
      success: true,
      prediction: data[0],
    })
  } catch (error) {
    console.error('خطای سرور:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

