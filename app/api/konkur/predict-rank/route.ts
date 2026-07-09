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

        const { data, error } = await supabase.rpc('predict_konkur_rank', {
          p_student_id: student_id,
        })

        if (error) {
          console.error('خطا در پیش‌بینی:', error)
          return NextResponse.json({ error: 'خطا در پیش‌بینی رتبه' }, { status: 500 })
        }

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
    },
    { roles: AI_USER_ROLES }
  )
}
