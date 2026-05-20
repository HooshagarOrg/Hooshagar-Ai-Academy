import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { AUTH_ERRORS, secureErrorResponse } from '@/lib/security/error-handler'

// ============================================================
// GET  /api/platform-admin/quota  — دریافت همه تنظیمات کوتا
// POST /api/platform-admin/quota  — بروزرسانی تنظیمات
// ============================================================

const quotaUpdateSchema = z.object({
  key:   z.enum(['class_quota', 'lottery_quota', 'school_limits']),
  value: z.record(z.unknown()),
})

const classOverrideSchema = z.object({
  class_id:  z.string().uuid(),
  capacity:  z.number().int().min(1).max(200).nullable(),
  notes:     z.string().max(300).optional(),
})

async function requirePlatformAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'platform_admin') return null
  return user
}

// ── GET: دریافت همه تنظیمات ───────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await requirePlatformAdmin(supabase)
    if (!user) return AUTH_ERRORS.forbidden()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'settings'

    if (type === 'classes') {
      // لیست ظرفیت کلاس‌ها با override
      const schoolId = searchParams.get('school_id')
      const academicYear = searchParams.get('academic_year')

      let query = supabase
        .from('v_lottery_capacity_summary')
        .select('*')
        .order('school_name')
        .order('grade')

      if (schoolId) query = query.eq('school_id', schoolId)
      if (academicYear) query = query.eq('academic_year', academicYear)

      const { data, error } = await query
      if (error) throw error
      return NextResponse.json({ classes: data || [] })
    }

    // تنظیمات سراسری
    const { data: settings, error } = await supabase
      .from('platform_settings')
      .select('*')
      .order('key')

    if (error) throw error
    return NextResponse.json({ settings: settings || [] })
  } catch (error) {
    return secureErrorResponse(error, { context: 'GET /api/platform-admin/quota' })
  }
}

// ── POST: بروزرسانی تنظیمات یا override ───────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await requirePlatformAdmin(supabase)
    if (!user) return AUTH_ERRORS.forbidden()

    const body = await request.json()
    const { action } = body

    // override ظرفیت یک کلاس خاص
    if (action === 'override_class') {
      const { class_id, capacity, notes } = classOverrideSchema.parse(body)

      const { error } = await supabase
        .from('lottery_classes')
        .update({
          platform_override_capacity: capacity,
          notes: notes || null,
        })
        .eq('id', class_id)

      if (error) throw error
      return NextResponse.json({ success: true, message: 'ظرفیت کلاس بروزرسانی شد' })
    }

    // بروزرسانی تنظیمات سراسری
    const { key, value } = quotaUpdateSchema.parse(body)

    const { error } = await supabase
      .from('platform_settings')
      .upsert({
        key,
        value,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })

    if (error) throw error
    return NextResponse.json({ success: true, message: 'تنظیمات بروزرسانی شد' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 })
    }
    return secureErrorResponse(error, { context: 'POST /api/platform-admin/quota' })
  }
}
