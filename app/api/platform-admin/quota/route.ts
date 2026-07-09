import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { secureErrorResponse } from '@/lib/security/error-handler'
import { withAuth } from '@/lib/security/api-guard'
import { PLATFORM_ADMIN_ROLES } from '@/lib/security/sensitive-api-roles'

const quotaUpdateSchema = z.object({
  key: z.enum(['class_quota', 'lottery_quota', 'school_limits']),
  value: z.record(z.unknown()),
})

const classOverrideSchema = z.object({
  class_id: z.string().uuid(),
  capacity: z.number().int().min(1).max(200).nullable(),
  notes: z.string().max(300).optional(),
})

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'settings'

        if (type === 'classes') {
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

        const { data: settings, error } = await supabase
          .from('platform_settings')
          .select('*')
          .order('key')

        if (error) throw error
        return NextResponse.json({ settings: settings || [] })
      } catch (error) {
        return secureErrorResponse(error, { context: 'GET /api/platform-admin/quota' })
      }
    },
    { roles: PLATFORM_ADMIN_ROLES }
  )
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (ctx) => {
      try {
        const supabase = await createClient()
        const body = await request.json()
        const { action } = body

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

        const { key, value } = quotaUpdateSchema.parse(body)

        const { error } = await supabase
          .from('platform_settings')
          .upsert(
            {
              key,
              value,
              updated_by: ctx.userId,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )

        if (error) throw error
        return NextResponse.json({ success: true, message: 'تنظیمات بروزرسانی شد' })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 })
        }
        return secureErrorResponse(error, { context: 'POST /api/platform-admin/quota' })
      }
    },
    { roles: PLATFORM_ADMIN_ROLES }
  )
}
