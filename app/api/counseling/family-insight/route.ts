import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { COUNSELING_API_ROLES } from '@/lib/security/sensitive-api-roles'

/** GET — پیش‌نویس یا آخرین فرم family insight */
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const supabase = await createClient()
      const studentId = new URL(req.url).searchParams.get('student_id')
      if (!studentId) {
        return NextResponse.json({ error: 'student_id الزامی است' }, { status: 400 })
      }

      const { data } = await supabase
        .from('behavioral_observations')
        .select('*')
        .eq('student_id', studentId)
        .eq('setting', 'family_insight')
        .order('observation_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!data) return NextResponse.json({ form: null })

      try {
        const parsed = JSON.parse(data.description || '{}')
        return NextResponse.json({ form: parsed, id: data.id })
      } catch {
        return NextResponse.json({ form: null })
      }
    } catch (error) {
      console.error('family-insight GET:', error)
      return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
    }
  }, { roles: COUNSELING_API_ROLES })
}

/** POST — ذخیره پیش‌نویس یا نهایی */
export async function POST(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const supabase = await createClient()
      const body = await req.json()
      const {
        student_id,
        counselor_id,
        form_data,
        ai_analysis,
        status = 'draft',
      } = body

      if (!student_id || !form_data) {
        return NextResponse.json({ error: 'داده ناقص است' }, { status: 400 })
      }

      const payload = JSON.stringify({
        form_data,
        ai_analysis: ai_analysis ?? null,
        status,
        saved_at: new Date().toISOString(),
      })

      const today = new Date().toISOString().split('T')[0]

      const { data: existing } = await supabase
        .from('behavioral_observations')
        .select('id')
        .eq('student_id', student_id)
        .eq('setting', 'family_insight')
        .order('observation_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      const row = {
        student_id,
        observer_id: counselor_id || null,
        observation_date: today,
        setting: 'family_insight',
        behaviors_observed: ['family_insight_form'],
        description: payload,
        severity: status === 'completed' ? 'moderate' : 'mild',
      }

      const { data, error } = existing
        ? await supabase
            .from('behavioral_observations')
            .update(row)
            .eq('id', existing.id)
            .select()
            .single()
        : await supabase.from('behavioral_observations').insert(row).select().single()

      if (error) throw error

      return NextResponse.json({ success: true, id: data.id, status })
    } catch (error) {
      console.error('family-insight POST:', error)
      return NextResponse.json({ error: 'خطا در ذخیره' }, { status: 500 })
    }
  }, { roles: COUNSELING_API_ROLES })
}
